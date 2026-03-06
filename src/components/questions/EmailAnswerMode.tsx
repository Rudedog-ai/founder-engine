import { useState } from 'react'
import { supabase } from '../../supabase'

interface EmailAnswerModeProps {
  questionId: string
  companyId: string
  question: string
  onAnswered: () => void
}

export default function EmailAnswerMode({ questionId, companyId }: EmailAnswerModeProps) {
  const [copied, setCopied] = useState(false)
  const [sent, setSent] = useState(false)

  const shortId = companyId.slice(0, 8)
  const emailAddress = `answers+${shortId}@founderengine.ai`

  async function handleCopy() {
    await navigator.clipboard.writeText(emailAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleMarkEmailed() {
    await supabase
      .from('onboarding_questions')
      .update({ status: 'emailed', answer_mode: 'email' })
      .eq('id', questionId)
    setSent(true)
  }

  if (sent) return <div className="success-msg">We'll process your reply when it arrives.</div>

  return (
    <div className="email-answer">
      <p>We'll email you this question. Reply when you're ready — we'll extract the data automatically.</p>
      <div className="email-address-box">
        <code>{emailAddress}</code>
        <button className="copy-btn" onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</button>
      </div>
      <p style={{ fontSize: '0.75rem' }}>Email pipeline coming soon. For now, use Write or Dictate mode.</p>
      <button className="submit-answer-btn" onClick={handleMarkEmailed} style={{ marginTop: 8 }}>
        Mark as Emailed
      </button>
    </div>
  )
}
