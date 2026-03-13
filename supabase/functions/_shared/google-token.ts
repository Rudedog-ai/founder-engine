// Shared Google OAuth token helper
// Reads native tokens from companies table, auto-refreshes when expired
import { createClient } from "jsr:@supabase/supabase-js@2"

export async function getGoogleToken(
  supabase: ReturnType<typeof createClient>,
  companyId: string
): Promise<string> {
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
