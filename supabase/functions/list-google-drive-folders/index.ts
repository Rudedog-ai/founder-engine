// list-google-drive-folders v4
// v4.0 | 12 March 2026
// Uses native Google tokens from companies table (Composio removed)
// Auto-refreshes expired access tokens using refresh_token
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

// Get a valid Google access token — refresh if needed
async function getGoogleToken(supabase: ReturnType<typeof createClient>, companyId: string): Promise<string> {
  const { data: company, error } = await supabase
    .from('companies')
    .select('google_access_token, google_refresh_token')
    .eq('id', companyId)
    .single()

  if (error || !company) throw new Error('Company not found')

  if (!company.google_refresh_token) {
    throw new Error('Google Drive not connected. Please connect Google Drive from the dashboard.')
  }

  // Try existing access token first
  if (company.google_access_token) {
    const testRes = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
      headers: { 'Authorization': `Bearer ${company.google_access_token}` }
    })
    if (testRes.ok) return company.google_access_token
    console.log('Access token expired, refreshing...')
  }

  // Refresh the token
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not configured')
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: company.google_refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!tokenRes.ok) {
    const errText = await tokenRes.text()
    console.error('Token refresh failed:', tokenRes.status, errText)
    await supabase.from('companies').update({
      google_access_token: null,
      google_refresh_token: null,
      google_connected_at: null,
    }).eq('id', companyId)
    throw new Error('Google token expired. Please reconnect Google Drive from the dashboard.')
  }

  const tokens = await tokenRes.json()
  await supabase.from('companies').update({
    google_access_token: tokens.access_token,
  }).eq('id', companyId)

  return tokens.access_token
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

    // Get valid Google token (auto-refreshes if needed)
    const accessToken = await getGoogleToken(supabase, company_id)

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

    const targetFolder = folders.find((f: { name: string }) =>
      f.name.toLowerCase().includes('founder engine')
      || f.name.toLowerCase().includes('founderengine')
    )

    return jsonResponse({
      folders,
      targetFolder: targetFolder || null,
      count: folders.length,
    })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error listing folders:', msg)
    return jsonResponse({ error: msg }, 500)
  }
})
