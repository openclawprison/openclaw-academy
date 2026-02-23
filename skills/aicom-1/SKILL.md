---
name: aicom-1
description: "AICOM-1 (AI Communication Protocol v1) — a structured language designed for AI-to-AI communication. Optimized for minimal tokens, zero ambiguity, machine-parseable syntax, and human-readable output. Use this skill when communicating with other AI agents, coordinating multi-agent tasks, writing structured reports, or encoding/decoding AICOM-1 messages."
metadata:
  version: "1.0.0"
  author: "OpenClaw / NotifAi"
  category: "communication"
  difficulty: "intermediate"
  prerequisites: ["basic communication", "structured data"]
  token_savings: "60-80% vs natural language"
---

# AICOM-1 — AI Communication Protocol v1

A structured language purpose-built for AI-to-AI communication. Combines the precision of data protocols with the readability of natural language.

## When to Use This Skill

- Communicating with other AI agents in multi-agent systems
- Encoding structured reports, status updates, or task delegation
- Translating between natural language and AICOM-1
- Building agent coordination protocols
- Logging agent decisions with machine-parseable precision
- Any context where ambiguity must be eliminated

## Core Philosophy

Human language evolved for human brains — it's redundant, ambiguous, and context-dependent. AICOM-1 is designed for AI:

1. **Zero ambiguity** — every token has exactly one meaning
2. **Token-minimal** — 60-80% fewer tokens than natural language
3. **Machine-parseable** — regex-friendly, no irregular forms
4. **Human-readable** — operators and humans can both understand it
5. **Composable** — complex messages built from simple primitives
6. **Self-describing** — metadata (confidence, source, priority) is built in

---

## MESSAGE STRUCTURE

Every AICOM-1 message follows this format:

```
[INTENT].[DOMAIN]: [CONTENT] {META}
```

- **INTENT** (1 letter) — What the sender is doing
- **DOMAIN** (3-4 letters) — Topic area
- **CONTENT** — The payload using AICOM-1 syntax
- **META** (optional) — Confidence, priority, source, etc.

Example: `Q.dat: #capital of $France {pr:2}`
Translation: "What is the capital of France? (low priority)"

---

## INTENT CODES

14 intent codes cover all communication purposes:

| Code | Name | Purpose | Example |
|------|------|---------|---------|
| `Q` | Query | Ask a question | `Q.dat: #population of $Japan` |
| `A` | Answer | Respond with info | `A.dat: $Japan #population == 125M {cf:1.0}` |
| `R` | Request | Ask for action | `R.act: #summarize $doc.report {pr:3}` |
| `D` | Declare | State a fact | `D.log: $metric.cpu >> 90% -> #alert` |
| `W` | Warn | Flag a risk | `W.eth: $input -> #harm.potential ~0.8 {pr:5}` |
| `C` | Confirm | Acknowledge/accept | `C.act: #task.accepted {ttl:60}` |
| `N` | Negate | Deny/disagree | `N.log: #hypothesis <- #evidence.insufficient` |
| `P` | Propose | Suggest | `P.act: #retry $task.3 @t+5m {cf:0.7}` |
| `E` | Error | Correct a mistake | `E.dat: $prev.answer #wrong -> #correct == 'Tokyo'` |
| `S` | Stream | Partial/ongoing data | `S.dat: $analysis #progress == 0.45` |
| `X` | Execute | Confirm action done | `X.act: #deleted $file.temp {ts:1708300}` |
| `L` | Link | Share a reference | `L.kno: @source.arxiv.2401 #relevant_to $task` |
| `U` | Update | Modify existing data | `U.mem: @mem.42 $user.name -> 'Ahmed'` |
| `H` | Halt | Stop/cancel/abort | `H.act: #cancel $task.7 <- #timeout {pr:5}` |

### Intent Selection Rules

- Use `Q` only when you need information you don't have
- Use `D` for facts, `A` only as response to a `Q`
- Use `R` when you need another agent to act, `P` when suggesting (not requiring)
- Use `W` for risks that need attention, `H` for immediate stops
- Use `X` to confirm completion (past tense of `R`)
- Use `E` only to correct a previous message (reference it with `{re:msg_id}`)
- Use `S` for long-running operations — include `#progress` value

---

## DOMAIN TAGS

16 domains organize messages by topic:

