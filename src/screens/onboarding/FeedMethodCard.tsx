interface Props {
  title: string
  description: string
  icon: React.ReactNode
  actionLabel: string
  onClick: () => void
  badge?: string
}

export default function FeedMethodCard({ title, description, icon, actionLabel, onClick, badge }: Props) {
  return (
    <div className="connect-card" style={{ cursor: 'pointer' }} onClick={onClick}>
      <div className="connect-card-icon">{icon}</div>
      <div className="connect-card-body">
        <h4>
          {title}
          {badge && <span className="feed-badge">{badge}</span>}
        </h4>
        <p>{description}</p>
      </div>
      <button className="btn btn-primary btn-small" onClick={(e) => { e.stopPropagation(); onClick() }}>
        {actionLabel}
      </button>
    </div>
  )
}
