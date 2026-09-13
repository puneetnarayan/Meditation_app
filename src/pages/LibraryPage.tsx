import { LibraryBrowser } from '../components/library/LibraryBrowser'
import { PageContainer } from '../components/common/PageContainer'

export function LibraryPage() {
  return (
    <PageContainer>
      <h1>Library</h1>
      <LibraryBrowser />
    </PageContainer>
  )
}

export default LibraryPage
