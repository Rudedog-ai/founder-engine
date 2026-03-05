import { supabase } from './supabase'
import type { CompanyProfile } from './types'

async function callEdgeFunction<T = unknown>(
  functionName: string,
  body: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
  })

  if (error) {
    throw new Error(error.message || `${functionName} failed`)
  }

  return data as T
}

export async function onboardCompany(
  name: string,
  founder_name: string,
  founder_email: string,
  website?: string,
  industry?: string
) {
  return callEdgeFunction<{ company: { id: string }; company_id: string }>(
    'onboard-company',
    { name, founder_name, founder_email, website, industry }
  )
}

export async function getCompanyProfile(
  company_id: string
): Promise<CompanyProfile> {
  return callEdgeFunction<CompanyProfile>('get-company-profile', { company_id })
}

export async function getCompanyByEmail(
  founder_email: string
): Promise<CompanyProfile> {
  return callEdgeFunction<CompanyProfile>('get-company-profile', {
    founder_email,
  })
}

export async function scrapeBusiness(
  company_id: string,
  website_url: string,
  company_name: string,
  founder_name: string
) {
  return callEdgeFunction('scrape-business', {
    company_id,
    website_url,
    company_name,
    founder_name,
  })
}

export async function processTranscript(
  company_id: string,
  transcript: string,
  session_type?: string
) {
  return callEdgeFunction('process-transcript', {
    company_id,
    transcript,
    session_type,
    speaker_role: 'founder',
  })
}

export async function uploadDocument(company_id: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('company_id', company_id)
  formData.append('uploaded_by', 'founder')

  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-document`,
    {
      method: 'POST',
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error('Failed to upload document')
  }

  return response.json()
}

export async function inviteTeamMember(
  company_id: string,
  name: string,
  role: string,
  email?: string
) {
  return callEdgeFunction('invite-team-member', {
    company_id,
    name,
    role,
    email,
  })
}

export async function generateRecommendations(company_id: string) {
  return callEdgeFunction('generate-recommendations', { company_id })
}

export async function updateRecommendationStatus(
  company_id: string,
  id: string,
  status: string
) {
  return callEdgeFunction('generate-recommendations', {
    company_id,
    update_status: { id, status },
  })
}
