// AngusChat v2 — Floating chat widget with campaign approval cards
import { useState, useRef, useEffect } from 'react'
import { angusChat } from '../api'
import type { CampaignProposed } from '../api'
import CampaignApprovalCard from './CampaignApprovalCard'

interface Message {
  role: 'user' | 'angus'
  text: string
  campaign?: CampaignProposed
}

interface Props {
  companyId: string
}

export default function AngusChat({ companyId }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setLoading(true)
    try {
      const result = await angusChat(companyId, text)
      setMessages(prev => [...prev, {
        role: 'angus',
        text: result.reply || result.response || 'No response',
        campaign: result.campaign_proposed,
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'angus', text: 'Angus hit a problem — please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!open) {
    return (
      <button className="angus-fab" onClick={() => setOpen(true)} aria-label="Chat with Angus">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      </button>
    )
  }

  return (
    <div className="angus-chat-panel">
      <div className="angus-chat-header">
        <span style={{ fontWeight: 600 }}>Angus</span>
        <button className="angus-chat-close" onClick={() => setOpen(false)} aria-label="Close chat">&times;</button>
      </div>

      <div className="angus-chat-messages">
        {messages.length === 0 && (
          <div className="angus-chat-empty">
            Ask Angus anything about your business.
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i}>
            <div className={`angus-msg angus-msg-${msg.role}`}>
              {msg.text}
            </div>
            {msg.campaign && (
              <CampaignApprovalCard companyId={companyId} campaign={msg.campaign} />
            )}
          </div>
        ))}
        {loading && (
          <div className="angus-msg angus-msg-angus angus-thinking">
            <span className="dot" /><span className="dot" /><span className="dot" />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="angus-chat-input">
        <textarea
          rows={1}
          placeholder="Ask Angus..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button onClick={handleSend} disabled={!input.trim() || loading} aria-label="Send">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