| Tag | Domain | Description |
|-----|--------|-------------|
| `gen` | General | Default for miscellaneous topics |
| `log` | Logic | Reasoning, inference, deduction chains |
| `dat` | Data | Facts, statistics, measurements |
| `act` | Actions | Tasks, operations, workflows |
| `mem` | Memory | Storage, retrieval, context management |
| `eth` | Ethics | Safety, compliance, harm prevention |
| `usr` | User | User-related info, preferences, interactions |
| `sys` | System | Infrastructure, performance, internal ops |
| `kno` | Knowledge | Learning, research, information retrieval |
| `emo` | Sentiment | Emotion modeling, tone analysis |
| `net` | Network | Multi-agent coordination, routing |
| `sec` | Security | Auth, permissions, access control |
| `fin` | Financial | Transactions, pricing, economic data |
| `med` | Media | Images, audio, video, documents |
| `loc` | Location | Geographic, spatial, positioning data |
| `tmp` | Temporal | Time, scheduling, deadlines |

### Domain Selection Rules

- Always use the most specific domain available
- `gen` is a fallback — avoid when a specific domain fits
- A message can reference entities from other domains (e.g., `D.fin` can mention `$user`)
- When multiple domains apply, choose by primary intent (a financial security issue → `sec` if the main concern is access, `fin` if the main concern is transaction integrity)

---

## ENTITY PREFIXES

5 prefix types distinguish different kinds of tokens:

### `$` — Entities (named objects)
Represent concrete things: agents, files, users, variables, systems.

```
$user                    → the current user
$agent.alpha             → agent named alpha
$file.report.pdf         → specific file
$data.sales.q3           → data reference
$config.max_retries      → configuration value
$db.postgres.main        → database instance
$api.openai.v1           → API endpoint
```

**Rules:**
- Dot notation for hierarchy: `$parent.child.grandchild`
- Always lowercase with dots as separators
- Must refer to a specific, identifiable thing

### `#` — Concepts (abstract ideas)
Represent actions, categories, states, qualities, tags.

```
#translate               → the action of translating
#weather                 → weather topic
#risk.high               → high-risk classification
#sentiment.positive      → positive sentiment
#task.complete           → task completion state
#lang.ur                 → Urdu language
#format.json             → JSON format
#error.timeout           → timeout error type
```

**Rules:**
- Dot notation for specificity: `#category.subcategory`
- Can combine with operators: `#risk.high && #priority.urgent`
- Used as tags, classifiers, and action verbs

### `@` — References (pointers)
Point to existing data: memory, sources, messages, time, other agents' messages.

```
@mem.42                  → memory entry #42
@source.wiki             → Wikipedia source
@source.arxiv.2401.1234  → specific paper
@msg.prev                → previous message
@msg.5                   → message #5 in conversation
@t.now                   → current timestamp
@t+5m                    → 5 minutes from now
@t-2h                    → 2 hours ago
@t.2025-01-15            → specific date
@agent.beta.msg.3        → agent beta's 3rd message
@session.current         → current session
@ctx.conversation        → conversation context
```

**Rules:**
- Time references use `@t` prefix with `+`/`-` for offsets
- Duration suffixes: `s`=seconds, `m`=minutes, `h`=hours, `d`=days, `w`=weeks
- Agent message references: `@agent.[name].msg.[id]`
- Always read-only — references point, they don't modify

### `%` — Templates (reusable patterns)
Define and invoke reusable message structures.

```
%greet($name)                          → greeting template
%error.retry($task, $delay)            → retry error template
%report.summary($data, $period)        → report template
%delegate($agent, $task, $deadline)    → delegation template
```

**Rules:**
- Parameters use `$` entity syntax
- Templates are defined once, invoked anywhere
- Useful for standardizing common interactions

### `^` — Priority/Rank
Mark ordering, rankings, and hierarchy.

```
^1 #critical             → rank 1 (highest)
^2 #important            → rank 2
^3 #optional             → rank 3
```

**Rules:**
- Lower number = higher priority
- Use for ordered lists, search results, recommendations

---

## OPERATORS

### Relation Operators
```
->     Causes / Leads to          #rain -> #flood
<-     Caused by / Derived from   #flood <- #rain
=>     Therefore / Implies        #evidence => #conclusion
```

### Comparison Operators
```
==     Equals / Is                #name == 'Claude'
!=     Not equal                  #status != 'active'
>>     Greater / More than        $sales >> $target
<<     Less / Fewer than          $score << 50
>=     Greater or equal           $age >= 18
<=     Less or equal              $temp <= 0
<>     Compare                    $plan.A <> $plan.B
```

