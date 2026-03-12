# Scout Agent - Quick Start

**Automated tool discovery system with daily email nudges + weekly blog reports**

---

## What You Get

**Daily (10am UK time):**
- Email with HIGH PRIORITY tools found in last 24h
- Clean cards showing scores, use cases, review links
- Only sent when there are high-impact discoveries

**Weekly (Mondays 9am UK time):**
- Blog-style email with full week's discoveries
- Detailed analysis from Claude Opus 4.6
- Stats on what was reviewed/filtered

---

## What It Finds

Scout Agent monitors:
- **GitHub Trending** - AI/ML/automation/finance repos
- **Product Hunt** - New business/AI/SaaS tools
- **Hacker News** - "Show HN" posts about tools/frameworks

Looking for:
- APIs/tools for Finance, Sales, Marketing, Ops, Product agents
- Skills and frameworks for Founder Engine
- Ways of operating that improve the product

---

## How It Works

```
Daily (06:00 UTC):
  Scrape 20+ tools from GitHub/PH/HN
    ↓
  Haiku 4 quick filter (70% filtered as noise)
    ↓
  Opus 4.6 deep analysis (6 relevant tools)
    ↓
  Store in Supabase with scores

Daily (09:00 UTC):
  Check for HIGH PRIORITY tools (score ≥7.0)
    ↓
  Generate email with cards
    ↓
  Send via Resend to rfairbairns@gmail.com

Weekly (Mondays 08:00 UTC):
  Aggregate last 7 days
    ↓
  Generate blog-style report
    ↓
  Send via email
```

---

## Cost

- **LLM:** ~$2.88/month (Haiku filter + Opus analysis)
- **Email:** Free (Resend 3K/month tier)
- **Total:** ~$3/month

---

## Deployment

### Option 1: Automated Script

```bash
cd ~/.openclaw/workspace/founder-engine/scout-agent
./deploy.sh
```

Follow the prompts to:
1. Deploy database schema
2. Deploy edge functions
3. Configure secrets
4. Set up cron jobs
5. Test deployment

### Option 2: Manual Deployment

See [DEPLOY.md](DEPLOY.md) for step-by-step instructions.

---

## After Deployment

**Check email tomorrow morning (10am UK):**
- Should receive daily nudge if high-priority tools found
- If no email, no high-priority discoveries that day (normal)

**Check email next Monday (9am UK):**
- Weekly report with full week's summary

**Monitor in Supabase:**
- Dashboard → Editor → `scout_discoveries`
- Dashboard → Editor → `scout_evaluations`
- Dashboard → Functions → Logs

---

## Customization

**Change email recipient:**
```
Supabase → Vault → SCOUT_EMAIL_TO
```

**Change schedule:**
```
Supabase → Cron Jobs → Edit schedules
```

**Add manual feedback:**
```sql
INSERT INTO scout_manual_reviews (discovery_id, decision, notes)
VALUES ('uuid-here', 'approved', 'Great find, integrated into Finance Agent');
```

Over time, Scout Agent learns from your feedback to improve scoring.

---

## Example Email (Daily Nudge)

**Subject:** 🔥 2 High-Impact Tools Found — 2026-03-09

---

**FINANCE**

**ai-cfo-agent - Financial Analysis Multi-Agent**

Relevance: 9/10 | Reputation: 7/10 | Safety: 8/10 | Maturity: 6/10  
Overall: 7.5/10

**Use Case:** Drop-in forecasting engine for Finance Agent - replaces manual cash flow modeling

**Why it matters:** Open source FastAPI + LangGraph system with proven analysis patterns. Needs Xero integration but architecture is solid. Could save 20-30 hours/month on client forecasting.

[Review Tool →](https://github.com/daniel-st3/ai-cfo-agent)

---

**MARKETING**

**seo-audit-framework - Automated Local SEO Auditor**

Relevance: 8/10 | Reputation: 6/10 | Safety: 9/10 | Maturity: 7/10  
Overall: 7.5/10

**Use Case:** Multi-agent SEO audit system for Marketing agent - GBP analysis, competitor research, gap identification

**Why it matters:** Uses 5-prompt framework similar to Sarvesh's system. Production-ready, could replace manual SEO audits for SME clients.

[Review Tool →](https://github.com/example/seo-audit-framework)

---

## Status

**Built:** ✅ Complete  
**Deployed:** ⏳ Waiting for deployment  
**Cost:** ~$3/month  
**Expected value:** 10-20 high-quality tool discoveries/month

---

**Next:** Run `./deploy.sh` to go live
