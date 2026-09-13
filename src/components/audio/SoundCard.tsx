import type { Sound } from '../../types'
import { Card } from '../common/Card'
import { IconButton } from '../common/IconButton'
import styles from './SoundCard.module.css'

export interface SoundCardProps {
  sound: Sound
  isPlaying: boolean
  onToggle: () => void
}

export function SoundCard({ sound, isPlaying, onToggle }: SoundCardProps) {
  return (
    <Card interactive={isPlaying} className={styles.card}>
      <div className={styles.text}>
        <h3 className={styles.title}>{sound.name}</h3>
        <p className={styles.description}>{sound.description}</p>
      </div>
      <IconButton
        icon={isPlaying ? '⏸' : '▶'}
        label={isPlaying ? `Pause ${sound.name}` : `Play ${sound.name}`}
        aria-pressed={isPlaying}
        variant={isPlaying ? 'primary' : 'default'}
        onClick={onToggle}
      />
    </Card>
  )
}