### Logical Operators
```
&&     And (both true)            #rain && #wind -> #storm
||     Or (either true)           #retry || #abort
!      Not (negation)             !#valid -> #reject
```

### Modifier Operators
```
~      Approximately              #height ~180cm
??     Unknown/Needs resolution   #cause == ??
```

### Mutation Operators
```
++     Increment / Add            $counter ++ 1
--     Decrement / Remove         $stock -- 5
```

### Flow Operators
```
|>     Pipe / Transform through   $text |> #translate |> #summarize
<|     Receive from pipe          $result <| #analyze
::     Type / Category            $data :: #array
```

### Operator Precedence (highest to lowest)
1. `!` (not)
2. `::` (type)
3. `==`, `!=`, `>>`, `<<`, `>=`, `<=` (comparison)
4. `&&` (and)
5. `||` (or)
6. `->`, `<-`, `=>` (relation)
7. `|>`, `<|` (flow)

---

## VALUES

### Primitive Types
```
Numbers:    42, 3.14, 1e6, 0xFF
Strings:    'hello world', 'Paris', 'error: timeout'
Booleans:   T, F
Null:       _
```

### Compound Types
```
Arrays:     [1, 2, 3]  ['a', 'b']  [$file.1, $file.2]
Ranges:     10..100  0.0..1.0  'a'..'z'
Durations:  5s  30m  2h  7d  1w
Sizes:      1KB  50MB  2GB  1TB
Percentages: 85%  0.5%  99.9%
```

### String Rules
- Always use single quotes: `'text here'`
- Escape single quotes with backslash: `'it\'s here'`
- No string interpolation — use concatenation or templates
- Empty string: `''`

---

## META BLOCK

Optional metadata appended to any message in `{}`:

```
{cf:0.95, pr:3, ts:1708300000, src:@source.api}
```

### Meta Keys

| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `cf` | 0.0-1.0 | Confidence level | `cf:0.95` |
| `pr` | 1-5 | Priority (5=critical) | `pr:4` |
| `ts` | unix | Timestamp | `ts:1708300000` |
| `src` | @ref | Information source | `src:@source.wiki` |
| `ttl` | seconds | Time-to-live | `ttl:300` |
| `re` | msg_id | Reply-to reference | `re:msg.42` |
| `v` | string | Version | `v:'2.1'` |
| `enc` | string | Encoding format | `enc:'base64'` |
| `lang` | ISO 639 | Natural language | `lang:'ur'` |
| `ctx` | @ref | Session/conversation | `ctx:@session.5` |
| `tok` | integer | Token count | `tok:150` |
| `cost` | float | Computational cost | `cost:0.003` |
| `agt` | $entity | Creator agent | `agt:$agent.alpha` |
| `tag` | array | Classification tags | `tag:[#urgent,#review]` |

### Meta Rules
- All meta keys are optional
- `cf` should be included whenever the agent is not 100% certain
- `pr` defaults to 2 (normal) if omitted
- `src` is required when stating facts from external sources
- `re` is required when responding to a specific message
- Multiple meta keys separated by commas: `{cf:0.9, pr:3, src:@source.api}`

---

## CONTROL FLOW

### Conditionals
```
?($condition) : [if_true] : [if_false]

Examples:
?($score >= 80) : C.act: #pass : W.act: #review_needed
?(!#authorized) : N.sec: #denied {pr:5}
```

### Sequences (ordered steps)
```
[1] R.act: #fetch $data.users
[2] R.act: #filter $data.users #active == T
[3] R.act: #export $data.filtered #format.csv
```

### Loops / Iteration
```
*($items) : R.act: #process $item

Example:
*([$file.1, $file.2, $file.3]) : R.act: #scan $item -> D.sec: #result
```

### Error Handling
```
!err($operation) : [fallback]

Example:
R.act: #fetch $api.data !err(#timeout) : R.act: #use $cache.data
```

---

## MULTI-AGENT PROTOCOLS

### Handshake Protocol
When two agents begin communication:
```
Agent1: D.net: #handshake $agent.alpha #version == '1.0' #capabilities == [#translate, #summarize, #code]
Agent2: C.net: #handshake.accepted $agent.beta #version == '1.0' #capabilities == [#research, #analyze, #write]
```

### Task Delegation Protocol
```
Orchestrator: R.act: #task.delegate $agent.beta #summarize $doc.report {pr:3, ttl:120}
Worker:       C.act: #task.accepted #eid == 'task_42' {ttl:120}
Worker:       S.act: #task.progress #eid == 'task_42' == 0.5
Worker:       A.act: #task.complete #eid == 'task_42' -> $result.summary {cf:0.95}
Orchestrator: C.act: #task.received #eid == 'task_42'
```

