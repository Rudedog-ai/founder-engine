// create-google-drive-folder v5
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
    const { company_id, folder_name = 'Founder Engine Data' } = await req.json()
    if (!company_id) throw new Error('Missing company_id')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get valid Google token (auto-refreshes if needed)
    const accessToken = await getGoogleToken(supabase, company_id)

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
        await supabase.from('companies').update({
          google_drive_folder_id: existing.id,
          google_drive_folder_name: existing.name,
        }).eq('id', company_id)

        return jsonResponse({
          folder_id: existing.id,
          folder_name: existing.name,
          existed: true,
        })
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

    return jsonResponse({
      folder_id: newFolder.id,
      folder_name: folder_name,
      existed: false,
    })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating folder:', msg)
    return jsonResponse({ error: msg }, 500)
  }
})
