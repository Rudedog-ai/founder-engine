import { useState } from 'react'
import { supabase } from '../../supabase'

interface WrittenAnswerModeProps {
  questionId: string
  companyId: string
  question: string
  onAnswered: () => void
}

export default function WrittenAnswerMode({ questionId, companyId, question, onAnswered }: WrittenAnswerModeProps) {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  async function handleSubmit() {
    if (!text.trim() || submitting) return
    setSubmitting(true)
    try {
      const { data, error } = await supabase.functions.invoke('process-question-answer', {
        body: { company_id: companyId, question_id: questionId, answer_text: text.trim(), answer_mode: 'written' },
      })
      if (error) throw error
      const pts = data?.data_points_extracted || 0
      setSuccess(`${pts} data point${pts !== 1 ? 's' : ''} extracted`)
      setTimeout(onAnswered, 1500)
    } catch (err) {
      console.error('Submit answer failed:', err)
      setSuccess('')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) return <div className="success-msg">{success}</div>

  return (
    <div className="written-answer">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={`Answer: ${question}`}
        rows={3}
        disabled={submitting}
      />
      <div className="written-footer">
        <span className={`char-count${text.length >= 50 ? ' good' : ''}`}>
          {text.length} chars{text.length < 50 ? ' (50+ recommended)' : ''}
        </span>
        <button className="submit-answer-btn" onClick={handleSubmit} disabled={!text.trim() || submitting}>
          {submitting ? 'Processing...' : 'Submit'}
        </button>
      </div>
    </div>
  )
}
