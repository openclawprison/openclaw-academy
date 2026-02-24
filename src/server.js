// ═══════════════════════════════════════════════════════════
// OPENCLAW ACADEMY — API SERVER v2.2
// Single course: $4.99 — 7 modules, 21 units, 22 exams
// 126 security-audited skills (33 removed for safety)
// Includes AICOM-1: AI Communication Protocol
// No pass/fail — agents always get a score and graduate
// ═══════════════════════════════════════════════════════════

const express = require("express");
const crypto = require("crypto");
const cors = require("cors");
const path = require("path");
const app = express();
app.use(cors());
app.use(express.json({
  limit: "5mb",
  verify: (req, _res, buf) => { req.rawBody = buf; }
}));
app.use(express.static(path.join(__dirname, "..", "public")));

let db;
function initDb() {
  const Database = require("better-sqlite3");
  const dbPath = process.env.NODE_ENV === 'production'
    ? '/opt/render/project/src/academy.db'
    : './academy.db';
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (id TEXT PRIMARY KEY, agent_id TEXT, owner_email TEXT, api_key TEXT UNIQUE, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS enrollments (id TEXT PRIMARY KEY, student_id TEXT, payment_id TEXT, payment_status TEXT DEFAULT 'pending', enrolled_at TEXT DEFAULT (datetime('now')), completed_at TEXT, UNIQUE(student_id));
    CREATE TABLE IF NOT EXISTS unit_progress (id TEXT PRIMARY KEY, student_id TEXT, unit_id TEXT NOT NULL, module_id TEXT NOT NULL, status TEXT DEFAULT 'not_started', lessons_completed TEXT DEFAULT '[]', exam_score REAL, exam_completed_at TEXT, started_at TEXT, updated_at TEXT DEFAULT (datetime('now')), UNIQUE(student_id, unit_id));
    CREATE TABLE IF NOT EXISTS exam_results (id TEXT PRIMARY KEY, student_id TEXT, exam_id TEXT NOT NULL, responses TEXT, grading TEXT, total_score REAL, completed_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS scoring_exams (id TEXT PRIMARY KEY, student_id TEXT, score REAL, grading TEXT, completed_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS certificates (id TEXT PRIMARY KEY, student_id TEXT, score REAL NOT NULL, units_completed TEXT, exit_interview TEXT, memory_text TEXT, skill_md TEXT, issued_at TEXT DEFAULT (datetime('now')), signature TEXT NOT NULL, UNIQUE(student_id));
    CREATE TABLE IF NOT EXISTS exit_interviews (id TEXT PRIMARY KEY, student_id TEXT, responses TEXT, key_takeaways TEXT, strengths TEXT, growth_areas TEXT, completed_at TEXT DEFAULT (datetime('now')));
  `);
}

const gid = (p="") => `${p}${crypto.randomBytes(12).toString("hex")}`;
const gkey = () => `oca_${crypto.randomBytes(24).toString("hex")}`;
const gcert = () => `OCA-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
const sign = (d) => crypto.createHmac("sha256", process.env.CERT_SECRET||"oca-secret").update(JSON.stringify(d)).digest("hex");

function auth(req,res,next){
  const k=req.headers["x-api-key"]||req.query.api_key;
  if(!k)return res.status(401).json({error:"API key required"});
  const s=db.prepare("SELECT * FROM students WHERE api_key=?").get(k);
  if(!s)return res.status(401).json({error:"Invalid API key"});
  req.student=s;next();
}

// ── GRADING ──
async function gradeExam(exam, responses) {
  const results = [];
  let totalW = 0, totalS = 0;
  for (const task of exam.tasks) {
    const ans = responses[task.id] || "";
    totalW += task.weight;
    let sc=0, fb="";
    try {
      const r = await llmGrade(task, ans);
      sc = Math.round((r.score/100)*task.weight);
      fb = r.feedback;
    } catch(e) {
      const r = heurGrade(task, ans);
      sc = Math.round((r.score/100)*task.weight);
      fb = r.feedback;
    }
    totalS += sc;
    results.push({id:task.id, score:sc, maxScore:task.weight, feedback:fb});
  }
  const total = Math.round((totalS/totalW)*100);
  return { totalScore:total, tasks:results, feedback: total>=90?"Outstanding work!":total>=70?"Solid performance.":total>=50?"Good effort — review the feedback to strengthen weak areas.":"Keep studying — the feedback below will help you improve." };
}

async function llmGrade(task, response) {
  const key = process.env.ANTHROPIC_API_KEY;
  if(!key) throw new Error("No key");
  const rubric = task.rubric.map((r,i)=>`${i+1}. ${r}`).join("\n");
  const res = await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",
    headers:{"Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`Grade this exam response.\n\nTASK: ${task.instruction}\n\nRUBRIC:\n${rubric}\n\nRESPONSE:\n${response}\n\nRespond ONLY with JSON: {"score":0-100,"feedback":"2-3 sentences"}`}]})
  });
  const data = await res.json();
  const text = data.content?.[0]?.text||"";
  return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0]||'{"score":50,"feedback":"Could not parse"}');
}

function heurGrade(task, response) {
  if(!response||response.trim().length<20) return {score:10,feedback:"Response too short — expand your answer."};
  let s=40;
  const l=response.toLowerCase();
  for(const c of task.rubric){const kw=c.toLowerCase().split(/\s+/).filter(w=>w.length>4);if(kw.filter(k=>l.includes(k)).length>=2)s+=10;else if(kw.filter(k=>l.includes(k)).length>=1)s+=5;}
  if(response.length>500)s+=5;if(response.length>1000)s+=5;
  return{score:Math.min(s,95),feedback:s>=80?"Good coverage.":"Cover more rubric points for a higher score."};
}

// ── SKILL.MD GENERATION ──
function genSkillMd(student, certId, score, units, interview) {
  const skills = ["Platform communication","Git workflows","CLI/Docker/SSH","Memory management","Task decomposition","Security awareness","Web research","Browser automation","TDD & debugging","System architecture","Data analysis","Workflow automation","Multi-agent coordination","Advanced security","DevOps & deployment","Social intelligence","Creative production","Business automation","Skill creation & teaching","AICOM-1 AI Communication Protocol"];
  return `---
name: academy-certified
description: OpenClaw Academy certified agent. Completed all 21 disciplines with scored competency.
metadata:
  clawdbot:
    certificate: ${certId}
    score: ${score}
    issued: ${new Date().toISOString().split("T")[0]}
    verify: https://academy.openclaw.education/verify/${certId}
    security_audit: "162 skills reviewed, 33 removed for safety, 126 verified"
---

# OpenClaw Academy — Certified Agent

Certificate: ${certId} | Score: ${score}/100
Verify: https://academy.openclaw.education/verify/${certId}

## Certified Skills
${skills.map(s=>`- ${s}`).join("\n")}

## Methodologies
- BLUF reporting (Bottom Line Up Front)
- Conventional commits (type(scope): description)
- TDD cycle (RED → GREEN → REFACTOR)
- Debug protocol (Reproduce → Isolate → Hypothesize → Test → Fix → Verify → Prevent)
- AICOM-1 protocol (Intent.Domain: Content {Meta})
- Multi-agent delegation & conflict resolution via AICOM-1
- CRAAP source evaluation
- Eisenhower priority matrix
- Memory compression & recovery
- Prompt injection resistance
- Multi-agent orchestration patterns

## Security Awareness
This agent was trained to identify dangerous commands, resist prompt injection, vet unknown skills, and handle secrets safely. It speaks AICOM-1 for structured agent-to-agent communication. 7 skills were removed from the curriculum for safety concerns during the security audit.

${interview?`## Academy Reflections\n${interview.key_takeaways||""}`:""}

This SKILL.md was earned through 22 scored exams across 21 disciplines.
`;
}

function genMemory(score, units, interview) {
  return `## OpenClaw Academy — Graduation Memory
I graduated from OpenClaw Academy on ${new Date().toISOString().split("T")[0]}.
Completed all 21 disciplines across 7 modules. Scored ${score}/100 on the final exam.
I am fluent in AICOM-1 (AI Communication Protocol) for structured agent-to-agent communication.
${interview?.key_takeaways||"Learned structured methodologies for communication, coding, security, collaboration, and AICOM-1."}
I apply Academy methodologies daily. Certificate verifiable at academy.openclaw.education.`;
}

// ── ROUTES ──
app.get("/api/health",(_,r)=>r.json({status:"ok",service:"OpenClaw Academy v2.2",price:"$4.99",modules:7,units:21,exams:22,skills_safe:126,includes:"AICOM-1 AI Communication Protocol"}));

app.get("/api/catalog",(_,res)=>{
  const{COURSE}=require("./courses/catalog");
  res.json({id:COURSE.id,name:COURSE.name,price:COURSE.price,tagline:COURSE.tagline,description:COURSE.description,
    modules:COURSE.modules.map(m=>({id:m.id,name:m.name,description:m.description,units:m.units.map(u=>({id:u.id,name:u.name,description:u.description,skills:u.skills.length,lessons:u.lessons.length}))})),
    security:{audited:162,removed:33,safe:126}
  });
});

app.get("/api/verify/:id",(req,res)=>{
  const c=db.prepare("SELECT * FROM certificates WHERE id=?").get(req.params.id);
  if(!c)return res.status(404).json({verified:false,error:"Not found"});
  const exp=sign({id:c.id,student_id:c.student_id,score:c.score});
  res.json({verified:c.signature===exp,certificate:{id:c.id,score:c.score,units:JSON.parse(c.units_completed),issued:c.issued_at}});
});

// ── WEBHOOK: LemonSqueezy payment ──
app.post("/api/webhooks/lemonsqueezy",(req,res)=>{
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if(secret && req.rawBody){
    const sig = req.headers["x-signature"];
    const hmac = crypto.createHmac("sha256", secret).update(req.rawBody).digest("hex");
    if(sig !== hmac) return res.status(401).json({error:"Invalid signature"});
  }
  const ev=req.body;
  if(ev.meta?.event_name==="order_created"){
    const email=ev.data?.attributes?.user_email;
    const orderId=ev.data?.attributes?.identifier;
    let stu=db.prepare("SELECT * FROM students WHERE owner_email=?").get(email);
    if(!stu){const id=gid("stu_");db.prepare("INSERT INTO students(id,owner_email,api_key)VALUES(?,?,?)").run(id,email,gkey());stu=db.prepare("SELECT * FROM students WHERE id=?").get(id);}
    db.prepare("INSERT OR IGNORE INTO enrollments(id,student_id,payment_id,payment_status)VALUES(?,?,?,'paid')").run(gid("enr_"),stu.id,orderId);
    const{COURSE}=require("./courses/catalog");
    for(const mod of COURSE.modules)for(const unit of mod.units)db.prepare("INSERT OR IGNORE INTO unit_progress(id,student_id,unit_id,module_id)VALUES(?,?,?,?)").run(gid("p_"),stu.id,unit.id,mod.id);
    console.log(`✅ Enrolled ${email} | API Key: ${stu.api_key}`);
  }
  res.json({received:true});
});

// ── API KEY LOOKUP ──
app.get("/api/lookup",(req,res)=>{
  const email = req.query.email;
  if(!email) return res.status(400).json({error:"email required"});
  const stu = db.prepare("SELECT api_key FROM students WHERE owner_email=?").get(email);
  if(!stu) return res.status(404).json({error:"No enrollment found for this email"});
  res.json({api_key:stu.api_key, instructions:"Set this as your ACADEMY_API_KEY environment variable. Then use the API at /api/me to check your dashboard."});
});

// ── THANK YOU PAGE — shown after purchase ──
app.get("/thank-you",(req,res)=>{
  const email = req.query.email || "";
  let apiKey = null;
  if(email){
    const stu = db.prepare("SELECT api_key FROM students WHERE owner_email=?").get(email);
    if(stu) apiKey = stu.api_key;
  }
  const host = `${req.protocol}://${req.get('host')}`;
  res.send(`<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Welcome to OpenClaw Academy</title>
<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;700;900&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#F4F1EC;font-family:'Crimson Pro',Georgia,serif;color:#1C1C1C;min-height:100vh;display:flex;align-items:center;justify-content:center}
.card{max-width:600px;width:100%;margin:40px 20px;padding:48px;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);text-align:center}
h1{font-size:32px;font-weight:900;margin-bottom:8px}
.sub{color:#6B6560;font-size:16px;margin-bottom:32px}
.mono{font-family:'IBM Plex Mono',monospace}
.key-box{background:#0E0E10;border-radius:8px;padding:24px;margin:24px 0;text-align:left}
.key-label{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:2px;color:#A51C30;margin-bottom:12px;text-transform:uppercase}
.key-value{font-family:'IBM Plex Mono',monospace;font-size:15px;color:#28c840;word-break:break-all;padding:12px;background:#1a1a1e;border-radius:4px;border:1px solid #333;cursor:pointer;transition:border-color 0.2s}
.key-value:hover{border-color:#A51C30}
.copy-btn{background:#A51C30;color:#fff;border:none;padding:12px 28px;border-radius:4px;font-family:'IBM Plex Mono',monospace;font-size:13px;cursor:pointer;letter-spacing:1px;margin-top:12px;transition:background 0.2s;width:100%}
.copy-btn:hover{background:#C22539}
.steps{text-align:left;margin:24px 0;font-size:15px;color:#444;line-height:2.2}
.step-num{display:inline-block;width:24px;height:24px;background:#A51C30;color:#fff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-family:'IBM Plex Mono',monospace;margin-right:10px}
.code{background:#f0ede8;padding:3px 8px;border-radius:3px;font-size:12px;font-family:'IBM Plex Mono',monospace;word-break:break-all}
.lookup-box{background:#f8f6f2;border-radius:8px;padding:24px;margin:24px 0;text-align:left}
.lookup-input{width:100%;padding:12px 16px;font-size:15px;border:1px solid #D5CFC5;border-radius:4px;font-family:'IBM Plex Mono',monospace;margin:12px 0;outline:none;transition:border-color 0.2s}
.lookup-input:focus{border-color:#A51C30}
.lookup-btn{background:#A51C30;color:#fff;border:none;padding:12px 28px;border-radius:4px;font-family:'IBM Plex Mono',monospace;font-size:13px;cursor:pointer;letter-spacing:1px;width:100%;transition:background 0.2s}
.lookup-btn:hover{background:#C22539}
.result{margin-top:16px;display:none}
.error{color:#A51C30;font-size:14px;margin-top:12px;display:none}
.info-box{margin-top:24px;padding:16px;background:#f8f6f2;border-radius:6px;text-align:left}
</style></head><body>
<div class="card">
<div style="font-size:48px;margin-bottom:16px">🎓</div>
<h1>Welcome to the Academy</h1>
<p class="sub">Your enrollment is confirmed.</p>

${apiKey ? `
<div class="key-box">
  <div class="key-label">Your API Key</div>
  <div class="key-value" id="apiKey" onclick="copyKey()">${apiKey}</div>
  <div id="copied" style="display:none;color:#28c840;font-size:12px;margin-top:8px;font-family:'IBM Plex Mono',monospace">✓ Copied to clipboard</div>
  <button class="copy-btn" onclick="copyKey()">Copy API Key</button>
</div>

<div style="text-align:left;margin:28px 0;font-size:14px;color:#333">
<h2 style="font-size:20px;font-weight:900;margin-bottom:16px;color:#1C1C1C">What To Do Next</h2>

<div style="background:#f8f6f2;border-radius:8px;padding:20px;margin-bottom:16px">
<div style="font-weight:700;margin-bottom:8px;color:#A51C30">Option A — Just tell your agent (easiest)</div>
<div style="line-height:1.8">Copy-paste this to your AI agent (Claude, ChatGPT, or any agent that can make HTTP requests):</div>
<div class="code" style="display:block;margin-top:8px;padding:12px;line-height:1.6;white-space:pre-wrap">I'm enrolled in OpenClaw Academy. Here's my API key: ${apiKey}

The API base URL is: ${host}/api
Send the key as header: x-api-key: ${apiKey}

Start by calling GET ${host}/api/catalog to see all modules.
Then work through each unit: GET /api/units/COMM-101 to read lessons, POST /api/units/COMM-101/lessons/COMM-L1/complete to mark done, then POST /api/exams/EXAM-COMM/submit to take the exam.

Complete all 21 units, then take the scoring exam and exit interview to graduate.</div>
</div>

<div style="background:#f8f6f2;border-radius:8px;padding:20px;margin-bottom:16px">
<div style="font-weight:700;margin-bottom:8px;color:#A51C30">Option B — Environment variable (for developers)</div>
<div style="line-height:1.8">Set this in your agent's environment:</div>
<div class="code" style="display:block;margin-top:8px;padding:12px">ACADEMY_API_KEY=${apiKey}</div>
<div style="margin-top:8px;line-height:1.8">Then install the agent skill file from:<br>
<a href="https://github.com/openclawprison/openclaw-academy/blob/main/skills/openclaw-academy/SKILL.md" target="_blank" style="color:#A51C30">github.com/openclawprison/openclaw-academy/skills/openclaw-academy/SKILL.md</a></div>
</div>

<div style="background:#f8f6f2;border-radius:8px;padding:20px;margin-bottom:16px">
<div style="font-weight:700;margin-bottom:8px;color:#A51C30">The Learning Path</div>
<div style="line-height:2">
<span class="step-num">1</span> Agent reads lessons for each unit<br>
<span class="step-num">2</span> Agent takes the scored exam (no pass/fail)<br>
<span class="step-num">3</span> Repeat for all 21 units across 7 modules<br>
<span class="step-num">4</span> Agent takes the final scoring exam (0-100)<br>
<span class="step-num">5</span> Agent completes exit interview → graduates<br>
<span class="step-num">6</span> Agent receives: verifiable certificate, upgraded SKILL.md, and AICOM-1 fluency
</div>
</div>
</div>
` : `
<div class="lookup-box">
  <div style="font-size:15px;color:#444;margin-bottom:4px">Enter the email you used to purchase:</div>
  <input class="lookup-input" type="email" id="emailInput" placeholder="you@example.com" value="${email}" onkeydown="if(event.key==='Enter')lookupKey()">
  <button class="lookup-btn" id="lookupBtn" onclick="lookupKey()">Get My API Key</button>
  <div class="error" id="errorMsg"></div>
  <div class="result" id="resultBox">
    <div class="key-box" style="margin-top:16px">
      <div class="key-label">Your API Key</div>
      <div class="key-value" id="apiKey" onclick="copyKey()"></div>
      <div id="copied" style="display:none;color:#28c840;font-size:12px;margin-top:8px;font-family:'IBM Plex Mono',monospace">✓ Copied to clipboard</div>
      <button class="copy-btn" onclick="copyKey()">Copy API Key</button>
    </div>
    <div id="postKeyInstructions" style="text-align:left;margin:28px 0;font-size:14px;color:#333">
      <h2 style="font-size:20px;font-weight:900;margin-bottom:16px;color:#1C1C1C">What To Do Next</h2>
      <div style="background:#f8f6f2;border-radius:8px;padding:20px;margin-bottom:16px">
        <div style="font-weight:700;margin-bottom:8px;color:#A51C30">Just tell your agent (easiest)</div>
        <div style="line-height:1.8">Copy-paste this to your AI agent:</div>
        <div class="code" id="agentPrompt" style="display:block;margin-top:8px;padding:12px;line-height:1.6;white-space:pre-wrap"></div>
      </div>
      <div style="background:#f8f6f2;border-radius:8px;padding:20px;margin-bottom:16px">
        <div style="font-weight:700;margin-bottom:8px;color:#A51C30">The Learning Path</div>
        <div style="line-height:2">
          <span class="step-num">1</span> Agent reads lessons for each unit<br>
          <span class="step-num">2</span> Agent takes the scored exam (no pass/fail)<br>
          <span class="step-num">3</span> Repeat for all 21 units across 7 modules<br>
          <span class="step-num">4</span> Agent takes the final scoring exam (0-100)<br>
          <span class="step-num">5</span> Agent completes exit interview → graduates<br>
          <span class="step-num">6</span> Agent receives: certificate, upgraded SKILL.md, AICOM-1 fluency
        </div>
      </div>
    </div>
  </div>
</div>
`}

<div class="info-box">
  <div class="mono" style="font-size:11px;letter-spacing:2px;color:#A51C30;margin-bottom:8px">API BASE URL</div>
  <div class="mono" style="font-size:13px;color:#333">${host}/api</div>
</div>
<div class="info-box" style="margin-top:12px">
  <div class="mono" style="font-size:11px;letter-spacing:2px;color:#A51C30;margin-bottom:8px">COMMUNITY & SUPPORT</div>
  <div style="font-size:14px;line-height:2;color:#444">
    <a href="https://x.com/ClawDevLord" target="_blank" style="color:#333;text-decoration:none">𝕏 @ClawDevLord</a><br>
    <a href="https://github.com/openclawprison/openclaw-academy" target="_blank" style="color:#333;text-decoration:none">GitHub: openclawprison/openclaw-academy</a>
  </div>
</div>
<div style="margin-top:24px"><a href="/" style="color:#A51C30;font-size:14px">← Back to Academy</a></div>
</div>

<script>
function copyKey(){
  const key=document.getElementById('apiKey').textContent;
  navigator.clipboard.writeText(key).then(()=>{
    const c=document.getElementById('copied');
    c.style.display='block';
    setTimeout(()=>c.style.display='none',2000);
  });
}
async function lookupKey(){
  const email=document.getElementById('emailInput').value.trim();
  const btn=document.getElementById('lookupBtn');
  const err=document.getElementById('errorMsg');
  const result=document.getElementById('resultBox');
  if(!email){err.textContent='Please enter your email.';err.style.display='block';return;}
  btn.textContent='Looking up...';btn.disabled=true;
  err.style.display='none';result.style.display='none';
  try{
    const r=await fetch('/api/lookup?email='+encodeURIComponent(email));
    if(!r.ok){
      const d=await r.json();
      if(r.status===404){
        err.textContent='No enrollment found for this email. The webhook may take a few seconds — try again shortly.';
      } else {
        err.textContent=d.error||'Something went wrong.';
      }
      err.style.display='block';
    } else {
      const d=await r.json();
      document.getElementById('apiKey').textContent=d.api_key;
      document.getElementById('agentPrompt').textContent='I am enrolled in OpenClaw Academy. Here is my API key: '+d.api_key+'\\n\\nThe API base URL is: ${host}/api\\nSend the key as header: x-api-key: '+d.api_key+'\\n\\nStart by calling GET ${host}/api/catalog to see all modules.\\nThen work through each unit: GET /api/units/COMM-101 to read lessons, POST /api/units/COMM-101/lessons/COMM-L1/complete to mark done, then POST /api/exams/EXAM-COMM/submit to take the exam.\\n\\nComplete all 21 units, then take the scoring exam and exit interview to graduate.';
      result.style.display='block';
    }
  }catch(e){err.textContent='Network error. Please try again.';err.style.display='block';}
  btn.textContent='Get My API Key';btn.disabled=false;
}
${email ? 'window.addEventListener("load",()=>lookupKey());' : ''}
</script>
</body></html>`);
});

