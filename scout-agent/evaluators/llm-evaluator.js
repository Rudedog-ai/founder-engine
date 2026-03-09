// LLM Evaluator
// Uses Claude Sonnet to analyze each discovery and score it

export async function evaluateDiscovery(discovery, anthropicApiKey) {
  const prompt = `You are Scout Agent - an AI system that evaluates new tools/repos for a business intelligence platform called Founder Engine.

Founder Engine builds AI agents that understand SME businesses across 8 domains:
- Finance (CFO, forecasting, Xero/QuickBooks integration)
- Sales (CRM, pipeline management, deal scoring)
- Marketing (SEO, content, paid ads, analytics)
- Operations (support, workflows, automation)
- People (HR, hiring, team management)
- Product (roadmap, feature tracking, user research)
- Legal (contracts, compliance, IP)
- Strategy (OKRs, market analysis, board reporting)

Evaluate this tool/repo:

**Title:** ${discovery.title}
**URL:** ${discovery.url}
**Description:** ${discovery.description}
**Source:** ${discovery.source}
**Author:** ${discovery.author}
**Tags:** ${discovery.tags.join(', ')}
**Raw Data:** ${JSON.stringify(discovery.raw_data, null, 2)}

Score the following dimensions (0-10):

1. **Relevance**: Does this help Founder Engine's domain agents? Which domain(s)?
2. **Reputation**: Is this credible? (GitHub stars, maker credibility, funding, real usage signals)
3. **Safety**: Can we trust it? (Open source? Data handling? API security? License? Dependencies?)
4. **Maturity**: Is it production-ready? (Alpha/Beta/Stable? Breaking changes risk? Maintenance?)

Then provide:
- **Use Case**: Specific application in Founder Engine (be concrete)
- **Domain**: Which domain agent benefits most (finance|sales|marketing|operations|people|product|legal|strategy|general)
- **Recommendation**: INVESTIGATE (high priority, review this week) | WATCH (promising but not ready, revisit in 3 months) | IGNORE (not relevant or too risky)
- **Reasoning**: Why these scores/recommendation (2-3 sentences)

Output format (JSON only, no markdown):
{
  "relevance_score": 0-10,
  "reputation_score": 0-10,
  "safety_score": 0-10,
  "maturity_score": 0-10,
  "use_case": "...",
  "domain": "...",
  "recommendation": "INVESTIGATE|WATCH|IGNORE",
  "reasoning": "..."
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      console.error('Anthropic API error:', response.statusText)
      return null
    }

    const data = await response.json()
    const content = data.content[0].text
    
    // Parse JSON response
    const evaluation = JSON.parse(content)
    
    return {
      discovery_id: discovery.id,
      relevance_score: evaluation.relevance_score,
      reputation_score: evaluation.reputation_score,
      safety_score: evaluation.safety_score,
      maturity_score: evaluation.maturity_score,
      use_case: evaluation.use_case,
      domain: evaluation.domain,
      recommendation: evaluation.recommendation,
      reasoning: evaluation.reasoning,
      evaluated_by: 'claude-sonnet-4'
    }
  } catch (error) {
    console.error('Error evaluating discovery:', error)
    return null
  }
}
