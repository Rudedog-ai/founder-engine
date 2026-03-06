import { useEffect, useState } from 'react'

interface Props {
  domain: string
  label: string
  score: number
}

export default function IntelligenceSlider({ domain, label, score }: Props) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = requestAnimationFrame(() => setWidth(score))
    return () => cancelAnimationFrame(t)
  }, [score])

  return (
    <div>
      <div className="intel-slider" data-domain={domain}>
        <span className="intel-slider-label">{label}</span>
        <div className="intel-slider-bar">
          <div className="intel-slider-fill" style={{ width: `${width}%` }} />
        </div>
        <span className="intel-slider-score">{score}%</span>
      </div>
    </div>
  )
}