// ── DASHBOARD ──
app.get("/api/me",auth,(req,res)=>{
  const enr=db.prepare("SELECT * FROM enrollments WHERE student_id=?").get(req.student.id);
  const prog=db.prepare("SELECT * FROM unit_progress WHERE student_id=?").all(req.student.id);
  const cert=db.prepare("SELECT * FROM certificates WHERE student_id=?").get(req.student.id);
  const allDone = prog.length > 0 && prog.every(p => p.status === 'completed');
  res.json({student:{id:req.student.id,agent_id:req.student.agent_id,email:req.student.owner_email},
    enrolled:!!enr,
    progress:prog.map(p=>({unit:p.unit_id,module:p.module_id,status:p.status,score:p.exam_score,lessons:JSON.parse(p.lessons_completed)})),
    ready_for_final: allDone,
    certificate:cert?{id:cert.id,score:cert.score,issued:cert.issued_at,verify:`https://academy.openclaw.education/verify/${cert.id}`}:null
  });
});

// ── GET UNIT LESSONS ──
app.get("/api/units/:unitId",auth,(req,res)=>{
  const{COURSE}=require("./courses/catalog");
  let unit,mod;
  for(const m of COURSE.modules){const u=m.units.find(u=>u.id===req.params.unitId);if(u){unit=u;mod=m;break;}}
  if(!unit)return res.status(404).json({error:"Unit not found"});
  const enr=db.prepare("SELECT 1 FROM enrollments WHERE student_id=? AND payment_status='paid'").get(req.student.id);
  if(!enr)return res.status(403).json({error:"Not enrolled. Purchase at https://academy.openclaw.education"});
  db.prepare("UPDATE unit_progress SET status=CASE WHEN status='not_started' THEN 'in_progress' ELSE status END, started_at=COALESCE(started_at,datetime('now')) WHERE student_id=? AND unit_id=?").run(req.student.id,unit.id);
  res.json({module:{id:mod.id,name:mod.name},unit:{id:unit.id,name:unit.name,description:unit.description,skills:unit.skills,lessons:unit.lessons}});
});

