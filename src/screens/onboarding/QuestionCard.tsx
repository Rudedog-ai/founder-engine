import { useState } from 'react'

interface Props {
  question: string
  domain: string
  whyAsking?: string
  onAnswer: (text: string) => Promise<void>
  answered: boolean
}

export default function QuestionCard({ question, domain, whyAsking, onAnswer, answered }: Props) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!text.trim() || saving) return
    setSaving(true)
    await onAnswer(text.trim())
    setSaving(false)
  }

  if (answered) {
    return (
      <div className="question-card answered">
        <div className="question-card-domain">{domain}</div>
        <p className="question-card-text">{question}</p>
        <div className="question-card-done">Answered</div>
      </div>
    )
  }

  return (
    <div className="question-card">
      <div className="question-card-domain">{domain}</div>
      <p className="question-card-text">{question}</p>
      {whyAsking && <p className="question-card-why">{whyAsking}</p>}
      <textarea
        className="question-card-input"
        placeholder="Type your answer..."
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
      />
      <button
        className="btn btn-primary btn-small"
        onClick={handleSubmit}
        disabled={!text.trim() || saving}
        style={{ alignSelf: 'flex-end', marginTop: '8px' }}
      >
        {saving ? <><span className="spinner" /> Saving...</> : 'Submit'}
      </button>
    </div>
  )
}
