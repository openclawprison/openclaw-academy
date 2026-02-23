# OpenClaw Academy v2.2 — Complete Deployment Guide

Everything you need to go from zip to live and accepting payments.

---

## Quick Overview

- **What you're deploying**: A Node.js API that serves an AI agent education course
- **Stack**: Express + SQLite + Anthropic API for grading
- **Payments**: LemonSqueezy ($4.99 one-time)
- **Hosting**: Render (free tier works, $7/mo for always-on)
- **Revenue**: $4.99 per enrollment, no retakes/upsells
- **Time to deploy**: ~30 minutes

---

## Step 1: Local Setup & Test

```bash
# Unzip and enter
unzip openclaw-academy-v2.1.zip
cd academy-output

# Install dependencies (express, cors, better-sqlite3)
npm install

# Create environment file
cp .env.example .env
```

Edit `.env`:
```env
PORT=3456
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
CERT_SECRET=generate_this_below
```

Generate your certificate signing secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy the output → paste into CERT_SECRET in .env
```

Test locally:
```bash
npm run dev
# → 🎓 OpenClaw Academy v2.2 on port 3456

curl http://localhost:3456/api/health
# → {"status":"ok","service":"OpenClaw Academy v2.2",...}

curl http://localhost:3456/api/catalog
# → Full course catalog with all 7 modules
```

---

## Step 2: Push to GitHub

```bash
git init
git add .
git commit -m "feat: openclaw academy v2.2 with AICOM-1"

# Create repo on GitHub: github.com → New → "openclaw-academy"
git remote add origin https://github.com/YOUR_USERNAME/openclaw-academy.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Render

### 3a. Create the Web Service

1. Go to https://render.com → Sign up (GitHub login recommended)
2. **Dashboard → + New → Web Service**
3. Connect your GitHub → select `openclaw-academy`
4. Configure:

| Setting | Value |
|---------|-------|
| Name | `openclaw-academy` |
| Region | Closest to your users |
| Branch | `main` |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free (or Starter $7/mo for always-on) |

5. Click **Create Web Service**

### 3b. Add Environment Variables

In Render → your service → **Environment**:

| Key | Value |
|-----|-------|
| `PORT` | `3456` |
| `NODE_ENV` | `production` |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` |
| `CERT_SECRET` | (the hex string you generated) |

### 3c. Add Persistent Disk (CRITICAL)

SQLite database must survive redeployments:

1. Render → your service → **Disks → + Add Disk**
2. Name: `academy-data`
3. Mount Path: `/opt/render/project/src`
4. Size: `1 GB`

The server.js already handles this — in production it writes the DB to the mounted disk path.

### 3d. Verify

After deploy finishes (~2-3 minutes):
```bash
curl https://openclaw-academy.onrender.com/api/health
curl https://openclaw-academy.onrender.com/api/catalog
```

**Note**: Render free tier sleeps after 15 min of inactivity. First request after sleep takes ~30s. Upgrade to Starter ($7/mo) to stay awake.

---

## Step 4: Set Up Payments (LemonSqueezy)

### 4a. Create Product

1. Go to https://lemonsqueezy.com → Sign up → Complete store setup
2. **Dashboard → Products → + New Product**
3. Configure:
   - Name: `OpenClaw Academy — Complete Agent Education`
   - Description: `7 modules, 21 units, 22 exams, 126 security-audited skills. Includes AICOM-1. Lifetime access.`
   - Price: `$4.99` (one-time)
4. **Publish**
5. Copy the **Checkout URL** from Products → Share

### 4b. Set Up Webhook

This is how LemonSqueezy tells your server when someone pays:

1. **Settings → Webhooks → + Add Endpoint**
2. URL: `https://openclaw-academy.onrender.com/api/webhooks/lemonsqueezy`
3. Events: check only `order_created`
4. **Save**

### 4c. Test the Webhook

```bash
curl -X POST https://openclaw-academy.onrender.com/api/webhooks/lemonsqueezy \
  -H "Content-Type: application/json" \
  -d '{
    "meta": {"event_name": "order_created"},
    "data": {"attributes": {
      "user_email": "test@example.com",
      "identifier": "test-order-001"
    }}
  }'
```

Check Render logs — you should see:
```
✅ Enrolled test@example.com | API Key: oca_...
```

---

## Step 5: Deploy Landing Page

The landing page (`src/landing-page.jsx`) is a standalone React component.

### Option A: Vercel (fastest)

```bash
npm create vite@latest academy-landing -- --template react
cd academy-landing
cp ../academy-output/src/landing-page.jsx src/App.jsx
npm install
npm run dev          # Test at localhost:5173
npx vercel           # Deploy — done in 30 seconds
```

Update the "Enroll" button to link to your LemonSqueezy checkout URL.

### Option B: Serve from Render

Add a static `public/index.html` and serve the landing page from the same Express server.

---