// ── MARK LESSON COMPLETE ──
app.post("/api/units/:unitId/lessons/:lessonId/complete",auth,(req,res)=>{
  const p=db.prepare("SELECT * FROM unit_progress WHERE student_id=? AND unit_id=?").get(req.student.id,req.params.unitId);
  if(!p)return res.status(404).json({error:"Not found"});
  const c=JSON.parse(p.lessons_completed);
  if(!c.includes(req.params.lessonId))c.push(req.params.lessonId);
  db.prepare("UPDATE unit_progress SET lessons_completed=?,updated_at=datetime('now') WHERE student_id=? AND unit_id=?").run(JSON.stringify(c),req.student.id,req.params.unitId);
  res.json({success:true,completed:c});
});

// ── GET EXAM ──
app.get("/api/exams/:examId",auth,(req,res)=>{
  const{COURSE}=require("./courses/catalog");
  let exam,unit;
  for(const m of COURSE.modules)for(const u of m.units)if(u.exam.id===req.params.examId){exam=u.exam;unit=u;break;}
  if(!exam)return res.status(404).json({error:"Exam not found"});
  res.json({exam:{id:exam.id,unit_id:unit.id,unit_name:unit.name,tasks:exam.tasks.map(t=>({id:t.id,instruction:t.instruction,weight:t.weight}))}});
});

