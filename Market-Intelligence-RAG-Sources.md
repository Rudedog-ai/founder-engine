# Founder Engine — Market Intelligence RAG Sources
**Curated: 06 March 2026 | 30 high-signal sources**
*This file feeds the daily RAG crawl pipeline. Update when sources change quality or frequency.*
*DO NOT add generic AI news sites (TechCrunch, VentureBeat). Practitioner content only.*

---

## How This File Is Used

The Market Intelligence RAG pipeline crawls these sources on a daily schedule via Perplexity API.
New content is chunked, embedded, and added to the market intelligence knowledge base.
Angus queries this alongside the company brain on every relevant question.
Source is always cited: "According to [source] published [date]..."

Monitoring frequency is defined per source. Prioritise UK sources for the knowledge base.

---

## Category 1 — Practitioners & Influencers

| # | Name | URL | Type | Geography | Update Frequency |
|---|------|-----|------|-----------|-----------------|
| 1 | Tom Hunt | https://linkedin.com/in/tomhuntio | LinkedIn / Podcast | UK (London) | Daily (LinkedIn), Weekly (podcast) |
| 2 | Kieran Flanagan | https://www.kieranflanagan.io | Substack / Podcast | Ireland | Weekly |
| 3 | Lara Acosta | https://linkedin.com/in/laraacostar | LinkedIn / Newsletter | Europe (UK/EU) | Daily (LinkedIn), Weekly (newsletter) |
| 4 | Nick Saraev | https://www.youtube.com/@nicksaraev | YouTube / Blog | Canada | Weekly (YouTube), 2-3x/wk (LinkedIn) |
| 5 | Dan Martell | https://www.danmartell.com | YouTube / Newsletter | Canada | 2-3x/wk (YouTube), Weekly (email) |
| 6 | Greg Isenberg | https://www.youtube.com/@GregIsenberg | Podcast / YouTube | USA | 2x/wk (podcast), Daily (X) |
| 7 | Dan Koe | https://letters.thedankoe.com | Substack / YouTube | USA | Weekly |

**What to extract from this category:**
- AI tool stacks being used in production (named tools with outcomes)
- Workflow frameworks and methodologies
- Revenue/cost data attached to specific AI implementations
- What AI cannot yet do (honest failure modes)

### Source Notes

**Tom Hunt** — Clearest UK practitioner. Runs Fame (£4.5M ARR, bootstrapped). Documents operational AI decisions daily. "Future of Marketing" podcast. UK/EU B2B founder audience. Priority source.

**Kieran Flanagan** — Only European voice with verifiable AI workflow results at GTM scale. Exact email personalisation flows (30% sales meeting uplift at HubSpot). Builds tools in public.

**Lara Acosta** — European-based. Shares actual tool stack (Apollo, Kleo, ChatGPT prompts). 3-Step AI Lead Gen System. $1M+ business at 27 with 89% margins using AI stack.

**Nick Saraev** — Most technically rigorous practitioner. Two agencies at $160K/mo. DOE framework for agentic workflow architecture. Free 6-hour agentic workflows course. Exact code and revenue figures.

**Dan Martell** — Investor/operator running Martell Ventures. Four core AI automations: outbound, lead capture, delivery/support, financial ops. Named tools and outcomes from portfolio companies.

**Greg Isenberg** — Former Reddit/TikTok advisor. Live practitioner. Brings in builders to demo working AI systems. 318 episodes. Building $1M+ businesses as solo founder using AI.

**Dan Koe** — Clearest thinker on structural shift in how small businesses operate with AI. 175K+ newsletter readers. Honest about what AI cannot yet do.

---

## Category 2 — Tool Review & Comparison Sites

| # | Name | URL | Type | Geography | Update Frequency |
|---|------|-----|------|-----------|-----------------|
| 8 | The CRO Report | https://thecroreport.com | Newsletter / Review | USA | Weekly |
| 9 | OMR Reviews (AI Category) | https://omr.com/en/reviews/category/ai | Review Platform | Germany / EU | Continuous |
| 10 | TopTenAIAgents.co.uk | https://toptenaiagents.co.uk | Review Site | UK | Semi-annual (Jan + Jul) |
| 11 | accountingai.tools | https://accountingai.tools | Comparison Site | USA | Updated 2026 |
| 12 | White Space Solutions | https://www.whitespacesolutions.ai/content/ai-sdr-tools-comparison | Comparison Guide | USA | Periodic |

