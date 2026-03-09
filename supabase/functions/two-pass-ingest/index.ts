// two-pass-ingest
// Smart filtering: Haiku relevance check → Opus fact extraction
// Cost-efficient: ~$33 for 10K files vs $150 naive approach

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk@0.20.9'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
})

// Phase 1: Quick relevance check (Haiku - $0.0003 per doc)
async function isRelevant(filename: string, snippet: string, mimeType: string): Promise<{ relevant: boolean; confidence: number; reason: string }> {
  const prompt = `Is this document relevant for business intelligence (finance, sales, marketing, operations, strategy)?

Filename: ${filename}
Type: ${mimeType}
First 500 chars: ${snippet.slice(0, 500)}

Return JSON only:
{
  "relevant": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}

Examples:
- "Q4 2023 Financial Report.pdf" → relevant: true, confidence: 0.95
- "Random vacation photo.jpg" → relevant: false, confidence: 0.90
- "Team meeting notes 2015.docx" → relevant: false, confidence: 0.70 (too old)`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-20250514',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  try {
    const parsed = JSON.parse(text)
    return {
      relevant: parsed.relevant || false,
      confidence: parsed.confidence || 0,
      reason: parsed.reason || 'Unknown',
    }
  } catch {
    return { relevant: false, confidence: 0, reason: 'Parse error' }
  }
}

// Phase 2: Deep fact extraction (Opus - $0.015 per doc)
async function extractFacts(filename: string, content: string, mimeType: string): Promise<Array<{
  domain: string;
  fact_type: string;
  entity?: string;
  value?: number;
  text: string;
  confidence: number;
}>> {
  const prompt = `Extract structured business facts from this document.

Filename: ${filename}
Type: ${mimeType}
Content:
${content.slice(0, 50000)} // Max 50K chars

Extract facts in these categories:
- FINANCE: revenue, expenses, runway, burn rate, unit economics
- SALES: deals, pipeline, customers, churn, win/loss reasons
- MARKETING: traffic, conversions, CAC, campaigns, channels
- OPERATIONS: processes, tools, bottlenecks, efficiency
- PEOPLE: headcount, hiring, retention, org structure
- PRODUCT: features, adoption, usage, roadmap
- LEGAL: contracts, compliance, IP, risks
- STRATEGY: goals, market, competitors, positioning

Return JSON array:
[
  {
    "domain": "finance",
    "fact_type": "revenue",
    "entity": "OYNB",
    "value": 180000,
    "text": "OYNB ARR: £180K as of Q4 2023",
    "confidence": 0.9
  },
  {
    "domain": "sales",
    "fact_type": "lost_deal",
    "entity": "Acme Corp",
    "value": 25000,
    "text": "Lost Acme Corp deal ($25K) due to missing Slack integration",
    "confidence": 0.85
  }
]

Rules:
- Extract FACTS not opinions
- Include numbers when available
- High confidence (>0.8) for explicit statements
- Medium confidence (0.5-0.8) for inferred facts
- Skip generic/vague statements`

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  try {
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    console.error('Failed to parse facts:', text)
    return []
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { company_id, source, folder_ids } = await req.json()

    if (!company_id || !source) {
      return new Response(
        JSON.stringify({ error: 'Missing company_id or source' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Get OAuth token for this source
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('company_id', company_id)
      .eq('toolkit', source)
      .single()

    if (!integration || !integration.composio_connection_id) {
      return new Response(
        JSON.stringify({ error: 'Source not connected' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // PHASE 1: SCAN - List all files
    console.log('PHASE 1: Scanning files...')
    
    // For Google Drive
    if (source === 'google_drive') {
      // Build folder query
      const folderQuery = folder_ids && folder_ids.length > 0
        ? folder_ids.map((id: string) => `'${id}' in parents`).join(' or ')
        : null

      const query = folderQuery || "mimeType!='application/vnd.google-apps.folder'"
      
      // TODO: Use Composio to list files
      // For now, mock response
      const files = [
        { id: '1', name: 'Q4 2023 Financials.pdf', mimeType: 'application/pdf', modifiedTime: '2023-12-01' },
        { id: '2', name: 'Random Notes.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', modifiedTime: '2015-01-01' },
      ]

      let relevantCount = 0
      let totalCost = 0
      let factsExtracted = 0

      // PHASE 2: FILTER - Haiku relevance check
      console.log(`PHASE 2: Filtering ${files.length} files...`)
      
      for (const file of files) {
        // Get first 500 chars of content (via Composio)
        const snippet = `Sample content for ${file.name}...` // TODO: Fetch real content
        
        const { relevant, confidence, reason } = await isRelevant(file.name, snippet, file.mimeType)
        totalCost += 0.0003 // Haiku cost per call

        if (relevant && confidence > 0.7) {
          relevantCount++
          
          // PHASE 3: EXTRACT - Opus fact extraction
          console.log(`PHASE 3: Extracting facts from ${file.name}...`)
          
          const fullContent = `Full content for ${file.name}...` // TODO: Fetch real content
          const facts = await extractFacts(file.name, fullContent, file.mimeType)
          totalCost += 0.015 // Opus cost per call

          // Store facts in knowledge_elements
          for (const fact of facts) {
            await supabase.from('knowledge_elements').insert({
              company_id,
              domain: fact.domain,
              fact_type: fact.fact_type,
              entity: fact.entity,
              value: fact.value,
              text: fact.text,
              confidence: fact.confidence,
              source: source,
              source_id: file.id,
              source_name: file.name,
              created_at: new Date().toISOString(),
            })
            factsExtracted++
          }
        }

        // Update progress in real-time
        await supabase.from('ingestion_progress').upsert({
          company_id,
          source,
          total_files: files.length,
          scanned_files: files.indexOf(file) + 1,
          relevant_files: relevantCount,
          facts_extracted: factsExtracted,
          estimated_cost: totalCost,
          status: 'processing',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'company_id,source' })
      }

      // Mark as complete
      await supabase.from('ingestion_progress').upsert({
        company_id,
        source,
        total_files: files.length,
        scanned_files: files.length,
        relevant_files: relevantCount,
        facts_extracted: factsExtracted,
        estimated_cost: totalCost,
        status: 'complete',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'company_id,source' })

      return new Response(
        JSON.stringify({
          status: 'complete',
          total_files: files.length,
          relevant_files: relevantCount,
          relevance_rate: (relevantCount / files.length) * 100,
          facts_extracted: factsExtracted,
          total_cost: totalCost.toFixed(2),
        }),
        { headers: corsHeaders }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Source not yet supported' }),
      { status: 400, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})