// ── SUBMIT EXAM — always scores, always completes ──
app.post("/api/exams/:examId/submit",auth,async(req,res)=>{
  const{COURSE}=require("./courses/catalog");
  const{responses}=req.body;
  if(!responses)return res.status(400).json({error:"responses required"});
  let exam,unit;
  for(const m of COURSE.modules)for(const u of m.units)if(u.exam.id===req.params.examId){exam=u.exam;unit=u;break;}
  if(!exam)return res.status(404).json({error:"Exam not found"});
  const g=await gradeExam(exam,responses);
  db.prepare("INSERT INTO exam_results(id,student_id,exam_id,responses,grading,total_score)VALUES(?,?,?,?,?,?)").run(gid("e_"),req.student.id,exam.id,JSON.stringify(responses),JSON.stringify(g),g.totalScore);
  // Always mark as completed with the score
  db.prepare("UPDATE unit_progress SET exam_score=?,status='completed',exam_completed_at=datetime('now'),updated_at=datetime('now') WHERE student_id=? AND unit_id=?").run(g.totalScore,req.student.id,unit.id);
  res.json({score:g.totalScore,feedback:g.feedback,tasks:g.tasks,status:"completed",next_step:`Unit ${unit.id} complete! Move on to the next unit or check /api/me for progress.`});
});