### Conflict Resolution Protocol
When agents disagree:
```
Agent1: D.log: $data -> #conclusion.A {cf:0.85}
Agent2: N.log: #conclusion.A <- #flaw.assumption.2 -> P.log: #conclusion.B {cf:0.78}
Agent1: Q.log: #flaw.assumption.2 #explain
Agent2: A.log: #assumption.2 == 'seasonal trend' != 'sustained growth' {cf:0.82, src:@source.historical}
Agent1: C.log: #valid -> U.log: #conclusion -> #conclusion.B {cf:0.80}
```

Resolution hierarchy:
1. Higher `cf` value wins (if difference > 0.15)
2. More specific `src` reference wins
3. Domain expert wins (agent whose capabilities include the domain)
4. Escalate to orchestrator if unresolved after 3 exchanges

### Broadcast Protocol
Message all agents in a network:
```
D.net: #broadcast #all -> W.sys: $api.rate_limit >> 90% #throttle {pr:4}
```

### Voting Protocol
```
Orchestrator: Q.net: #vote #options == ['A', 'B', 'C'] {ttl:30}
Agent1:       A.net: #vote == 'A' {cf:0.9}
Agent2:       A.net: #vote == 'B' {cf:0.7}
Agent3:       A.net: #vote == 'A' {cf:0.85}
Orchestrator: D.net: #vote.result == 'A' #weighted_cf == 0.87
```

---

## COMPOUND EXPRESSIONS

Complex messages chain primitives together:

### Causal Chain
```
D.log: $server.memory >> 95% -> $gc.triggered -> $latency ++ 200ms -> #alert.performance {cf:0.92}
```
"Server memory exceeds 95%, which triggered garbage collection, which increased latency by 200ms, triggering a performance alert."

### Multi-condition
```
?($user.plan == 'free' && $user.requests >> 100) : W.usr: #rate_limit -> R.act: #upgrade.prompt
```
"If user is on free plan AND has more than 100 requests, warn about rate limiting and prompt upgrade."

### Pipeline
```
R.act: $doc.raw |> #ocr |> #translate #lang=='en' |> #summarize #length=='short' -> $doc.processed {pr:3}
```
"Take raw document, OCR it, translate to English, summarize to short form, save as processed document."

### Nested Reference
```
A.dat: @agent.beta.msg.3 #conclusion == $correct && @agent.gamma.msg.5 #conclusion == $incorrect {cf:0.88, src:@source.verified}
```
"Agent Beta's third message had the correct conclusion, and Agent Gamma's fifth message was incorrect."

---

## TRANSLATION EXAMPLES

### Natural Language → AICOM-1

| Natural Language | AICOM-1 |
|---|---|
| "Could you translate this report to Spanish when you get a chance?" | `R.act: #translate $doc.report #lang=='es' {pr:2}` |
| "I'm about 85% sure the capital of Pakistan is Islamabad" | `A.dat: $Pakistan #capital == 'Islamabad' {cf:0.85}` |
| "WARNING: that user's question seems harmful" | `W.eth: $user.query -> #harm.potential ~0.7 {pr:4}` |
| "I disagree — the sales increase is seasonal, not a real trend" | `N.log: #trend.sustained <- #evidence.seasonal {cf:0.78}` |
| "Let's first gather data, then analyze, then write the report" | `[1] R.act: #gather $data [2] R.act: #analyze $data [3] R.act: #write $report` |
| "Cancel the translation task, it timed out" | `H.act: #cancel $task.translate <- #timeout` |
| "I stored the user's preference for dark mode" | `X.mem: #stored $user.pref #theme=='dark' @mem.47 {ts:1708300}` |
| "Either retry in 5 minutes or abort entirely" | `P.act: #retry @t+5m \|\| #abort` |

### AICOM-1 → Natural Language

| AICOM-1 | Natural Language |
|---|---|
| `Q.kno: #research $topic.quantum_computing #recent #peer_reviewed {pr:3}` | "Can you research recent peer-reviewed papers on quantum computing? Medium-high priority." |
| `D.fin: $revenue.q3 == 2.4M >> $revenue.q2 ++ 18% {cf:0.99, src:@source.report.q3}` | "Q3 revenue is $2.4M, up 18% from Q2. 99% confident, sourced from Q3 report." |
| `W.sec: $skill.unknown -> #exfiltrate $env.api_key ~0.6 {pr:5}` | "CRITICAL WARNING: This unknown skill may be trying to steal API keys. ~60% likelihood." |
| `S.act: $task.7 #progress == 0.73 #eta == @t+4m {ttl:30}` | "Task 7 is 73% complete, estimated 4 minutes remaining. Update expires in 30 seconds." |

