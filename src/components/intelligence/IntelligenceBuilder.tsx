import type { DomainScores } from '../../types'
import IntelligenceSlider from './IntelligenceSlider'

const DOMAIN_LABELS: Record<string, string> = {
  financials: 'Revenue & Financials',
  sales: 'Sales & Pipeline',
  marketing: 'Marketing & Growth',
  operations: 'Operations & Processes',
  team: 'Team & People',
  strategy: 'Strategy & Vision',
}

const DOMAIN_ORDER = ['financials', 'sales', 'marketing', 'operations', 'team', 'strategy'] as const

interface Props {
  companyId: string
  domainScores: DomainScores
}

export default function IntelligenceBuilder({ domainScores }: Props) {
  return (
    <div className="intelligence-section">
      <div className="intelligence-section-title">Intelligence Builder</div>
      {DOMAIN_ORDER.map(domain => (
        <IntelligenceSlider
          key={domain}
          domain={domain}
          label={DOMAIN_LABELS[domain]}
          score={domainScores?.[domain] ?? 0}
        />
      ))}
    </div>
  )
}
