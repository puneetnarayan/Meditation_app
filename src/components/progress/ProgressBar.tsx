import styles from './ProgressBar.module.css'

export interface ProgressBarProps {
  value: number
  max?: number
  label: string
}

/** Generic value/max progress indicator. Used for meditation and audio
 * playback progress — this component has no timing logic of its own. */
export function ProgressBar({ value, max = 100, label }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max)
  const percent = max === 0 ? 0 : (clamped / max) * 100

  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  )
}
