// sync-google-drive
// v1.0 | 9 March 2026
// Processes new Google Drive files (webhook handler + manual sync)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Check if this is a webhook notification or manual trigger
    const xGoogChannelId = req.headers.get('X-Goog-Channel-ID')
    const xGoogResourceState = req.headers.get('X-Goog-Resource-State')

    let company_id: string | null = null
    let file_id: string | null = null

    if (xGoogChannelId) {
      // Webhook notification from Google Drive
      console.log('Webhook received:', { xGoogChannelId, xGoogResourceState })

      // Find company by webhook channel ID
      const { data: source, error: sourceError } = await supabase
        .from('connected_sources')
        .select('company_id')
        .eq('source_type', 'google_drive')
        .eq('webhook_id', xGoogChannelId)
        .single()

      if (sourceError || !source) {
        throw new Error('Unknown webhook channel')
      }

      company_id = source.company_id

      // For webhooks, we need to list changed files (Google Drive API call)
      // This is a simplified version - full implementation would use pageToken
      // to track changes since last sync
      
    } else {
      // Manual sync trigger
      const body = await req.json()
      company_id = body.company_id
      file_id = body.file_id || null

      if (!company_id) {
        throw new Error('Missing company_id')
      }
    }

    // Get company's Google Drive credentials
    const { data: driveSource, error: driveError } = await supabase
      .from('connected_sources')
      .select('*')
      .eq('company_id', company_id)
      .eq('source_type', 'google_drive')
      .eq('is_active', true)
      .single()

    if (driveError || !driveSource) {
      throw new Error('Google Drive not connected for this company')
    }

    // Get folder ID from companies table (founder-selected scope)
    const { data: company } = await supabase
      .from('companies')
      .select('google_drive_folder_id')
      .eq('id', company_id)
      .single()

    // If no folder selected, scan everything (fallback to old behavior)
    // In production, we should require folder selection first
    const folderId = company?.google_drive_folder_id

    // Refresh token if needed (simplified - full implementation should check expiry)
    const accessToken = driveSource.oauth_token

    // List files in the selected folder (or all files if no folder selected)
    let listUrl: string
    if (file_id) {
      // Single file request
      listUrl = `https://www.googleapis.com/drive/v3/files/${file_id}?fields=id,name,mimeType,modifiedTime,size`
    } else if (folderId) {
      // Folder-scoped scan (RECOMMENDED)
      listUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=1000`
    } else {
      // Full Drive scan (OLD BEHAVIOR - discouraged)
      console.warn('No folder selected - scanning all Drive files (slow, expensive)')
      listUrl = `https://www.googleapis.com/drive/v3/files?q=trashed=false&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=1000`
    }

    const listResponse = await fetch(listUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!listResponse.ok) {
      throw new Error('Failed to list Drive files')
    }

    const listData = await listResponse.json()
    const files = file_id ? [listData] : listData.files || []

    let processedCount = 0

    for (const file of files) {
      // Check if already ingested
      const { data: existing } = await supabase
        .from('raw_documents')
        .select('id')
        .eq('company_id', company_id)
        .eq('source_id', file.id)
        .single()

      if (existing) {
        console.log('File already ingested:', file.name)
        continue
      }

      // Download file content
      const exportUrl = file.mimeType.includes('google-apps')
        ? `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`
        : `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`

      const contentResponse = await fetch(exportUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!contentResponse.ok) {
        console.error('Failed to download file:', file.name)
        continue
      }

      const contentText = await contentResponse.text()

      // Store in raw_documents
      const { data: doc, error: insertError } = await supabase
        .from('raw_documents')
        .insert({
          company_id,
          source_type: 'google_drive',
          source_id: file.id,
          file_name: file.name,
          file_type: file.mimeType,
          content_text: contentText,
          metadata: {
            size: file.size,
            modified_time: file.modifiedTime
          },
          processed: false
        })
        .select()
        .single()

      if (insertError) {
        console.error('Failed to store document:', insertError)
        continue
      }

      // Trigger classification
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/classify-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        },
        body: JSON.stringify({
          company_id,
          document_id: doc.id
        })
      })

      processedCount++
    }

    // Update last_sync_at
    await supabase
      .from('connected_sources')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('company_id', company_id)
      .eq('source_type', 'google_drive')

    // Log sync event
    await supabase.from('ingest_log').insert({
      company_id,
      event_type: 'sync_completed',
      source_type: 'google_drive',
      details: {
        files_processed: processedCount
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        files_processed: processedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Drive sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
