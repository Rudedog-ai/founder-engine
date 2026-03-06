interface ModeSelectorProps {
  selectedMode: 'written' | 'voice' | 'transcribe' | 'email'
  onSelectMode: (mode: 'written' | 'voice' | 'transcribe' | 'email') => void
  preferredMode?: string
}

const modes = [
  { key: 'written' as const, label: 'Write', icon: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z' },
  { key: 'voice' as const, label: 'Voice', icon: 'M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8' },
  { key: 'transcribe' as const, label: 'Dictate', icon: 'M2 12h2l3-9 4 18 3-9h2' },
  { key: 'email' as const, label: 'Email', icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6' },
]

export default function ModeSelector({ selectedMode, onSelectMode, preferredMode }: ModeSelectorProps) {
  return (
    <div className="mode-selector">
      {modes.map(m => (
        <button
          key={m.key}
          className={`mode-btn${selectedMode === m.key ? ' active' : ''}${preferredMode === m.key ? ' preferred' : ''}`}
          onClick={() => onSelectMode(m.key)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={m.icon} />
          </svg>
          {m.label}
        </button>
      ))}
    </div>
  )
}