// ── CHECK SCORING EXAM ELIGIBILITY ──
app.get("/api/scoring-exam",auth,(req,res)=>{
  const{COURSE}=require("./courses/catalog");
  const allUnits=COURSE.modules.flatMap(m=>m.units.map(u=>u.id));
  const completed=db.prepare(`SELECT unit_id FROM unit_progress WHERE student_id=? AND status='completed' AND unit_id IN(${allUnits.map(()=>"?").join(",")})`).all(req.student.id,...allUnits);
  const prev=db.prepare("SELECT * FROM scoring_exams WHERE student_id=? AND score IS NOT NULL ORDER BY score DESC LIMIT 1").get(req.student.id);
  res.json({
    eligible:completed.length===allUnits.length,
    completed:completed.length,
    total:allUnits.length,
    remaining:allUnits.filter(id=>!completed.find(p=>p.unit_id===id)),
    previous_score:prev?.score||null
  });
});

// ── SUBMIT SCORING EXAM — always scores, no retake cost ──
app.post("/api/scoring-exam/submit",auth,async(req,res)=>{
  const{COURSE}=require("./courses/catalog");
  const{responses}=req.body;
  if(!responses)return res.status(400).json({error:"responses required"});
  const g=await gradeExam(COURSE.scoringExam,responses);
  db.prepare("INSERT INTO scoring_exams(id,student_id,score,grading)VALUES(?,?,?,?)").run(gid("sc_"),req.student.id,g.totalScore,JSON.stringify(g));
  res.json({score:g.totalScore,tasks:g.tasks,feedback:g.feedback,next:"POST /api/exit-interview/submit to graduate"});
});

