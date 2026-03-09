// list-google-drive-folders
// v1.0 | 9 March 2026
// List folders in user's Google Drive for folder selection

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Folder {
  id: string
  name: string
  createdTime: string
  modifiedTime: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { company_id } = await req.json()

    if (!company_id) {
      throw new Error('Missing company_id')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Google Drive integration
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('company_id', company_id)
      .eq('toolkit', 'google_drive')
      .eq('status', 'connected')
      .single()

    if (integrationError || !integration) {
      throw new Error('Google Drive not connected')
    }

    // Call Composio to list folders
    // Query: mimeType='application/vnd.google-apps.folder' AND trashed=false
    const composioApiKey = Deno.env.get('COMPOSIO_API_KEY')
    if (!composioApiKey) {
      throw new Error('COMPOSIO_API_KEY not configured')
    }

    const response = await fetch('https://backend.composio.dev/api/v2/actions/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': composioApiKey
      },
      body: JSON.stringify({
        connectedAccountId: integration.connected_account_id,
        appName: 'google_drive',
        actionName: 'GOOGLE_DRIVE_LIST_FILES',
        input: {
          q: "mimeType='application/vnd.google-apps.folder' AND trashed=false",
          pageSize: 100,
          fields: 'files(id,name,createdTime,modifiedTime)',
          orderBy: 'modifiedTime desc'
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Composio API error:', errorText)
      throw new Error(`Failed to list folders: ${response.statusText}`)
    }

    const result = await response.json()

    // Extract folders from Composio response
    const folders: Folder[] = result.data?.files || []

    // Look for "Founder Engine Data" folder specifically
    const targetFolder = folders.find(f => 
      f.name.toLowerCase().includes('founder engine') || 
      f.name.toLowerCase().includes('founderengine')
    )

    return new Response(
      JSON.stringify({ 
        folders,
        targetFolder,
        count: folders.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error listing folders:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
