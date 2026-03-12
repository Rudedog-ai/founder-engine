// create-google-drive-folder v3
// v3.0 | 12 March 2026
// Fixed: uses direct Google Drive API (not Composio Actions v2 which fails)
// Gets OAuth token from Composio v3, calls Drive API directly
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

async function getComposioToken(composioConnectionId: string): Promise<string> {
  const composioApiKey = Deno.env.get('COMPOSIO_API_KEY')
  if (!composioApiKey) throw new Error('COMPOSIO_API_KEY not configured')

  const res = await fetch(
    `https://backend.composio.dev/api/v3/connected_accounts/${composioConnectionId}`,
    { headers: { 'x-api-key': composioApiKey } }
  )
  if (!res.ok) throw new Error(`Composio API error: ${res.status}`)

  const account = await res.json()
  const token = account?.connectionParams?.access_token
    || account?.connectionParams?.accessToken
    || account?.authParams?.access_token
    || account?.auth_params?.access_token
  if (!token) throw new Error('No access token found in Composio account')
  return token
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { company_id, folder_name = 'Founder Engine Data' } = await req.json()
    if (!company_id) throw new Error('Missing company_id')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get Google Drive integration
    const { data: integration, error: intErr } = await supabase
      .from('integrations')
      .select('composio_connection_id')
      .eq('company_id', company_id)
      .eq('toolkit', 'google_drive')
      .eq('status', 'connected')
      .single()

    if (intErr || !integration) throw new Error('Google Drive not connected')

    // Get OAuth token from Composio
    const accessToken = await getComposioToken(integration.composio_connection_id)

    // Search for existing folder first
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `name='${folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    )}&fields=files(id,name)&pageSize=1`

    const searchRes = await fetch(searchUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })

    if (searchRes.ok) {
      const searchData = await searchRes.json()
      if (searchData.files && searchData.files.length > 0) {
        const existing = searchData.files[0]
        // Save to DB
        await supabase.from('companies').update({
          google_drive_folder_id: existing.id,
          google_drive_folder_name: existing.name,
        }).eq('id', company_id)

        return new Response(JSON.stringify({
          folder_id: existing.id,
          folder_name: existing.name,
          existed: true,
        }), { headers: corsHeaders })
      }
    }

    // Create new folder via Google Drive API
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folder_name,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    })

    if (!createRes.ok) {
      const errText = await createRes.text()
      console.error('Google Drive API error:', errText)
      throw new Error(`Failed to create folder: ${createRes.status}`)
    }

    const newFolder = await createRes.json()
    if (!newFolder?.id) throw new Error('Folder created but no ID returned')

    // Save folder ID to companies table
    await supabase.from('companies').update({
      google_drive_folder_id: newFolder.id,
      google_drive_folder_name: folder_name,
    }).eq('id', company_id)

    return new Response(JSON.stringify({
      folder_id: newFolder.id,
      folder_name: folder_name,
      existed: false,
    }), { headers: corsHeaders })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating folder:', msg)
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: corsHeaders }
    )
  }
})
