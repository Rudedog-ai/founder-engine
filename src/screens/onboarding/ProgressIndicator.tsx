// ProgressIndicator v3
const STAGE_LABELS = ['Welcome', 'Setup']

interface Props {
  currentStage: number
}

export default function ProgressIndicator({ currentStage }: Props) {
  return (
    <div className="onboarding-progress">
      <p className="onboarding-progress-label">
        Step {currentStage} of {STAGE_LABELS.length}: <strong>{STAGE_LABELS[currentStage - 1]}</strong>
      </p>
      <div className="onboarding-progress-bar">
        {STAGE_LABELS.map((_, i) => (
          <div
            key={i}
            className={`onboarding-progress-step ${i + 1 <= currentStage ? 'active' : ''} ${i + 1 < currentStage ? 'complete' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
