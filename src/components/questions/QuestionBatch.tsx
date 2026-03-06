import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import QuestionItem from './QuestionItem'

interface QuestionBatchProps {
  companyId: string
}

interface QuestionRow {
  id: string
  question: string
  domain: string
  why_asking: string | null
  priority: number
  status: string
  answer_text: string | null
  answer_mode: string | null
}

export default function QuestionBatch({ companyId }: QuestionBatchProps) {
  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [preferredMode, setPreferredMode] = useState<string | undefined>()

  async function loadQuestions() {
    const { data } = await supabase
      .from('onboarding_questions')
      .select('id, question, domain, why_asking, priority, status, answer_text, answer_mode')
      .eq('company_id', companyId)
      .order('priority', { ascending: true })
      .order('generated_at', { ascending: false })
      .limit(30)

    setQuestions(data || [])
    setLoading(false)
  }

  async function loadPreference() {
    const { data } = await supabase
      .from('companies')
      .select('preferred_answer_mode')
      .eq('id', companyId)
      .single()
    if (data?.preferred_answer_mode) setPreferredMode(data.preferred_answer_mode)
  }

  useEffect(() => {
    loadQuestions()
    loadPreference()
  }, [companyId])

  async function handleGenerate() {
    setGenerating(true)
    try {
      await supabase.functions.invoke('generate-onboarding-questions', {
        body: { company_id: companyId },
      })
      await loadQuestions()
    } catch (err) {
      console.error('Generate questions failed:', err)
    } finally {
      setGenerating(false)
    }
  }

  function handleAnswered() {
    loadQuestions()
  }

  if (loading) return <div className="question-batch-loading">Loading questions...</div>

  const pending = questions.filter(q => q.status === 'pending' || q.status === 'emailed')
  const answered = questions.filter(q => q.status === 'answered').slice(0, 10)

  return (
    <div className="question-batch">
      <div className="question-batch-header">
        <div>
          <h3>Smart Questions</h3>
          {pending.length > 0 && <span className="question-count">{pending.length} remaining</span>}
        </div>
        <button className="generate-btn" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating...' : 'Generate Questions'}
        </button>
      </div>

      {pending.length === 0 && answered.length === 0 && (
        <div className="question-batch-empty">
          No questions yet. Click "Generate Questions" to create AI-targeted questions based on your knowledge gaps.
        </div>
      )}

      {pending.length > 0 && (
        <>
          <div className="question-section-label">To Answer</div>
          {pending.map(q => (
            <QuestionItem
              key={q.id}
              question={{ ...q, why_asking: q.why_asking || undefined, answer_text: q.answer_text || undefined }}
              companyId={companyId}
              preferredMode={preferredMode}
              onAnswered={handleAnswered}
            />
          ))}
        </>
      )}

      {answered.length > 0 && (
        <>
          <div className="question-section-label">Completed</div>
          {answered.map(q => (
            <QuestionItem
              key={q.id}
              question={{ ...q, why_asking: q.why_asking || undefined, answer_text: q.answer_text || undefined }}
              companyId={companyId}
              preferredMode={preferredMode}
              onAnswered={handleAnswered}
            />
          ))}
        </>
      )}
    </div>
  )
}