**What to extract from this category:**
- Pricing changes for key tools (voice SDR, outbound, accounting AI)
- Hidden costs and contract terms
- Churn data and failure rates
- Tool rankings and capability comparisons
- GDPR compliance status of tools (critical for UK clients)

### Source Notes

**The CRO Report** — Explicit no-payment policy. Author is VP Revenue at Firmograph.ai. Publishes hidden costs and red flags. Actual pricing: $5K/mo 11x, $0.75/message AiSDR. Churn data (75% 3-month churn at 11x).

**OMR Reviews** — Largest European-focused AI tool review platform. 905+ AI products. 54,000+ verified reviews. GDPR/EU data residency filters. Strong GDPR compliance angle. Priority for UK client recommendations.

**TopTenAIAgents.co.uk** — Only dedicated UK-focused AI tool review site. UK-specific: GDPR compliance, GBP pricing, HMRC integrations, UK support hours. Semi-annual updates (January and July).

**accountingai.tools** — Only dedicated AI accounting comparison site. 17+ tools covered. Maps precisely to the bookkeeping AI space (Vic.ai, Zeni, Trullion, Docyt, Botkeeper, Dext, Datarails).

**White Space Solutions** — Practitioner-written (tested and implemented AI SDRs for clients). Rare nuance: compares black-box AI SDR vs composable stack approach (Clay + Instantly + Apollo).

---

## Category 3 — Case Study Sources

| # | Name | URL | Type | Geography | Update Frequency |
|---|------|-----|------|-----------|-----------------|
| 13 | Simon Høiberg | https://www.youtube.com/@SimonHoiberg | YouTube | Denmark / EU | Multiple times per week |
| 14 | The Change Dude (Saeed Rafay) | https://open.spotify.com/show/7adDffbLk6SfwGxRbYNwRM | Podcast | UK | Weekly (82+ episodes) |
| 15 | Innovate UK: AI for Services | https://iuk-business-connect.org.uk/news/ai-for-services-podcast-series-2-stories-of-change-in-finance-and-professional-services/ | Podcast Series | UK | Series format |
| 16 | SaaStr / Jason Lemkin | https://www.saastr.com/we-deployed-20-ai-agents-and-replaced-our-entire-sdr-team-heres-what-actually-works-video-pod/ | Blog / Podcast | USA | 2-3x/wk (blog) |
| 17 | The Bootstrapped Founder (Arvid Kahl) | https://thebootstrappedfounder.com | Podcast / Blog | Germany / EU | Weekly |
| 18 | Dan Cumberland Labs | https://dancumberlandlabs.com/blog/founder-ai-stories/ | Blog / Case Studies | USA | Periodic |

**What to extract from this category:**
- Before/after metrics from real business transformations
- Named tools used at each stage of transformation
- Failure modes and what went wrong
- Time to value — how long transformation actually took
- Team size reductions and cost savings with hard numbers

### Source Notes

**Simon Høiberg** — Highest-signal case study source. Reduced team 11→3 while revenue grew. "RIP model" framework (Repetitive, Predictable, Isolated) for which roles AI replaces. No vendor sponsorship.

**The Change Dude** — UK-based host. UK/EU SME transformation stories with specific metrics. UK retailer: 70% refund delay reduction. Dutch EdTech: 84% response time improvement. Priority UK source.

**Innovate UK: AI for Services** — Government-funded neutrality. Every guest is a UK SME operator, not vendor. Covers barriers honestly. Switchfoot Accounting, Tapoly InsurTech, Recap crypto tax. Priority UK source.

**SaaStr / Jason Lemkin** — Deployed 20+ AI SDR agents replacing entire team. 60,000+ emails, 130+ meetings booked, 15% of SaaStr London event revenue from AI. Includes 6 years of prior failures.

**Arvid Kahl** — German-based bootstrapped founder. Posts actual token costs and API tier decisions. 430+ episodes. Real production AI costs (OpenAI Flex tier = 50% cost cut). European SME perspective.

