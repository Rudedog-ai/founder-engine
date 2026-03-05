export interface Company {
  id: string
  name: string
  founder_name: string
  founder_email: string
  industry?: string
  website?: string
  email_inbox_address?: string
  onboarding_link?: string
  intelligence_score: number
  intelligence_tier: string
  onboarding_status: string
  user_id?: string
  created_at: string
}

export interface KnowledgeEntry {
  id: string
  company_id: string
  topic: string
  key: string
  value: string
  confidence: string
  source_session_id?: string
}

export interface Session {
  id: string
  company_id: string
  session_number: number
  session_type: string
  participant_name: string
  participant_role: string
  raw_transcript?: string
  summary?: string
  extracted_data?: Record<string, unknown>
  duration_seconds?: number
  data_points_captured: number
  topics_covered: string[]
  created_at: string
}

export interface GapAnalysis {
  id: string
  company_id: string
  topic: string
  completeness_score: number
  total_data_points: number
  captured_data_points: number
  missing_items: string[]
  suggested_assignee_name?: string
}

export interface TeamMember {
  id: string
  company_id: string
  name: string
  email?: string
  role: string
  session_completed: boolean
  invite_status: string
}

export interface Recommendation {
  id: string
  company_id: string
  constraint_type: string
  priority: number
  title: string
  description: string
  reasoning?: string
  status: string
}

export interface CompanyProfile {
  company: Company
  knowledge: Record<string, KnowledgeEntry[]>
  knowledge_raw: KnowledgeEntry[]
  gaps: GapAnalysis[]
  sessions: Session[]
  team: TeamMember[]
  recommendations: Recommendation[]
  documents: unknown[]
  recent_activity: Array<{
    action: string
    created_at: string
  }>
}
