export interface Question {
  id: string
  question: string
  domain: string
  why_asking?: string
  status: string
}

export const DEFAULT_QUESTIONS: Omit<Question, 'id'>[] = [
  { question: 'What is your current monthly revenue?', domain: 'financials', why_asking: 'Key metric for benchmarking and growth tracking', status: 'pending' },
  { question: 'Who is your ideal customer and how do you reach them?', domain: 'sales', why_asking: 'Understanding your go-to-market helps identify bottlenecks', status: 'pending' },
  { question: 'What is your biggest operational challenge right now?', domain: 'operations', why_asking: 'Prioritising constraints drives the most impactful recommendations', status: 'pending' },
  { question: 'How many people are on your team and what are their roles?', domain: 'team', why_asking: 'Team structure reveals capacity gaps and hiring priorities', status: 'pending' },
  { question: 'What does success look like for you in the next 12 months?', domain: 'strategy', why_asking: 'Aligning analysis to your goals makes recommendations actionable', status: 'pending' },
]
