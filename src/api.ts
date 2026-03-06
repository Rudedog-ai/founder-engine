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

export async function uploadDocument(
  company_id: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; document: import('./types').Document }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('company_id', company_id)
  formData.append('uploaded_by', 'founder')

  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-document`)
    xhr.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_ANON_KEY)
    xhr.setRequestHeader('Authorization', `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch {
          reject(new Error('Invalid response from server'))
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText)
          reject(new Error(err.error || `Upload failed (${xhr.status})`))
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`))
        }
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(formData)
  })
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
