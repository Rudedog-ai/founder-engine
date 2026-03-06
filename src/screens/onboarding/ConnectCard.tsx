interface Props {
  title: string
  description: string
  icon: React.ReactNode
  connected: boolean
  onConnect: () => void
  disabled?: boolean
}

export default function ConnectCard({ title, description, icon, connected, onConnect, disabled }: Props) {
  return (
    <div className={`connect-card ${connected ? 'connected' : ''}`}>
      <div className="connect-card-icon">{icon}</div>
      <div className="connect-card-body">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      <button
        className={`btn ${connected ? 'btn-secondary' : 'btn-primary'} btn-small`}
        onClick={onConnect}
        disabled={disabled || connected}
      >
        {connected ? 'Connected' : disabled ? 'Coming Soon' : 'Connect'}
      </button>
    </div>
  )
}