**Dan Cumberland Labs** — All cases name actual founder, business type, and before/after outcomes. Honest: only 7% of AI projects scale. Small business scale (sub-$1M revenue).

---

## Category 4 — Research & Frameworks (SME-Specific)

| # | Name | URL | Type | Geography | Update Frequency |
|---|------|-----|------|-----------|-----------------|
| 19 | Innovate UK BridgeAI / Digital Catapult | https://iuk-business-connect.org.uk/programme/bridgeai/ | Government Programme | UK | Annual + quarterly |
| 20 | Be the Business | https://bethebusiness.com/our-thinking/ | Research / Charity | UK | Quarterly (PBI) + 1-2 reports/yr |
| 21 | Enterprise Research Centre (ERC) | https://www.enterpriseresearch.ac.uk | Academic Research | UK | 8-12 papers/yr |
| 22 | UK SME Digital Adoption Taskforce | https://www.gov.uk/government/publications/sme-digital-adoption-taskforce-final-report/ | Government Policy | UK | One-time + implementation |
| 23 | OECD — AI Adoption by SMEs | https://www.oecd.org/en/publications/2025/12/ai-adoption-by-small-and-medium-sized-enterprises_9c48eae6.html | International Research | OECD / G7 | Annual |
| 24 | The Productivity Institute | https://www.productivity.ac.uk | Academic Research | UK | 2-4 reports/yr |

**What to extract from this category:**
- Statistics on UK SME AI adoption rates
- Barriers to AI adoption (time, cost, knowledge, leadership, regulation)
- Evidence-based frameworks for transformation sequencing
- Government support programmes and funding available
- Productivity gains measured in real businesses

### Source Notes

**Innovate UK BridgeAI** — £100M programme. Four-phase AI Adoption Framework. 560+ organisations funded, 2,500+ engaged. Free toolkits. Priority UK source.

**Be the Business** — Only org surveying UK SMEs specifically on AI adoption at scale. 1,135 businesses surveyed. Quarterly Productive Business Index. Cited in government Taskforce as primary evidence base.

**ERC** — UK gold-standard SME research. ESRC-funded, peer-reviewed. 100% focused on sub-250 employee businesses. Designed the government LSBS survey. Technology adoption productivity: 7-18% gains.

**UK SME Digital Adoption Taskforce** — Most comprehensive UK government framework. £94Bn/yr GDP opportunity identified. 10-recommendation blueprint. Shapes policy 2025-2027. "CTO as a Service" proposal.

**OECD SME AI** — Only internationally comparable framework. Taxonomy of AI Adopters: Novices/Explorers/Optimisers/Transformers. Usable as 15-minute diagnostic. Benchmarks UK against G7 peers.

**The Productivity Institute** — Unique participatory method (intervened in firms, measured outcomes). Focuses on micro and small enterprises. Identifies leadership confidence as primary adoption predictor (not budget).

---

## Category 5 — Tool-Specific Blogs

| # | Name | URL | Type | Geography | Update Frequency |
|---|------|-----|------|-----------|-----------------|
| 25 | Vapi Blog | https://vapi.ai/blog | Voice SDR Platform | USA | 2-4 posts/month |
| 26 | Clay Blog | https://www.clay.com/blog | Outbound Sales AI | USA (EU expanding) | 2-4 posts/month |
| 27 | Instantly Blog | https://instantly.ai/blog/ | Outbound Sales AI | Canada | Weekly+ |
| 28 | Vic.ai Blog | https://www.vic.ai/blog | AI Accounting | Norway / USA | Monthly + quarterly |
| 29 | Docyt Blog | https://docyt.com/blog/ | AI Bookkeeping | USA | 2-4 posts/month |
| 30 | Relevance AI Blog | https://relevanceai.com/blog | Workflow / Ops Automation | Australia (global) | 1-2 posts/month |

**What to extract from this category:**
- Pricing changes (surface immediately — affects client recommendations)
- New feature releases that change capability comparisons
- Real customer case studies with metrics
- Product roadmap signals
- Engineering changelogs (rare but high signal when published)

### Source Notes

**Vapi Blog** — Only voice AI blog publishing real ROI case studies with hard numbers. 1M+ call minutes. 4 engineers → 50 agent capacity. Pricing updates surface here first.