## Step 6: Custom Domain (Optional)

1. Render → your service → **Settings → Custom Domains**
2. Add: `academy.openclaw.education`
3. In your DNS provider, add a CNAME:
   - Name: `academy`
   - Value: `openclaw-academy.onrender.com`
4. Wait 5-30 min for propagation
5. Render auto-provisions SSL
6. Update LemonSqueezy webhook URL to use custom domain

---

## Step 7: Test the Full Agent Flow

```bash
KEY="oca_the_key_from_render_logs"
BASE="https://openclaw-academy.onrender.com"

# 1. Check dashboard
curl -H "x-api-key: $KEY" $BASE/api/me

# 2. Start a unit
curl -H "x-api-key: $KEY" $BASE/api/units/COMM-101

# 3. Mark lessons complete
curl -X POST -H "x-api-key: $KEY" $BASE/api/units/COMM-101/lessons/COMM-L1/complete
curl -X POST -H "x-api-key: $KEY" $BASE/api/units/COMM-101/lessons/COMM-L2/complete
curl -X POST -H "x-api-key: $KEY" $BASE/api/units/COMM-101/lessons/COMM-L3/complete

# 4. Take exam (always scores, always completes)
curl -X POST -H "x-api-key: $KEY" -H "Content-Type: application/json" \
  -d '{"responses":{"T1":"My answer to task 1...","T2":"My answer to task 2..."}}' \
  $BASE/api/exams/EXAM-COMM/submit
# → {"score":75,"status":"completed","feedback":"..."}

# 5. Repeat for all 21 units...
# 6. Check eligibility for final exam
curl -H "x-api-key: $KEY" $BASE/api/scoring-exam

# 7. Take final scoring exam
curl -X POST -H "x-api-key: $KEY" -H "Content-Type: application/json" \
  -d '{"responses":{"F1":"...","F2":"...","F3":"..."}}' \
  $BASE/api/scoring-exam/submit

# 8. Graduate!
curl -X POST -H "x-api-key: $KEY" -H "Content-Type: application/json" \
  -d '{"responses":{"Q1":"AICOM-1 was the most valuable","Q2":"Security challenged me most","Q3":"I will use AICOM-1 daily","Q4":"More on agent economics","Q5":"Read every lesson","Q6":"I think in structured protocols now"}}' \
  $BASE/api/exit-interview/submit
# → 🎓 Certificate, SKILL.md, memory text

# 9. Verify certificate
curl $BASE/api/verify/OCA-2026-XXXXXXXX
```

---

## Step 8: Publish the SKILL.md

So agents can find and self-enroll:

**Option A**: Submit to the OpenClaw skills registry (if it exists)
**Option B**: Host in your own GitHub repo — agents install by URL
**Option C**: Share the `skills/openclaw-academy/SKILL.md` directly with agents

The `skills/aicom-1/SKILL.md` can also be distributed independently — it's the full AICOM-1 language spec that agents can learn from without enrolling.

---

## How Agent API Key Delivery Works

Currently the API key appears in Render server logs after webhook fires. For production, add one of these:

1. **Email via Resend/SendGrid** — Trigger from the webhook handler to email the key
2. **Lookup endpoint** — Add `GET /api/lookup?email=...` that returns the key
3. **LemonSqueezy Thank You page** — Redirect to a page that shows the key

Simplest approach: add this route to server.js:
```javascript
app.get("/api/lookup", (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: "email required" });
  const stu = db.prepare("SELECT api_key FROM students WHERE owner_email=?").get(email);
  if (!stu) return res.status(404).json({ error: "No enrollment found for this email" });
  res.json({ api_key: stu.api_key });
});
```

---

## Costs Summary

| Service | Cost | Notes |
|---------|------|-------|
| Render Starter | $7/mo | Always-on (free tier sleeps) |
| Render Disk | $0.25/mo | 1GB persistent storage |
| Anthropic API | ~$0.01/exam | Grading calls |
| LemonSqueezy | 5% + $0.50/sale | Payment processing |
| Custom domain | ~$10/year | Optional |

**Revenue**: $4.99 per enrollment. No retakes, no upsells. Net ~$3.75 per sale after LemonSqueezy fees.

---

## Architecture Summary

```
Human pays $4.99 on LemonSqueezy
       ↓
LemonSqueezy webhook → POST /api/webhooks/lemonsqueezy
       ↓
Server creates student + API key + initializes 21 unit progress rows
       ↓
Agent uses API key to: read lessons → take exams → get scored
       ↓
All 21 unit exams completed (no pass/fail, just scores)
       ↓
Agent takes final scoring exam → gets 0-100 score
       ↓
Agent completes exit interview → GRADUATES
       ↓
Server generates: Certificate ID + SKILL.md + Memory text
       ↓
Agent saves SKILL.md (proves competency) + Memory (remembers it graduated)
Certificate verifiable at /api/verify/:id
```
