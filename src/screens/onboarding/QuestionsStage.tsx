import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabase'
import ProgressIndicator from './ProgressIndicator'
import QuestionCard from './QuestionCard'

import { DEFAULT_QUESTIONS, type Question } from './defaultQuestions'

export default function QuestionsStage({ onAdvance }: { onAdvance: () => Promise<void> }) {
  const { companyId } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)

  useEffect(() => {
    if (!companyId) return
    loadQuestions()
  }, [companyId])

  async function loadQuestions() {
    const { data } = await supabase
      .from('onboarding_questions')
      .select('id, question, domain, why_asking, status')
      .eq('company_id', companyId!)
      .order('priority', { ascending: true })
      .limit(10)

    if (data && data.length > 0) {
      setQuestions(data)
    } else {
      // Seed default questions
      const rows = DEFAULT_QUESTIONS.map((q, i) => ({
        company_id: companyId!,
        question: q.question,
        domain: q.domain,
        why_asking: q.why_asking,
        priority: i + 1,
        status: 'pending',
      }))
      const { data: inserted } = await supabase
        .from('onboarding_questions')
        .insert(rows)
        .select('id, question, domain, why_asking, status')
      setQuestions(inserted || [])
    }
    setLoading(false)
  }

  async function handleAnswer(questionId: string, answerText: string) {
    await supabase
      .from('onboarding_questions')
      .update({ answer_text: answerText, status: 'answered', answered_at: new Date().toISOString() })
      .eq('id', questionId)
    setQuestions(qs => qs.map(q => q.id === questionId ? { ...q, status: 'answered' } : q))
  }

  const answeredCount = questions.filter(q => q.status === 'answered').length

  async function handleContinue() {
    if (advancing) return
    setAdvancing(true)
    await onAdvance()
  }

  return (
    <div className="onboarding-stage">
      <ProgressIndicator currentStage={3} />
      <div className="ocean-form-card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <h3 style={{ marginBottom: '0.5rem', color: 'var(--text)' }}>Smart Questions</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Answer what you can — each answer sharpens Angus's analysis.
          {questions.length > 0 && <span style={{ marginLeft: '6px', color: 'var(--accent)' }}>({answeredCount}/{questions.length})</span>}
        </p>

        {loading ? (
          <div className="loading" style={{ padding: '2rem' }}><div className="spinner" /><span>Loading questions...</span></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
            {questions.map(q => (
              <QuestionCard
                key={q.id}
                question={q.question}
                domain={q.domain}
                whyAsking={q.why_asking}
                answered={q.status === 'answered'}
                onAnswer={text => handleAnswer(q.id, text)}
              />
            ))}
          </div>
        )}

        <button
          className="btn btn-primary btn-block"
          onClick={handleContinue}
          disabled={advancing}
        >
          {advancing ? <><span className="spinner" /> Finishing...</> : 'Complete Setup →'}
        </button>
        {answeredCount === 0 && (
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
            You can skip and answer these later from the dashboard.
          </p>
        )}
      </div>
    </div>
  )
}