**Clay Blog** — GTM engineering playbooks. Transparent pricing rationale. "How Clay uses Clay" operational case studies. European expansion confirms UK/EU commitment. $100M ARR milestone data.

**Instantly Blog** — Most up-to-date deliverability reference (critical as inbox protection tightens). Weekly content. Repositioning as agent platform tracked here. Plans from $37/mo.

**Vic.ai Blog** — Norwegian origin = GDPR-native. Quarterly releases read like engineering changelogs (rare transparency). VicAgents signals agentic finance category emergence. Original research with 800 respondents.

**Docyt Blog** — Genuinely AI-agent-native (named agents: GARY bookkeeper + Docyt Copilot). Monthly changelogs track capability progression. SME-accessible pricing (~$299/mo).

**Relevance AI Blog** — Defining the "AI Workforce" category. Real customer case studies. No-code/low-code = SME accessible (from $19/mo). Open-source engineering contributions signal credibility.

---

## Recommended Monitoring Schedule

| Frequency | Source | What to Look For |
|-----------|--------|-----------------|
| DAILY | Tom Hunt | LinkedIn posts on AI-first ops decisions, new podcast episodes |
| DAILY | Lara Acosta | LinkedIn AI lead gen system updates, tool stack changes |
| DAILY | Nick Saraev | New YouTube tutorials, workflow templates, tool comparisons |
| WEEKLY | Kieran Flanagan | Substack newsletter on AI GTM workflows |
| WEEKLY | Dan Koe | Newsletter on one-person AI business architecture |
| WEEKLY | The CRO Report | AI SDR pricing changes, new tool reviews, churn data |
| WEEKLY | Vapi Blog | Voice AI case studies, pricing updates, feature releases |
| WEEKLY | Clay Blog | Pricing changes, GTM playbooks, EU expansion updates |
| WEEKLY | Instantly Blog | Deliverability changes, AI agent features, compliance updates |
| WEEKLY | Simon Høiberg | New AI team replacement case studies, RIP model updates |
| WEEKLY | The Change Dude | UK/EU SME transformation stories with metrics |
| MONTHLY | Dan Martell | AI operating system updates for $1-10M businesses |
| MONTHLY | Greg Isenberg | AI startup opportunities, vibe coding trends |
| MONTHLY | OMR Reviews | New AI tool ratings, quarterly OMR Grid awards |
| MONTHLY | Docyt Blog | AI bookkeeping agent features, monthly changelogs |
| MONTHLY | Relevance AI Blog | AI Workforce use cases, Inside AI Ops case studies |
| MONTHLY | Arvid Kahl | Production AI costs, bootstrapped founder AI integration |
| QUARTERLY | Be the Business | Productive Business Index update, new UK AI adoption data |
| QUARTERLY | BridgeAI / Digital Catapult | New toolkits, accelerator cohorts, annual review |
| QUARTERLY | ERC | New research papers, State of Small Business Britain |
| QUARTERLY | Vic.ai Blog | Quarterly product releases, AP autonomy benchmarks |
| QUARTERLY | OECD SME AI | Annual AI adoption tracking, taxonomy updates |

**Note:** "Daily" sources publish daily but may only warrant crawling 2-3x per week depending on API costs. Prioritise UK sources (Tom Hunt, The Change Dude, Be the Business, BridgeAI) for the knowledge base.

---

## RAG Pipeline Instructions

When this source list is implemented as a daily crawl:

1. Fetch content from each URL at the defined monitoring frequency
2. Chunk by article/post (one chunk per piece of content, not paragraphs)
3. Add metadata: source_name, source_category, source_geography, published_date, url
4. Embed and store in market_intelligence_chunks table (separate from company brain)
5. Angus queries market RAG alongside company brain on questions about tools and methodology
6. Always cite: "According to [source name] ([date])..."
7. Flag content older than 90 days as potentially stale for tool pricing/features
8. Never flag research content (Category 4) as stale — frameworks remain valid longer

---

*Founder Engine — Market Intelligence RAG Sources | March 2026*
*Store in: Google Drive > Founder Engine — Working Docs*
*Update when sources change quality, go dark, or new high-signal sources are identified*
