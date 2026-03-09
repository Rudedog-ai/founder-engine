// create-google-drive-folder
// v1.0 | 9 March 2026
// Create "Founder Engine Data" folder in user's Google Drive

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
    const { company_id, folder_name = 'Founder Engine Data' } = await req.json()

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

    // Check if folder already exists
    const composioApiKey = Deno.env.get('COMPOSIO_API_KEY')
    if (!composioApiKey) {
      throw new Error('COMPOSIO_API_KEY not configured')
    }

    // First, search for existing folder
    const searchResponse = await fetch('https://backend.composio.dev/api/v2/actions/execute', {
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
          q: `name='${folder_name}' AND mimeType='application/vnd.google-apps.folder' AND trashed=false`,
          pageSize: 1,
          fields: 'files(id,name)'
        }
      })
    })

    if (searchResponse.ok) {
      const searchResult = await searchResponse.json()
      const existingFolders = searchResult.data?.files || []
      
      if (existingFolders.length > 0) {
        // Folder already exists, return it
        const existingFolder = existingFolders[0]
        
        // Save to database
        await supabase
          .from('companies')
          .update({
            google_drive_folder_id: existingFolder.id,
            google_drive_folder_name: existingFolder.name
          })
          .eq('id', company_id)

        return new Response(
          JSON.stringify({ 
            folder_id: existingFolder.id,
            folder_name: existingFolder.name,
            existed: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Create new folder
    const createResponse = await fetch('https://backend.composio.dev/api/v2/actions/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': composioApiKey
      },
      body: JSON.stringify({
        connectedAccountId: integration.connected_account_id,
        appName: 'google_drive',
        actionName: 'GOOGLE_DRIVE_CREATE_FILE',
        input: {
          name: folder_name,
          mimeType: 'application/vnd.google-apps.folder'
        }
      })
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error('Composio API error:', errorText)
      throw new Error(`Failed to create folder: ${createResponse.statusText}`)
    }

    const createResult = await createResponse.json()
    const newFolder = createResult.data

    if (!newFolder?.id) {
      throw new Error('Folder created but no ID returned')
    }

    // Save folder ID to companies table
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        google_drive_folder_id: newFolder.id,
        google_drive_folder_name: folder_name
      })
      .eq('id', company_id)

    if (updateError) {
      console.error('Failed to save folder ID:', updateError)
      // Don't throw - folder is created, just log warning
    }

    return new Response(
      JSON.stringify({ 
        folder_id: newFolder.id,
        folder_name: folder_name,
        existed: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error creating folder:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
