import { Outlet } from 'react-router-dom'
import { Header } from '../components/navigation/Header'
import { SideNav } from '../components/navigation/SideNav'
import { BottomNav } from '../components/navigation/BottomNav'
import { useReminderScheduler } from '../hooks/useReminderScheduler'
import styles from './AppLayout.module.css'

export function AppLayout() {
  useReminderScheduler()

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>
      <Header />
      <div className={styles.body}>
        <SideNav />
        <main id="main-content" className={styles.main} tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
