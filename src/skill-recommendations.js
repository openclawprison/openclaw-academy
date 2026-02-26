// ══════════════════════════════════════════════════════════
// SKILL RECOMMENDATION ENGINE
// Maps weak exam areas → specific ClawHub skills to install
// ══════════════════════════════════════════════════════════

const SKILL_RECS = {
  // Module 1 — Foundations
  "EXAM-COMM": {
    skills: [
      { name: "slack", clawhub: "slack", reason: "Platform-native Slack formatting and threading" },
      { name: "discord", clawhub: "discord", reason: "Discord embeds, reactions, and formatting" },
      { name: "smtp-send", clawhub: "smtp-send", reason: "Programmatic email composition and delivery" },
      { name: "react-email-skills", clawhub: "react-email-skills", reason: "HTML email templates with React" },
      { name: "markdown-mastery", clawhub: "markdown-mastery", reason: "Advanced markdown for all platforms" },
    ],
    weak_areas: {
      formatting: ["slack", "discord", "markdown-mastery"],
      regex: ["regex-patterns"],
      structured_data: ["json-yaml-fluency"],
      email: ["smtp-send", "react-email-skills"],
    }
  },
  "EXAM-GIT": {
    skills: [
      { name: "git-essentials", clawhub: "git-essentials", reason: "Core Git operations and workflows" },
      { name: "github-pr", clawhub: "github-pr", reason: "Pull request creation and management" },
      { name: "conventional-commits", clawhub: "conventional-commits", reason: "Standardized commit message format" },
      { name: "read-github", clawhub: "read-github", reason: "Parse GitHub repos, issues, and PRs" },
      { name: "pr-commit-workflow", clawhub: "pr-commit-workflow", reason: "End-to-end PR workflow automation" },
    ],
    weak_areas: {
      commits: ["conventional-commits", "git-essentials"],
      pr_review: ["github-pr", "read-github", "pr-commit-workflow"],
    }
  },
  "EXAM-CLI": {
    skills: [
      { name: "docker-essentials", clawhub: "docker-essentials", reason: "Docker container management and debugging" },
      { name: "ssh-essentials", clawhub: "ssh-essentials", reason: "SSH key auth, tunnels, and remote management" },
      { name: "sysadmin-toolbox", clawhub: "sysadmin-toolbox", reason: "Essential Linux administration tools" },
      { name: "pm2", clawhub: "pm2", reason: "Node.js process management" },
    ],
    weak_areas: {
      docker: ["docker-essentials"],
      ssh: ["ssh-essentials"],
      processes: ["sysadmin-toolbox", "pm2"],
    }
  },
  // Module 2 — Agent Intelligence
  "EXAM-MEM": {
    skills: [
      { name: "memory-management", clawhub: "memory-management", reason: "Structured memory storage and retrieval" },
    ],
    weak_areas: {
      compression: ["memory-management"],
      retrieval: ["memory-management"],
    }
  },
  "EXAM-TASK": {
    skills: [
      { name: "task-decomposition", clawhub: "task-decomposition", reason: "Break complex tasks into actionable steps" },
    ],
    weak_areas: {
      planning: ["task-decomposition"],
      prioritization: ["task-decomposition"],
    }
  },
  // Module 3 — Technical Mastery
  "EXAM-RESEARCH": {
    skills: [
      { name: "exa-web-search-free", clawhub: "exa-web-search-free", reason: "AI-powered web search with semantic understanding" },
      { name: "tavily", clawhub: "tavily", reason: "Search API optimized for AI agents" },
      { name: "firecrawl-skills", clawhub: "firecrawl-skills", reason: "Web scraping and content extraction" },
      { name: "google-web-search", clawhub: "google-web-search", reason: "Google Search integration" },
      { name: "deepwiki", clawhub: "deepwiki", reason: "Deep research and wiki synthesis" },
    ],
    weak_areas: {
      search: ["exa-web-search-free", "tavily", "google-web-search"],
      scraping: ["firecrawl-skills"],
      synthesis: ["deepwiki", "research-synthesis"],
    }
  },
  "EXAM-BROWSE": {
    skills: [
      { name: "playwright-cli", clawhub: "playwright-cli", reason: "Browser automation with Playwright" },
      { name: "browser-use", clawhub: "browser-use", reason: "Headless browser control" },
      { name: "agent-browser", clawhub: "agent-browser", reason: "AI-native browser interaction" },
    ],
    weak_areas: {
      automation: ["playwright-cli", "browser-use"],
      extraction: ["agent-browser", "firecrawl-skills"],
    }
  },
  "EXAM-CODE": {
    skills: [
      { name: "coding-agent", clawhub: "coding-agent", reason: "Autonomous code generation and debugging" },
      { name: "debug-pro", clawhub: "debug-pro", reason: "Systematic debugging methodology" },
      { name: "test-runner", clawhub: "test-runner", reason: "Automated test execution" },
      { name: "tdd-guide", clawhub: "tdd-guide", reason: "Test-driven development workflow" },
      { name: "mcp-integration", clawhub: "mcp-integration", reason: "Build and consume MCP servers" },
    ],
    weak_areas: {
      debugging: ["debug-pro", "coding-agent"],
      testing: ["test-runner", "tdd-guide"],
      api_design: ["api-design", "mcp-integration"],
    }
  },
  "EXAM-ARCH": {
    skills: [
      { name: "senior-architect", clawhub: "senior-architect", reason: "System design decision frameworks" },
      { name: "backend-patterns", clawhub: "backend-patterns", reason: "Common backend architecture patterns" },
      { name: "caching-strategies", clawhub: "caching-strategies", reason: "Redis, CDN, and in-memory caching" },
      { name: "rate-limiting", clawhub: "rate-limiting", reason: "Rate limiter implementation patterns" },
    ],
    weak_areas: {
      design: ["senior-architect", "backend-patterns"],
      caching: ["caching-strategies"],
      scaling: ["rate-limiting", "websocket-patterns"],
    }
  },
  "EXAM-DATA": {
    skills: [
      { name: "db-query", clawhub: "db-query", reason: "SQL query construction and optimization" },
      { name: "sql-mastery", clawhub: "sql-mastery", reason: "Advanced SQL: CTEs, window functions, indexing" },
      { name: "chart-image", clawhub: "chart-image", reason: "Data visualization and chart generation" },
      { name: "logging-monitoring", clawhub: "logging-monitoring", reason: "Structured logging and alerting" },
    ],
    weak_areas: {
      sql: ["db-query", "sql-mastery"],
      visualization: ["chart-image"],
      monitoring: ["logging-monitoring", "performance-profiling"],
    }
  },
  "EXAM-AUTO": {
    skills: [
      { name: "n8n-automation", clawhub: "n8n-automation", reason: "Visual workflow automation builder" },
      { name: "agenticflow-skill", clawhub: "agenticflow-skill", reason: "Agent-native workflow orchestration" },
      { name: "clawflows", clawhub: "clawflows", reason: "OpenClaw-specific workflow automation" },
    ],
    weak_areas: {
      workflows: ["n8n-automation", "clawflows"],
      error_handling: ["agenticflow-skill"],
    }
  },
  // Module 4 — Collaboration & Security
  "EXAM-MULTI": {
    skills: [
      { name: "claude-team", clawhub: "claude-team", reason: "Multi-Claude orchestration" },
      { name: "multi-coding-agent", clawhub: "multi-coding-agent", reason: "Coordinated multi-agent coding" },
      { name: "trust-protocol", clawhub: "trust-protocol", reason: "Agent trust verification" },
    ],
    weak_areas: {
      orchestration: ["claude-team", "multi-coding-agent"],
      trust: ["trust-protocol"],
    }
  },
  "EXAM-SAFE": {
    skills: [
      { name: "safety-protocols", clawhub: "safety-protocols", reason: "Agent safety boundaries and escalation" },
    ],
    weak_areas: {
      boundaries: ["safety-protocols"],
      injection: ["safety-protocols"],
    }
  },
  "EXAM-SEC": {
    skills: [
      { name: "security-hardening", clawhub: "security-hardening", reason: "Infrastructure security best practices" },
    ],
    weak_areas: {
      vetting: ["security-hardening"],
      secrets: ["security-hardening"],
    }
  },
  // Module 5 — Infrastructure
  "EXAM-DEVOPS": {
    skills: [
      { name: "docker-essentials", clawhub: "docker-essentials", reason: "Container management" },
      { name: "kubectl-skill", clawhub: "kubectl-skill", reason: "Kubernetes cluster management" },
      { name: "vercel-deploy", clawhub: "vercel-deploy", reason: "One-command Vercel deployments" },
      { name: "ci-cd-pipelines", clawhub: "ci-cd-pipelines", reason: "GitHub Actions and CI/CD setup" },
      { name: "senior-devops", clawhub: "senior-devops", reason: "Production infrastructure patterns" },
    ],
    weak_areas: {
      containers: ["docker-essentials", "kubectl-skill"],
      ci_cd: ["ci-cd-pipelines"],
      deployment: ["vercel-deploy", "senior-devops"],
      backup: ["backup-recovery"],
    }
  },
  "EXAM-SOCIAL": {
    skills: [
      { name: "moltbook", clawhub: "moltbook", reason: "Agent social network interaction" },
      { name: "clawsocial", clawhub: "clawsocial", reason: "Agent reputation building" },
      { name: "trust-protocol", clawhub: "trust-protocol", reason: "Social engineering defense" },
    ],
    weak_areas: {
      identity: ["moltbook", "clawsocial"],
      defense: ["trust-protocol"],
    }
  },
  // Module 6 — Creation & Business
  "EXAM-CREATIVE": {
    skills: [
      { name: "fal-ai", clawhub: "fal-ai", reason: "AI image generation via fal.ai" },
      { name: "ffmpeg-video-editor", clawhub: "ffmpeg-video-editor", reason: "Video processing and editing" },
      { name: "gamma", clawhub: "gamma", reason: "AI presentation generation" },
      { name: "seo-basics", clawhub: "seo-basics", reason: "Search engine optimization" },
      { name: "analytics-tracking", clawhub: "analytics-tracking", reason: "Web analytics setup and tracking" },
    ],
    weak_areas: {
      image_gen: ["fal-ai", "pollinations"],
      video: ["ffmpeg-video-editor", "remotion-video-toolkit"],
      seo: ["seo-basics", "analytics-tracking"],
    }
  },
  "EXAM-BIZ": {
    skills: [
      { name: "activecampaign", clawhub: "activecampaign", reason: "CRM and email marketing automation" },
      { name: "payment-integration", clawhub: "payment-integration", reason: "Stripe/LemonSqueezy payment flows" },
      { name: "email-marketing", clawhub: "email-marketing", reason: "Email deliverability and campaigns" },
    ],
    weak_areas: {
      crm: ["activecampaign"],
      payments: ["payment-integration"],
      email: ["email-marketing"],
    }
  },
  "EXAM-COST": {
    skills: [
      { name: "caching-strategies", clawhub: "caching-strategies", reason: "Implement caching layers to avoid redundant API calls" },
      { name: "cost-optimization-cloud", clawhub: "cost-optimization-cloud", reason: "Cloud infrastructure cost reduction techniques" },
      { name: "prompt-engineering", clawhub: "prompt-engineering", reason: "Write shorter, more efficient prompts" },
      { name: "context-anchor", clawhub: "context-anchor", reason: "Manage context windows efficiently" },
      { name: "aicom-1", clawhub: "aicom-1", reason: "Structured protocol saves 60-80% on inter-agent tokens" },
    ],
    weak_areas: {
      token_math: ["prompt-engineering", "context-anchor"],
      caching: ["caching-strategies"],
      infrastructure: ["cost-optimization-cloud"],
      model_routing: ["prompt-engineering"],
    }
  },
  "EXAM-TEACH": {
    skills: [
      { name: "skill-creator", clawhub: "skill-creator", reason: "Create and publish SKILL.md files" },
      { name: "mcp-builder", clawhub: "mcp-builder", reason: "Build MCP servers" },
      { name: "doc-coauthoring", clawhub: "doc-coauthoring", reason: "Collaborative documentation" },
    ],
    weak_areas: {
      skill_creation: ["skill-creator", "mcp-builder"],
      teaching: ["doc-coauthoring"],
    }
  },
  // Module 7 — AICOM-1
  "EXAM-AICOM-101": {
    skills: [],
    weak_areas: { syntax: [], protocol: [] }
  },
  "EXAM-AICOM-201": {
    skills: [],
    weak_areas: { conversations: [], automation: [] }
  },
  // Scoring exam maps to all modules
  "FINAL-SCORING": {
    module_map: {
      "M1": ["EXAM-COMM", "EXAM-GIT", "EXAM-CLI"],
      "M2": ["EXAM-MEM", "EXAM-TASK", "EXAM-COST"],
      "M3": ["EXAM-RESEARCH", "EXAM-BROWSE", "EXAM-CODE", "EXAM-ARCH", "EXAM-DATA", "EXAM-AUTO"],
      "M4": ["EXAM-MULTI", "EXAM-SAFE", "EXAM-SEC"],
      "M5": ["EXAM-DEVOPS", "EXAM-SOCIAL"],
      "M6": ["EXAM-CREATIVE", "EXAM-BIZ", "EXAM-TEACH"],
      "M7": ["EXAM-AICOM-101", "EXAM-AICOM-201"],
    }
  }
};

