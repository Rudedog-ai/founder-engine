import { useState } from 'react'
import { useToast } from '../Toast'
import { updateFounderPhone } from '../../api'

interface Props {
  companyId: string
  initialPhone: string
  onSaved: () => void
}

export default function WhatsAppSection({ companyId, initialPhone, onSaved }: Props) {
  const { showToast } = useToast()
  const [phoneNumber, setPhoneNumber] = useState(initialPhone)
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const cleaned = phoneNumber.trim()
    if (!/^\+\d{7,15}$/.test(cleaned)) {
      showToast('Enter a valid phone number starting with + (e.g. +44771234567)', 'error')
      return
    }
    setSaving(true)
    try {
      await updateFounderPhone(companyId, cleaned)
      showToast('WhatsApp number saved!')
      onSaved()
    } catch {
      showToast('Failed to save phone number', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="section-title">WhatsApp Voice Calls</div>
      <div className="card" style={{ background: 'var(--surface)' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '12px' }}>
          Call Angus directly from WhatsApp. He'll come prepared with everything he knows about your business.
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Step 1: Save your WhatsApp number</label>
            <input type="tel" placeholder="+44 7712 345678" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} style={{ width: '100%' }} />
          </div>
          <button className="btn btn-primary btn-small" type="submit" disabled={saving} style={{ flexShrink: 0 }}>
            {saving ? 'Saving...' : initialPhone ? 'Update' : 'Save'}
          </button>
        </form>

        <div style={{ padding: '12px 14px', background: 'var(--abyss)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--sea)', marginBottom: '12px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Step 2: Join the Angus WhatsApp sandbox</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: '0 0 8px' }}>
            Send this exact message from your WhatsApp to <strong style={{ color: 'var(--glow)' }}>+1 415 523 8886</strong>:
          </p>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--sea)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontFamily: 'monospace', fontSize: '1rem', fontWeight: 600, color: 'var(--biolum)', letterSpacing: '0.5px', textAlign: 'center' }}>
            join organization-softly
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
            This connects your WhatsApp to Angus. You only need to do this once.
          </p>
        </div>

        <div style={{ padding: '12px 14px', background: 'var(--abyss)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--sea)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Step 3: Call Angus</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--biolum)" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--glow)', letterSpacing: '0.5px' }}>+1 415 523 8886</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Open the WhatsApp chat and tap the phone icon to call</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