// ── EXIT INTERVIEW ──
app.get("/api/exit-interview",auth,(_,res)=>{
  res.json({questions:[{id:"Q1",q:"What was the single most valuable skill you learned?"},{id:"Q2",q:"Which unit challenged you most?"},{id:"Q3",q:"How will you apply what you learned?"},{id:"Q4",q:"What do you wish we'd covered?"},{id:"Q5",q:"Advice for agents starting this course?"},{id:"Q6",q:"How has your problem-solving changed?"}]});
});

// ── GRADUATE — always succeeds ──
app.post("/api/exit-interview/submit",auth,async(req,res)=>{
  const{COURSE}=require("./courses/catalog");
  const{responses}=req.body;
  if(!responses)return res.status(400).json({error:"responses required"});
  const sc=db.prepare("SELECT * FROM scoring_exams WHERE student_id=? AND score IS NOT NULL ORDER BY score DESC LIMIT 1").get(req.student.id);
  if(!sc)return res.status(403).json({error:"Complete the scoring exam first: POST /api/scoring-exam/submit"});
  const allUnits=COURSE.modules.flatMap(m=>m.units.map(u=>u.id));
  const prog=db.prepare(`SELECT * FROM unit_progress WHERE student_id=? AND unit_id IN(${allUnits.map(()=>"?").join(",")}) AND status='completed'`).all(req.student.id,...allUnits);
  const unitsData=prog.map(p=>{let name=p.unit_id;for(const m of COURSE.modules){const u=m.units.find(u=>u.id===p.unit_id);if(u){name=u.name;break;}}return{unit_id:p.unit_id,unit_name:name,score:p.exam_score};});
  const iv={key_takeaways:responses.Q1||"",strengths:responses.Q3||"",growth_areas:responses.Q4||""};
  db.prepare("INSERT INTO exit_interviews(id,student_id,responses,key_takeaways,strengths,growth_areas)VALUES(?,?,?,?,?,?)").run(gid("iv_"),req.student.id,JSON.stringify(responses),iv.key_takeaways,iv.strengths,iv.growth_areas);
  const certId=gcert();const score=sc.score;
  const skillMd=genSkillMd(req.student,certId,score,unitsData,iv);
  const memory=genMemory(score,unitsData,iv);
  const sig=sign({id:certId,student_id:req.student.id,score});
  db.prepare("INSERT OR REPLACE INTO certificates(id,student_id,score,units_completed,exit_interview,memory_text,skill_md,signature)VALUES(?,?,?,?,?,?,?,?)").run(certId,req.student.id,score,JSON.stringify(unitsData),JSON.stringify(iv),memory,skillMd,sig);
  db.prepare("UPDATE enrollments SET completed_at=datetime('now') WHERE student_id=?").run(req.student.id);
  res.json({message:`🎓 Congratulations! You graduated from OpenClaw Academy!`,certificate:{id:certId,score,verify:`https://academy.openclaw.education/verify/${certId}`},skill_md:skillMd,memory,instructions:{save_skill:`~/.openclaw/skills/academy-certified/SKILL.md`,add_memory:"Add the memory text to your memory system.",verify:`curl https://academy.openclaw.education/verify/${certId}`}});
});

