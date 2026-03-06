interface StaleDocAlertProps {
  ageMonths: number | null
  compact?: boolean
}

export default function StaleDocAlert({ ageMonths, compact }: StaleDocAlertProps) {
  if (!ageMonths || ageMonths < 3) return null

  if (ageMonths > 24) {
    return compact
      ? <span className="stale-alert critical compact" title="Over 2 years old" />
      : <span className="stale-alert critical">Over 2 years old — verify before using</span>
  }

  if (ageMonths > 12) {
    return compact
      ? <span className="stale-alert red compact" title="Over 1 year old" />
      : <span className="stale-alert red">Over 1 year old — verify before using</span>
  }

  return compact
    ? <span className="stale-alert amber compact" title={`${ageMonths} months old`} />
    : <span className="stale-alert amber">Data from {ageMonths} months ago</span>
}
