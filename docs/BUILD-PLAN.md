# BUILD PLAN - Get Founder Engine WORKING

## Current State: NOTHING WORKS 😅

**What we have:**
- ✅ 8 agent definitions (docs/agents/)
- ✅ Architecture docs (KNOWLEDGE-BENCHMARK.md, AGENT-ARCHITECTURE.md)
- ✅ React frontend (onboarding flow)
- ✅ Supabase DB (companies, knowledge_elements tables)

**What we DON'T have:**
- ❌ Agents actually running
- ❌ Data being extracted from Xero/HubSpot/GA4
- ❌ Angus answering questions
- ❌ Any actual product working

---

## Phase 1: ONE AGENT WORKING (Week 1) 🎯

**Goal:** Finance Agent extracts REAL data from OYNB's Xero → gives Ruari his runway

### Build Order:
1. **Finance Agent Edge Function** (Day 1-2)
   - File: `supabase/functions/agent-finance/index.ts`
   - Connects to Xero API (OAuth)
   - Extracts 12 months transactions
   - Calculates: runway, burn rate, unit economics
   - Stores structured facts in `knowledge_elements` table
   - Returns JSON deliverables

2. **Xero OAuth Flow** (Day 1-2)
   - Add Xero OAuth button to ConnectTools.tsx
   - Exchange code for token
   - Store encrypted in `integrations` table
   - Test with OYNB company

3. **Test with OYNB** (Day 3)
   - Connect OYNB Xero account
   - Run Finance Agent
   - Verify: runway calculation matches reality
   - Check: all expenses categorized

4. **Simple Chat UI** (Day 4)
   - Ask: "How much runway do I have?"
   - Angus invokes Finance Agent
   - Returns: "8 months runway at £25K/mo burn"

**Success Metric:** Ruari asks "How much runway?" → Gets accurate answer from real Xero data

---

## Phase 2: THREE AGENTS WORKING (Week 2) 🚀

**Goal:** Finance + Sales + Marketing = complete business health check

### Build Order:
1. **Sales Agent** (Day 5-6)
   - HubSpot OAuth
   - Extract deals, pipeline, win rates
   - Calculate: pipeline health, forecast

2. **Marketing Agent** (Day 7-8)
   - GA4 + Google Ads APIs
   - Extract: traffic, conversions, CAC by channel
   - Calculate: ROAS, channel performance

3. **Angus Orchestrator** (Day 9-10)
   - Determines which agents to invoke
   - Calls Finance + Sales + Marketing in parallel
   - Synthesizes: "8 months runway, $60K pipeline gap, move Ads → SEO"

**Success Metric:** Ruari asks "How's my business?" → Gets complete snapshot from all 3 agents

---

## Phase 3: ALL 8 AGENTS + AUTOMATION (Week 3-4) 🔥

### Build Order:
1. **Remaining 5 Agents** (Week 3)
   - Operations (tool audit, process gaps)
   - People (retention, hiring pipeline)
   - Product (feature adoption, churn)
   - Legal (contract coverage, compliance)
   - Strategy (competitive position, moat)

2. **Daily Digest Automation** (Week 4)
   - Cron job runs all 8 agents daily
   - Emails Ruari: "Daily Snapshot: runway, pipeline, top 3 actions"
   - Alerts: flight risk, stale deals, expiring contracts

3. **Voice Interface** (Week 4)
   - Ruari speaks to Angus (ElevenLabs)
   - Angus responds with voice + data
   - "How's cash?" → Angus: "8 months runway, mate. Cut SaaS spend £3K/mo to extend to 10 months."

**Success Metric:** Ruari gets daily business snapshot WITHOUT asking

---

## Technical Stack (What to Build With)

