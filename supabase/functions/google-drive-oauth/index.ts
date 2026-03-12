// google-drive-oauth v7 — Full native Google OAuth (Composio removed)
// POST: returns Google consent URL for company
// GET: OAuth callback — exchanges code for tokens, stores in companies table
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
const APP_URL = 'https://founder-engine-seven.vercel.app'

// Redirect URI = this function's GET endpoint
const REDIRECT_URI = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-drive-oauth`

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
].join(' ')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // --- POST: Generate consent URL ---
  if (req.method === 'POST') {
    try {
      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return jsonResponse({ error: 'Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Supabase secrets.' }, 500)
      }

      const { company_id } = await req.json()
      if (!company_id) return jsonResponse({ error: 'Missing company_id' }, 400)

      // State param carries company_id through OAuth round-trip
      const state = company_id

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: SCOPES,
        access_type: 'offline',    // Gets refresh_token
        prompt: 'consent',         // Forces consent to always get refresh_token
        state,
      })

      const consentUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

      return jsonResponse({ redirect_url: consentUrl })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      return jsonResponse({ error: msg }, 500)
    }
  }

  // --- GET: OAuth callback ---
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // company_id
    const error = url.searchParams.get('error')

    if (error) {
      console.error('OAuth error from Google:', error)
      return Response.redirect(`${APP_URL}/dashboard?google_error=${error}`)
    }

    if (!code || !state) {
      return Response.redirect(`${APP_URL}/dashboard?google_error=missing_params`)
    }

    try {
      // Exchange authorization code for tokens
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      })

      if (!tokenRes.ok) {
        const errText = await tokenRes.text()
        console.error('Token exchange failed:', tokenRes.status, errText)
        return Response.redirect(`${APP_URL}/dashboard?google_error=token_exchange_failed`)
      }

      const tokens = await tokenRes.json()
      console.log('Tokens received. Has refresh_token:', !!tokens.refresh_token)

      // Store tokens in companies table
      const updateData: Record<string, unknown> = {
        google_access_token: tokens.access_token,
        google_connected_at: new Date().toISOString(),
      }

      // refresh_token is only sent on first auth or when prompt=consent
      if (tokens.refresh_token) {
        updateData.google_refresh_token = tokens.refresh_token
      }

      const { error: updateErr } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', state)

      if (updateErr) {
        console.error('Failed to store tokens:', updateErr)
        return Response.redirect(`${APP_URL}/dashboard?google_error=db_update_failed`)
      }

      // Also update integrations table so the UI shows "Connected"
      await supabase
        .from('integrations')
        .upsert({
          company_id: state,
          toolkit: 'google_drive',
          status: 'connected',
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'company_id,toolkit' })

      console.log('Google Drive connected natively for company:', state)

      // Redirect to dashboard with success flag
      return Response.redirect(`${APP_URL}/dashboard?integration_connected=true`)

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('OAuth callback error:', msg)
      return Response.redirect(`${APP_URL}/dashboard?google_error=callback_failed`)
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405)
})
