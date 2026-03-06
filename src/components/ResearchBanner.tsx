import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

interface Props {
  companyId: string
  onComplete?: () => void
}

const STEPS = [
  'Searching public records and registries...',
  'Scanning news articles and press coverage...',
  'Analysing social media and reviews...',
  'Reviewing financial filings...',
  'Building your intelligence profile...',
]

export default function ResearchBanner({ companyId, onComplete }: Props) {
  const [status, setStatus] = useState<string | null>(null)
  const [dataPoints, setDataPoints] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const wasResearching = useRef(false)

  useEffect(() => {
    async function poll() {
      const { data: co } = await supabase
        .from('companies')
        .select('scrape_status')
        .eq('id', companyId)
        .single()
      const s = co?.scrape_status ?? null
      setStatus(s)

      if (s === 'researching') {
        wasResearching.current = true
        const { count } = await supabase
          .from('knowledge_base')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
        setDataPoints(count ?? 0)
      }

      if (wasResearching.current && (s === 'complete' || s === 'error')) {
        wasResearching.current = false
        onComplete?.()
      }
    }

    poll()
    const interval = setInterval(poll, 4000)
    return () => clearInterval(interval)
  }, [companyId, onComplete])

  useEffect(() => {
    if (status !== 'researching') return
    const timer = setInterval(() => setStepIndex(i => (i + 1) % STEPS.length), 3000)
    return () => clearInterval(timer)
  }, [status])

  if (dismissed || !status || status === 'complete' || status === 'error') return null

  return (
    <div className="research-banner">
      <div className="research-banner-content">
        <div className="research-banner-header">
          <div className="research-spinner" />
          <strong>Researching your business</strong>
          {dataPoints > 0 && (
            <span className="research-badge">{dataPoints} data points found</span>
          )}
        </div>
        <p className="research-step fade-in" key={stepIndex}>{STEPS[stepIndex]}</p>
        <div className="research-bar">
          <div className="research-bar-fill" />
        </div>
      </div>
      <button className="research-dismiss" onClick={() => setDismissed(true)}>Dismiss</button>
    </div>
  )
}
