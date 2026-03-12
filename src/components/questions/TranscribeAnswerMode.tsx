import { useState, useRef } from 'react'
import { supabase } from '../../supabase'

interface TranscribeAnswerModeProps {
  questionId: string
  companyId: string
  question: string
  onAnswered: () => void
}

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

export default function TranscribeAnswerMode({ questionId, companyId, onAnswered }: TranscribeAnswerModeProps) {
  const [transcript, setTranscript] = useState('')
  const [recording, setRecording] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const recognitionRef = useRef<any>(null)

  function startRecording() {
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-GB'
    let finalText = transcript

    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript + ' '
        } else {
          interim += event.results[i][0].transcript
        }
      }
      setTranscript(finalText + interim)
    }

    recognition.onerror = () => setRecording(false)
    recognition.onend = () => setRecording(false)

    recognition.start()
    recognitionRef.current = recognition
    setRecording(true)
  }

  function stopRecording() {
    recognitionRef.current?.stop()
    setRecording(false)
  }

  async function handleSubmit() {
    if (!transcript.trim() || submitting) return
    setSubmitting(true)
    try {
      const { data, error } = await supabase.functions.invoke('process-question-answer', {
        body: { company_id: companyId, question_id: questionId, answer_text: transcript.trim(), answer_mode: 'transcribe' },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      const pts = data?.data_points_extracted || 0
      setSuccess(`${pts} data point${pts !== 1 ? 's' : ''} extracted`)
      setTimeout(onAnswered, 1500)
    } catch (err) {
      console.error('Submit transcription failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) return <div className="success-msg">{success}</div>

  if (!SpeechRecognition) {
    return (
      <div className="transcribe-answer">
        <p className="transcribe-fallback">Speech recognition not available in this browser. Use the Write mode instead.</p>
      </div>
    )
  }

  return (
    <div className="transcribe-answer">
      <div className="transcribe-controls">
        <button className={`mic-btn${recording ? ' recording' : ''}`} onClick={recording ? stopRecording : startRecording}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2" />
          </svg>
        </button>
        <span className={`transcribe-status${recording ? ' recording' : ''}`}>
          {recording ? 'Listening...' : transcript ? 'Tap to continue' : 'Tap to start speaking'}
        </span>
      </div>
      {transcript && (
        <>
          <div className="transcribe-output">{transcript}</div>
          <div className="written-footer">
            <span className={`char-count${transcript.length >= 50 ? ' good' : ''}`}>{transcript.length} chars</span>
            <button className="submit-answer-btn" onClick={handleSubmit} disabled={submitting || recording}>
              {submitting ? 'Processing...' : 'Submit Transcription'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