### Edge Functions (Domain Agents)
```typescript
// supabase/functions/agent-finance/index.ts
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export default async function(req: Request) {
  const { companyId } = await req.json()
  
  // 1. Get Xero token from DB
  const xeroToken = await getIntegrationToken(companyId, 'xero')
  
  // 2. Fetch Xero data
  const transactions = await fetchXeroData(xeroToken)
  
  // 3. Use Claude to analyze
  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })
  const analysis = await anthropic.messages.create({
    model: 'claude-sonnet-4',
    system: FINANCE_AGENT_PROMPT, // from docs/agents/finance-agent.md
    messages: [{ role: 'user', content: JSON.stringify(transactions) }]
  })
  
  // 4. Store structured facts
  await storeKnowledgeElements(companyId, analysis)
  
  // 5. Return deliverables
  return new Response(JSON.stringify(analysis.deliverables))
}
```

### OAuth Integration
```typescript
// supabase/functions/oauth-xero/index.ts
// 1. User clicks "Connect Xero"
// 2. Redirect to Xero OAuth
// 3. Exchange code for token
// 4. Store encrypted in integrations table
// 5. Trigger Finance Agent extraction
```

### Angus Orchestrator
```typescript
// supabase/functions/angus-orchestrate/index.ts
async function orchestrate(question: string, companyId: string) {
  // 1. Determine agents needed
  const agents = determineAgents(question) // "How's my business?" → ['finance', 'sales', 'marketing']
  
  // 2. Invoke in parallel
  const results = await Promise.all(
    agents.map(agent => supabase.functions.invoke(`agent-${agent}`, { body: { companyId } }))
  )
  
  // 3. Synthesize with Claude
  const synthesis = await anthropic.messages.create({
    model: 'claude-opus-4',
    system: ANGUS_ORCHESTRATOR_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(results) }]
  })
  
  return synthesis
}
```

---

## Quick Start (THIS WEEK)

### Day 1-2: Finance Agent
```bash
# 1. Create edge function
mkdir supabase/functions/agent-finance
cp docs/agents/finance-agent.md supabase/functions/agent-finance/PROMPT.md

# 2. Implement
# - Xero API connection
# - Transaction extraction
# - Claude analysis (using PROMPT.md as system prompt)
# - Store facts in knowledge_elements

# 3. Test locally
supabase functions serve agent-finance
curl -X POST http://localhost:54321/functions/v1/agent-finance \
  -H "Content-Type: application/json" \
  -d '{"companyId": "4e0cce04-ed81-4e60-aa32-15aae72c6bf5"}'
```

### Day 3: Xero OAuth
```bash
# 1. Register Xero app (get client ID/secret)
# 2. Add OAuth flow to React
# 3. Store token encrypted
# 4. Test with OYNB
```

### Day 4: Simple Chat
```bash
# Add to React:
# - ChatScreen.tsx (text input)
# - Call: supabase.functions.invoke('angus-orchestrate', { body: { question, companyId } })
# - Display response
```

**End of Week 1:** Ruari can ask "How much runway?" and get accurate answer from OYNB Xero data.

---

## Why This Order?

**Finance first because:**
- Simplest data source (Xero = clean API)
- Highest value (runway = #1 founder question)
- Proves the architecture works

**Sales + Marketing next because:**
- Complete the "business health" trio
- Enables cross-domain synthesis (Angus's magic)

**Remaining 5 agents last because:**
- Lower urgency for pilot
- Can add incrementally
- Follows same pattern (OAuth → Extract → Analyze → Store)

---

## What Ruari Needs to Do

**Week 1:**
1. Give Angus access to OYNB Xero (OAuth)
2. Test Finance Agent output ("Does this runway match reality?")
3. Provide feedback ("Wrong - missing contractor payments")

**Week 2:**
1. Connect HubSpot + GA4
2. Test business health check
3. Feedback loop (iterate on accuracy)

**Week 3-4:**
1. Connect remaining tools (Intercom, GitHub, etc.)
2. Test daily digest
3. Invite Richard (Chocolate & Love) as second pilot

---

## Success = Working Product

**Not success:** 
- More docs
- Better architecture
- Cleaner code

**Success:**
- Ruari asks "How's my business?" 
- Gets accurate answer from REAL data
- In <5 seconds

**LET'S BUILD.** 🦾
