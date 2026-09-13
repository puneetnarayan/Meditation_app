import { Link } from 'react-router-dom'
import { LibraryBrowser } from '../components/library/LibraryBrowser'
import { PageContainer } from '../components/common/PageContainer'
import styles from './LibraryPage.module.css'

export function LibraryPage() {
  return (
    <PageContainer>
      <h1>Library</h1>
      <Link to="/sounds" className={styles.soundsLink}>
        Looking for ambient sounds instead? →
      </Link>
      <LibraryBrowser />
    </PageContainer>
  )
}

export default LibraryPage
