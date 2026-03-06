interface VoiceAnswerModeProps {
  questionId: string
  companyId: string
  question: string
  onAnswered: () => void
}

export default function VoiceAnswerMode({ question }: VoiceAnswerModeProps) {
  return (
    <div className="voice-answer">
      <p>Angus will ask you about this during your next voice session:</p>
      <p style={{ color: 'var(--text)', fontWeight: 500, fontSize: '0.88rem' }}>"{question}"</p>
      <button className="voice-link-btn" onClick={() => {
        const nav = document.querySelector('[data-tab="voice"]') as HTMLElement
        nav?.click()
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2" />
        </svg>
        Go to Voice Session
      </button>
    </div>
  )
}
