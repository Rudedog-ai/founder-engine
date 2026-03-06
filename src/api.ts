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

export async function calculateDomainScores(company_id: string) {
  return callEdgeFunction('calculate-domain-scores', { company_id })
}

export async function generateSourceOfTruth(company_id: string) {
  return callEdgeFunction('generate-source-of-truth', { company_id })
}

export async function applyCorrection(
  company_id: string,
  element_key: string,
  element_label: string,
  domain: string,
  original_value: string,
  corrected_value: string,
  correction_context?: string
) {
  return callEdgeFunction('apply-correction', {
    company_id, element_key, element_label, domain,
    original_value, corrected_value, correction_context,
    source: 'dashboard_edit',
  })
}

export async function generateQuestions(company_id: string) {
  return callEdgeFunction('generate-onboarding-questions', { company_id })
}

export async function processQuestionAnswer(
  company_id: string,
  question_id: string,
  answer_text: string,
  answer_mode: string
) {
  return callEdgeFunction('process-question-answer', {
    company_id, question_id, answer_text, answer_mode,
  })
}

export async function resetCompany(companyId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-company`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ company_id: companyId }),
    }
  )
  if (!res.ok) throw new Error('Reset failed')
}

export async function exportCompany(companyId: string, companyName: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-company`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ company_id: companyId }),
    }
  )
  if (!res.ok) throw new Error('Export failed')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `founder-engine-${companyName.replace(/\s+/g, '-').toLowerCase()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function updateFounderPhone(
  company_id: string,
  founder_phone: string
) {
  const { error } = await supabase
    .from('companies')
    .update({ founder_phone })
    .eq('id', company_id)

  if (error) {
    throw new Error(error.message || 'Failed to update phone number')
  }
}
