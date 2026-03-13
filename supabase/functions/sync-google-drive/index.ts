// sync-google-drive v3.0 | 13 March 2026
// Webhook handler + manual sync for Google Drive file changes
// v3: Uses native Google OAuth (Composio removed)
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import Anthropic from 'npm:@anthropic-ai/sdk@0.20.9'
import { getGoogleToken } from '../_shared/google-token.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
})

// Haiku relevance check ($0.0003 per doc)
async function isRelevant(filename: string, snippet: string, mimeType: string) {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-20250514',
    max_tokens: 200,
    messages: [{ role: 'user', content: `Is this document relevant for business intelligence (finance, sales, marketing, operations, strategy)?\nFilename: ${filename}\nType: ${mimeType}\nFirst 500 chars: ${snippet.slice(0, 500)}\n\nReturn JSON only: { "relevant": true/false, "confidence": 0.0-1.0, "reason": "brief explanation" }` }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  try {
    const p = JSON.parse(text)
    return { relevant: p.relevant || false, confidence: p.confidence || 0, reason: p.reason || '' }
  } catch {
    return { relevant: false, confidence: 0, reason: 'Parse error' }
  }
}

// Opus fact extraction ($0.015 per doc)
async function extractFacts(filename: string, content: string, mimeType: string) {
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: `Extract structured business facts from this document.\n\nFilename: ${filename}\nType: ${mimeType}\nContent:\n${content.slice(0, 50000)}\n\nDomains: FINANCE, SALES, MARKETING, OPERATIONS, PEOPLE, PRODUCT, LEGAL, STRATEGY\n\nReturn JSON array:\n[{ "domain": "finance", "fact_type": "revenue", "entity": "CompanyName", "value": 180000, "text": "CompanyName ARR: £180K as of Q4 2023", "confidence": 0.9 }]\n\nRules:\n- Extract FACTS not opinions\n- Include numbers when available\n- High confidence (>0.8) for explicit statements\n- Medium confidence (0.5-0.8) for inferred facts\n- Skip generic/vague statements` }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  try {
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    console.error('Failed to parse facts:', text.slice(0, 200))
    return []
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Detect webhook vs manual trigger
    const xGoogChannelId = req.headers.get('X-Goog-Channel-ID')
    const xGoogResourceState = req.headers.get('X-Goog-Resource-State')

    let company_id: string | null = null
    let file_id: string | null = null

    if (xGoogChannelId) {
      // Webhook: find company by channel ID from companies table
      console.log('Webhook received:', { xGoogChannelId, xGoogResourceState })

      const { data: company, error } = await supabase
        .from('companies')
        .select('id')
        .eq('google_webhook_channel_id', xGoogChannelId)
        .single()

      if (error || !company) throw new Error('Unknown webhook channel')
      company_id = company.id

      // Acknowledge sync notifications without processing
      if (xGoogResourceState === 'sync') {
        return new Response(JSON.stringify({ status: 'sync_ack' }), { headers: corsHeaders })
      }
    } else {
      // Manual trigger
      const body = await req.json()
      company_id = body.company_id
      file_id = body.file_id || null
      if (!company_id) throw new Error('Missing company_id')
    }

    // Get OAuth token via native Google OAuth (from companies table)
    const accessToken = await getGoogleToken(supabase, company_id)

    // Get folder scope from companies table
    const { data: companyData } = await supabase
      .from('companies')
      .select('google_drive_folder_id')
      .eq('id', company_id)
      .single()

    const folderId = companyData?.google_drive_folder_id

    // Build Drive API request
    let listUrl: string
    if (file_id) {
      listUrl = `https://www.googleapis.com/drive/v3/files/${file_id}?fields=id,name,mimeType,modifiedTime,size`
    } else if (folderId) {
      listUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=100&orderBy=modifiedTime+desc`
    } else {
      console.warn('No folder selected — scanning recent Drive files')
      listUrl = `https://www.googleapis.com/drive/v3/files?q=trashed=false&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=50&orderBy=modifiedTime+desc`
    }

    const listResponse = await fetch(listUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    if (!listResponse.ok) throw new Error(`Drive API error: ${listResponse.statusText}`)

    const listData = await listResponse.json()
    const files = file_id ? [listData] : (listData.files || [])

    let processedCount = 0
    let factsExtracted = 0

    for (const file of files) {
      // Download file content
      const exportUrl = file.mimeType.includes('google-apps')
        ? `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`
        : `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`

      const contentResponse = await fetch(exportUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      if (!contentResponse.ok) {
        console.error(`Failed to download: ${file.name}`)
        continue
      }

      const fullContent = await contentResponse.text()

      // Haiku relevance check
      const { relevant, confidence } = await isRelevant(file.name, fullContent.slice(0, 2000), file.mimeType)

      if (relevant && confidence > 0.7) {
        // Opus fact extraction
        const facts = await extractFacts(file.name, fullContent, file.mimeType)

        for (const fact of facts) {
          await supabase.from('knowledge_elements').insert({
            company_id,
            domain: fact.domain,
            fact_type: fact.fact_type,
            entity: fact.entity,
            value: fact.value,
            text: fact.text,
            confidence: fact.confidence,
            source: 'google_drive',
            source_id: file.id,
            source_name: file.name,
            document_date: file.modifiedTime,
            created_at: new Date().toISOString(),
          })
          factsExtracted++
        }
      }

      processedCount++
    }

    // Log sync event
    await supabase.from('ingest_log').insert({
      company_id,
      event_type: xGoogChannelId ? 'webhook_sync' : 'manual_sync',
      source_type: 'google_drive',
      details: { files_processed: processedCount, facts_extracted: factsExtracted }
    })

    return new Response(
      JSON.stringify({ success: true, files_processed: processedCount, facts_extracted: factsExtracted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Drive sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
