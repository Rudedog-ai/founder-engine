// list-google-drive-folders v3
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
    const { company_id } = await req.json()
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

    // List folders via Google Drive API
    const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      "mimeType='application/vnd.google-apps.folder' and trashed=false"
    )}&fields=files(id,name,createdTime,modifiedTime)&pageSize=100&orderBy=modifiedTime desc`

    const listRes = await fetch(listUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })

    if (!listRes.ok) {
      const errText = await listRes.text()
      console.error('Google Drive API error:', errText)
      throw new Error(`Failed to list folders: ${listRes.status}`)
    }

    const listData = await listRes.json()
    const folders = listData.files || []

    // Find target folder
    const targetFolder = folders.find((f: { name: string }) =>
      f.name.toLowerCase().includes('founder engine')
      || f.name.toLowerCase().includes('founderengine')
    )

    return new Response(JSON.stringify({
      folders,
      targetFolder: targetFolder || null,
      count: folders.length,
    }), { headers: corsHeaders })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error listing folders:', msg)
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: corsHeaders }
    )
  }
})