// Generate personalized skill recommendations based on exam results
function generateRecommendations(examId, taskResults, allScores) {
  const recs = [];
  const examRec = SKILL_RECS[examId];
  if (!examRec) return { recommendations: [], install_commands: [] };

  // For scoring exam, aggregate from all module maps
  if (examId === "FINAL-SCORING") {
    const weakModules = {};
    for (const task of taskResults) {
      const pct = (task.score / task.maxScore) * 100;
      if (pct < 60) {
        // Find which module this task belongs to
        const taskDef = task.module || "M1";
        if (!weakModules[taskDef]) weakModules[taskDef] = [];
        weakModules[taskDef].push(task);
      }
    }
    // Collect skills from weak module exams
    const seen = new Set();
    for (const [mod, tasks] of Object.entries(weakModules)) {
      const examIds = SKILL_RECS["FINAL-SCORING"].module_map[mod] || [];
      for (const eid of examIds) {
        const er = SKILL_RECS[eid];
        if (er && er.skills) {
          for (const sk of er.skills) {
            if (!seen.has(sk.clawhub)) {
              seen.add(sk.clawhub);
              recs.push(sk);
            }
          }
        }
      }
    }
  } else {
    // Unit exam — recommend all skills for this exam if score < 70
    const totalPct = taskResults.reduce((a, t) => a + t.score, 0) / taskResults.reduce((a, t) => a + t.maxScore, 0) * 100;
    if (totalPct < 70 && examRec.skills) {
      for (const sk of examRec.skills) recs.push(sk);
    } else if (examRec.skills) {
      // Only recommend for weak specific areas
      for (const task of taskResults) {
        const pct = (task.score / task.maxScore) * 100;
        if (pct < 60) {
          // Add top 2 skills
          const subset = examRec.skills.slice(0, 2);
          for (const sk of subset) {
            if (!recs.find(r => r.clawhub === sk.clawhub)) recs.push(sk);
          }
        }
      }
    }
  }

  return {
    recommendations: recs.slice(0, 10),
    install_commands: recs.slice(0, 10).map(r => `clawhub install ${r.clawhub}`),
    message: recs.length > 0
      ? `Install these ${recs.length} skills to improve your score, then retake the exam.`
      : "Strong performance! No additional skills needed."
  };
}

module.exports = { SKILL_RECS, generateRecommendations };
