import { useState } from 'react'
import ModeSelector from './ModeSelector'
import WrittenAnswerMode from './WrittenAnswerMode'
import VoiceAnswerMode from './VoiceAnswerMode'
import TranscribeAnswerMode from './TranscribeAnswerMode'
import EmailAnswerMode from './EmailAnswerMode'

interface Question {
  id: string
  question: string
  domain: string
  why_asking?: string
  priority: number
  status: string
  answer_text?: string
}

interface QuestionItemProps {
  question: Question
  companyId: string
  preferredMode?: string
  onAnswered: () => void
}

export default function QuestionItem({ question, companyId, preferredMode, onAnswered }: QuestionItemProps) {
  const defaultMode = (preferredMode as any) || 'written'
  const [mode, setMode] = useState<'written' | 'voice' | 'transcribe' | 'email'>(defaultMode)

  const priorityClass = `priority-${question.priority}`
  const statusClass = question.status === 'answered' ? 'answered' : question.status === 'skipped' ? 'skipped' : ''

  return (
    <div className={`question-item ${priorityClass} ${statusClass}`}>
      <div className="question-header">
        <div className="question-text">{question.question}</div>
        <span className="domain-badge">{question.domain}</span>
      </div>

      {question.why_asking && (
        <div className="why-asking">{question.why_asking}</div>
      )}

      {question.status === 'answered' && (
        <div className="answered-preview">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span>{question.answer_text?.slice(0, 100) || 'Answered'}</span>
        </div>
      )}

      {question.status === 'skipped' && (
        <div className="skipped-label">Skipped</div>
      )}

      {(question.status === 'pending' || question.status === 'emailed') && (
        <>
          <ModeSelector selectedMode={mode} onSelectMode={setMode} preferredMode={preferredMode} />
          {mode === 'written' && (
            <WrittenAnswerMode questionId={question.id} companyId={companyId} question={question.question} onAnswered={onAnswered} />
          )}
          {mode === 'voice' && (
            <VoiceAnswerMode questionId={question.id} companyId={companyId} question={question.question} onAnswered={onAnswered} />
          )}
          {mode === 'transcribe' && (
            <TranscribeAnswerMode questionId={question.id} companyId={companyId} question={question.question} onAnswered={onAnswered} />
          )}
          {mode === 'email' && (
            <EmailAnswerMode questionId={question.id} companyId={companyId} question={question.question} onAnswered={onAnswered} />
          )}
        </>
      )}
    </div>
  )
}
