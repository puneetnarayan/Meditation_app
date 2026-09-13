import { Link } from 'react-router-dom'
import { LibraryBrowser } from '../components/library/LibraryBrowser'
import { PageContainer } from '../components/common/PageContainer'
import styles from './LibraryPage.module.css'

export function LibraryPage() {
  return (
    <PageContainer>
      <h1>Library</h1>
      <nav className={styles.exploreLinks} aria-label="Other ways to explore">
        <Link to="/sounds">Ambient sounds →</Link>
        <Link to="/programs">Multi-day programs →</Link>
      </nav>
      <LibraryBrowser />
    </PageContainer>
  )
}

export default LibraryPage
