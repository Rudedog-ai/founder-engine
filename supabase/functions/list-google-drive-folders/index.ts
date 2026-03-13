// list-google-drive-folders v5
// v5.0 | 13 March 2026
// Uses shared native Google OAuth helper
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { getGoogleToken } from '../_shared/google-token.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
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