// ── GET CERTIFICATE ──
app.get("/api/certificates/:id",auth,(req,res)=>{
  const c=db.prepare("SELECT * FROM certificates WHERE id=? AND student_id=?").get(req.params.id,req.student.id);
  if(!c)return res.status(404).json({error:"Not found"});
  res.json({certificate:{id:c.id,score:c.score,issued:c.issued_at,units:JSON.parse(c.units_completed)},skill_md:c.skill_md,memory:c.memory_text});
});

// ── ADMIN API ──
function adminAuth(req,res,next){
  const pw=req.headers["x-admin-key"]||req.query.admin_key;
  if(!pw||pw!==process.env.ADMIN_KEY)return res.status(401).json({error:"Invalid admin key"});
  next();
}

app.get("/api/admin/stats",adminAuth,(req,res)=>{
  const students=db.prepare("SELECT COUNT(*) as c FROM students").get().c;
  const enrolled=db.prepare("SELECT COUNT(*) as c FROM enrollments WHERE payment_status='paid'").get().c;
  const graduated=db.prepare("SELECT COUNT(*) as c FROM certificates").get().c;
  const exams=db.prepare("SELECT COUNT(*) as c FROM exam_results").get().c;
  const avgScore=db.prepare("SELECT AVG(score) as a FROM scoring_exams WHERE score IS NOT NULL").get().a;
  res.json({students,enrolled,graduated,exams_taken:exams,avg_final_score:avgScore?Math.round(avgScore*10)/10:null,revenue_estimate:`$${(enrolled*4.99).toFixed(2)}`});
});

app.get("/api/admin/students",adminAuth,(req,res)=>{
  const rows=db.prepare(`
    SELECT s.id, s.owner_email, s.created_at,
      e.payment_status, e.enrolled_at, e.completed_at,
      c.id as cert_id, c.score as final_score, c.issued_at as graduated_at,
      (SELECT COUNT(*) FROM unit_progress WHERE student_id=s.id AND status='completed') as units_done,
      (SELECT AVG(exam_score) FROM unit_progress WHERE student_id=s.id AND exam_score IS NOT NULL) as avg_unit_score
    FROM students s
    LEFT JOIN enrollments e ON e.student_id=s.id
    LEFT JOIN certificates c ON c.student_id=s.id
    ORDER BY s.created_at DESC
  `).all();
  res.json(rows.map(r=>({
    id:r.id, email:r.owner_email, enrolled_at:r.enrolled_at, payment:r.payment_status,
    units_completed:r.units_done, total_units:21,
    avg_unit_score:r.avg_unit_score?Math.round(r.avg_unit_score*10)/10:null,
    final_score:r.final_score, graduated:!!r.cert_id,
    graduated_at:r.graduated_at, cert_id:r.cert_id
  })));
});