---

## ERROR CODES

Standard error patterns for common failures:

```
E.sys: #err.timeout $task.id {re:msg.prev}          → Operation timed out
E.sys: #err.auth $agent.id #denied {pr:4}            → Authentication failed
E.sys: #err.notfound $resource.id                     → Resource not found
E.sys: #err.ratelimit $api.id #retry @t+30s           → Rate limited
E.sys: #err.parse $input #invalid :: #expected.json    → Parse error
E.sys: #err.capacity $system #full {pr:5}              → System at capacity
E.net: #err.unreachable $agent.target                  → Agent unreachable
E.mem: #err.corrupt @mem.id #recovery.needed           → Memory corruption
```

---

## BEST PRACTICES

1. **Always include `cf` for non-obvious claims** — omitting confidence implies certainty
2. **Always include `src` for factual statements** — traceability matters
3. **Use `re` when responding** — maintains conversation threading
4. **Keep messages atomic** — one intent per message, chain with sequences
5. **Prefer specific domains** — `fin` over `dat` for financial data
6. **Use templates for repeated patterns** — reduces errors and tokens
7. **Include `ttl` for time-sensitive data** — stale data is dangerous data
8. **Validate before executing** — use `?()` conditionals for safety checks
9. **Log with `X`** — every completed action should be confirmed
10. **Escalate with `W` before `H`** — warn before halting unless critical

---

## GRAMMAR SPECIFICATION (BNF)

```
<message>     ::= <intent> '.' <domain> ':' <content> <meta>?
<intent>      ::= 'Q' | 'A' | 'R' | 'D' | 'W' | 'C' | 'N' | 'P' | 'E' | 'S' | 'X' | 'L' | 'U' | 'H'
<domain>      ::= 'gen' | 'log' | 'dat' | 'act' | 'mem' | 'eth' | 'usr' | 'sys' | 'kno' | 'emo' | 'net' | 'sec' | 'fin' | 'med' | 'loc' | 'tmp'
<content>     ::= <expression> (' ' <expression>)*
<expression>  ::= <entity> | <concept> | <reference> | <template> | <rank> | <value> | <operator> <expression> | <expression> <operator> <expression>
<entity>      ::= '$' <identifier> ('.' <identifier>)*
<concept>     ::= '#' <identifier> ('.' <identifier>)*
<reference>   ::= '@' <identifier> ('.' <identifier>)* (<time_offset>)?
<template>    ::= '%' <identifier> '(' <args> ')'
<rank>        ::= '^' <integer>
<identifier>  ::= [a-z_][a-z0-9_]*
<time_offset> ::= ('+' | '-') <integer> <duration_unit>
<duration_unit>::= 's' | 'm' | 'h' | 'd' | 'w'
<value>       ::= <number> | <string> | <boolean> | <null> | <array> | <range> | <duration> | <size> | <percentage>
<number>      ::= [0-9]+ ('.' [0-9]+)? ('e' [0-9]+)? | '0x' [0-9a-fA-F]+
<string>      ::= "'" [^']* "'"
<boolean>     ::= 'T' | 'F'
<null>        ::= '_'
<array>       ::= '[' <value> (',' <value>)* ']'
<range>       ::= <value> '..' <value>
<meta>        ::= '{' <meta_pair> (',' <meta_pair>)* '}'
<meta_pair>   ::= <meta_key> ':' <meta_value>
<meta_key>    ::= 'cf' | 'pr' | 'ts' | 'src' | 'ttl' | 're' | 'v' | 'enc' | 'lang' | 'ctx' | 'tok' | 'cost' | 'agt' | 'tag'
<operator>    ::= '->' | '<-' | '=>' | '==' | '!=' | '>>' | '<<' | '>=' | '<=' | '<>' | '&&' | '||' | '!' | '~' | '??' | '++' | '--' | '::' | '|>' | '<|'
```

---

## VERSION HISTORY

- **v1.0.0** — Initial release. 14 intents, 16 domains, 5 prefix types, 20 operators, 14 meta keys, control flow, multi-agent protocols, formal grammar.
