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

    let { company_id, source, folder_ids, date_filter } = await req.json()

    if (!company_id || !source) {
      return new Response(
        JSON.stringify({ error: 'Missing company_id or source' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // If no folder_ids provided, get from companies table (founder-selected scope)
    if (!folder_ids || folder_ids.length === 0) {
      const { data: company } = await supabase
        .from('companies')
        .select('google_drive_folder_id')
        .eq('id', company_id)
        .single()
      
      if (company?.google_drive_folder_id) {
        folder_ids = [company.google_drive_folder_id]
        console.log(`Using founder-selected folder: ${company.google_drive_folder_id}`)
      } else {
        console.warn('No folder selected - will scan all Drive (expensive!)')
      }
    }

    // Date filter options
    const dateFilterMonths = date_filter?.months || 24 // Default: last 24 months
    const useModifiedDate = date_filter?.use_modified !== false // Default: use modifiedTime
    const minDate = new Date()
    minDate.setMonth(minDate.getMonth() - dateFilterMonths)

    // Get OAuth token for this source
    const { data: driveSource, error: driveError } = await supabase
      .from('connected_sources')
      .select('*')
      .eq('company_id', company_id)
      .eq('source_type', source)
      .eq('is_active', true)
      .single()

    if (driveError || !driveSource) {
      return new Response(
        JSON.stringify({ error: 'Google Drive not connected' }),
        { status: 400, headers: corsHeaders }
      )
    }

    const accessToken = driveSource.oauth_token

    // Track stats
    let totalBeforeDate = 0
    let totalAfterDate = 0
    let relevantCount = 0
    let totalCost = 0
    let factsExtracted = 0
    
    // PHASE 0: DATE FILTER (Free - before any LLM calls!)
    console.log(`PHASE 0: Date filtering (last ${dateFilterMonths} months)...`)
    
    // For Google Drive
    if (source === 'google_drive') {
      // Build folder query
      let folderQuery = ''
      if (folder_ids && folder_ids.length > 0) {
        folderQuery = folder_ids.map((id: string) => `'${id}' in parents`).join(' or ')
      } else {
        folderQuery = "mimeType!='application/vnd.google-apps.folder'"
      }

      // Build date query (use modifiedTime or createdTime)
      const dateField = useModifiedDate ? 'modifiedTime' : 'createdTime'
      const dateQuery = `${dateField} > '${minDate.toISOString()}'`
      
      // Combine queries
      const query = `(${folderQuery}) and ${dateQuery} and trashed=false`
      
      console.log(`Query: ${query}`)
      
      // List ALL files first (to get count before date filter)
      const allFilesQuery = folder_ids && folder_ids.length > 0
        ? `(${folderQuery}) and trashed=false`
        : "mimeType!='application/vnd.google-apps.folder' and trashed=false"
      
      const allFilesUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(allFilesQuery)}&fields=files(id)&pageSize=1000`
      
      const allFilesResponse = await fetch(allFilesUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (!allFilesResponse.ok) {
        throw new Error(`Failed to list all files: ${allFilesResponse.statusText}`)
      }
      
      const allFilesData = await allFilesResponse.json()
      totalBeforeDate = allFilesData.files?.length || 0
      
      // Now list files WITH date filter
      const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,createdTime,size)&pageSize=1000`
      
      const listResponse = await fetch(listUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (!listResponse.ok) {
        throw new Error(`Failed to list Drive files: ${listResponse.statusText}`)
      }
      
      const listData = await listResponse.json()
      const files = listData.files || []
      
      totalAfterDate = files.length
      
      const dateReduction = totalBeforeDate > 0 ? Math.round((1 - totalAfterDate / totalBeforeDate) * 100) : 0
      console.log(`Date filter: ${totalBeforeDate} total → ${totalAfterDate} after filter (${dateReduction}% reduction)`)
      
    // PHASE 1: SCAN - List remaining files
    console.log('PHASE 1: Scanning filtered files...')

      // PHASE 2: FILTER - Haiku relevance check
      console.log(`PHASE 2: Filtering ${files.length} files (${totalBeforeDate - totalAfterDate} skipped by date)...`)
      
      for (const file of files) {
        // Download first 2000 chars for relevance check
        const exportUrl = file.mimeType.includes('google-apps')
          ? `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`
          : `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`

        const contentResponse = await fetch(exportUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })

        if (!contentResponse.ok) {
          console.error(`Failed to download file: ${file.name}`)
          continue
        }

        const fullContent = await contentResponse.text()
        const snippet = fullContent.slice(0, 2000) // First 2K chars for relevance check
        
        const { relevant, confidence, reason } = await isRelevant(file.name, snippet, file.mimeType)
        totalCost += 0.0003 // Haiku cost per call

        if (relevant && confidence > 0.7) {
          relevantCount++
          
          // PHASE 3: EXTRACT - Opus fact extraction
          console.log(`PHASE 3: Extracting facts from ${file.name}...`)
          
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
              document_date: file.modifiedTime || file.createdTime,
              created_at: new Date().toISOString(),
            })
            factsExtracted++
          }
        }

        // Update progress in real-time
        const currentIndex = files.indexOf(file) + 1
        await supabase.from('ingestion_progress').upsert({
          company_id,
          source,
          total_files_before_date: totalBeforeDate,
          total_files: totalAfterDate,
          scanned_files: currentIndex,
          relevant_files: relevantCount,
          facts_extracted: factsExtracted,
          estimated_cost: totalCost,
          date_filter_months: dateFilterMonths,
          status: 'processing',
          started_at: currentIndex === 1 ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'company_id,source' })
      }

      // Mark as complete
      await supabase.from('ingestion_progress').upsert({
        company_id,
        source,
        total_files_before_date: totalBeforeDate,
        total_files: totalAfterDate,
        scanned_files: totalAfterDate,
        relevant_files: relevantCount,
        facts_extracted: factsExtracted,
        estimated_cost: totalCost,
        date_filter_months: dateFilterMonths,
        status: 'complete',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'company_id,source' })

      const dateReduction = totalBeforeDate > 0 ? Math.round((1 - totalAfterDate / totalBeforeDate) * 100) : 0
      const relevanceRate = totalAfterDate > 0 ? (relevantCount / totalAfterDate) * 100 : 0

      return new Response(
        JSON.stringify({
          status: 'complete',
          total_files_before_date: totalBeforeDate,
          total_files_after_date: totalAfterDate,
          date_filter_reduction: `${dateReduction}%`,
          date_filter_months: dateFilterMonths,
          relevant_files: relevantCount,
          relevance_rate: `${relevanceRate.toFixed(1)}%`,
          facts_extracted: factsExtracted,
          total_cost: `$${totalCost.toFixed(2)}`,
          cost_savings: `$${((totalBeforeDate - totalAfterDate) * 0.0003 + (totalBeforeDate - totalAfterDate) * 0.015 * 0.2).toFixed(2)}`,
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