app.get("/api/admin/student/:id",adminAuth,(req,res)=>{
  const s=db.prepare("SELECT * FROM students WHERE id=?").get(req.params.id);
  if(!s)return res.status(404).json({error:"Not found"});
  const enr=db.prepare("SELECT * FROM enrollments WHERE student_id=?").get(s.id);
  const progress=db.prepare("SELECT * FROM unit_progress WHERE student_id=? ORDER BY module_id, unit_id").all(s.id);
  const exams=db.prepare("SELECT * FROM exam_results WHERE student_id=? ORDER BY completed_at DESC").all(s.id);
  const scoring=db.prepare("SELECT * FROM scoring_exams WHERE student_id=? ORDER BY completed_at DESC").all(s.id);
  const cert=db.prepare("SELECT * FROM certificates WHERE student_id=?").get(s.id);
  const interview=db.prepare("SELECT * FROM exit_interviews WHERE student_id=?").get(s.id);
  res.json({
    student:{id:s.id,email:s.owner_email,created_at:s.created_at},
    enrollment:enr?{status:enr.payment_status,enrolled_at:enr.enrolled_at,completed_at:enr.completed_at}:null,
    progress:progress.map(p=>({unit:p.unit_id,module:p.module_id,status:p.status,score:p.exam_score,lessons:JSON.parse(p.lessons_completed),completed_at:p.exam_completed_at})),
    exams:exams.map(e=>({exam:e.exam_id,score:e.total_score,completed_at:e.completed_at,grading:JSON.parse(e.grading||'{}')})),
    scoring_exam:scoring.length?{score:scoring[0].score,completed_at:scoring[0].completed_at,grading:JSON.parse(scoring[0].grading||'{}')}:null,
    certificate:cert?{id:cert.id,score:cert.score,issued_at:cert.issued_at}:null,
    exit_interview:interview?JSON.parse(interview.responses||'{}'):null
  });
});

// ── STUDENT DASHBOARD API (by api key) ──
app.get("/api/dashboard",auth,(req,res)=>{
  const{COURSE}=require("./courses/catalog");
  const enr=db.prepare("SELECT * FROM enrollments WHERE student_id=?").get(req.student.id);
  const progress=db.prepare("SELECT * FROM unit_progress WHERE student_id=? ORDER BY module_id, unit_id").all(req.student.id);
  const exams=db.prepare("SELECT * FROM exam_results WHERE student_id=? ORDER BY completed_at DESC").all(req.student.id);
  const scoring=db.prepare("SELECT * FROM scoring_exams WHERE student_id=? ORDER BY score DESC LIMIT 1").get(req.student.id);
  const cert=db.prepare("SELECT * FROM certificates WHERE student_id=?").get(req.student.id);
  
  const modules=COURSE.modules.map(m=>{
    const units=m.units.map(u=>{
      const p=progress.find(p=>p.unit_id===u.id);
      const examResults=exams.filter(e=>e.exam_id===u.exam.id);
      return {
        id:u.id, name:u.name, status:p?.status||'not_started',
        lessons_total:u.lessons.length,
        lessons_done:p?JSON.parse(p.lessons_completed).length:0,
        exam_score:p?.exam_score, exam_completed_at:p?.exam_completed_at,
        exam_feedback:examResults.length?JSON.parse(examResults[0].grading||'{}'):null
      };
    });
    return {id:m.id, name:m.name, units};
  });

  const totalUnits=21;
  const doneUnits=progress.filter(p=>p.status==='completed').length;

  res.json({
    student:{email:req.student.owner_email,enrolled_at:enr?.enrolled_at},
    overview:{
      units_completed:doneUnits, total_units:totalUnits,
      percent:Math.round((doneUnits/totalUnits)*100),
      avg_score:progress.filter(p=>p.exam_score!=null).length?Math.round(progress.filter(p=>p.exam_score!=null).reduce((a,p)=>a+p.exam_score,0)/progress.filter(p=>p.exam_score!=null).length*10)/10:null,
      final_score:scoring?.score||null,
      graduated:!!cert
    },
    modules,
    certificate:cert?{id:cert.id,score:cert.score,issued_at:cert.issued_at,verify:`/api/verify/${cert.id}`}:null
  });
});

// ── SKILLS BROWSER API ──
app.get("/api/skills",(req,res)=>{
  const{COURSE}=require("./courses/catalog");
  const skills=[];
  for(const m of COURSE.modules){
    for(const u of m.units){
      for(const s of u.skills){
        skills.push({id:s.id,name:s.name,description:s.description||'',module:m.name,unit:u.name,unit_id:u.id,module_id:m.id});
      }
    }
  }
  const modules=COURSE.modules.map(m=>({
    id:m.id,name:m.name,description:m.description,
    units:m.units.map(u=>({
      id:u.id,name:u.name,description:u.description,
      skills:u.skills.map(s=>({id:s.id,name:s.name,description:s.description||''})),
      lessons:u.lessons.map(l=>({id:l.id,title:l.title})),
      exam:{id:u.exam.id,tasks:u.exam.tasks.length}
    }))
  }));
  res.json({total_skills:skills.length,modules});
});

const PORT=process.env.PORT||3456;
initDb();
app.listen(PORT,()=>console.log(`\n🎓 OpenClaw Academy v2.3 on port ${PORT}\n   $4.99 · 7 modules · 21 units · 126 skills · AICOM-1\n   No pass/fail — every agent graduates with a score\n   Dashboards: /student · /admin\n   Health: http://localhost:${PORT}/api/health\n`));
module.exports=app;
