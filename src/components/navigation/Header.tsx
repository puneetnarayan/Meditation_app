import styles from './Header.module.css'

export function Header() {
  return (
    <header className={styles.header}>
      <p className={styles.title}>Meditation App</p>
    </header>
  )
}
