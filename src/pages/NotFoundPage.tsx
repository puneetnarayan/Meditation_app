import { Link } from 'react-router-dom'
import { PageContainer } from '../components/common/PageContainer'

export function NotFoundPage() {
  return (
    <PageContainer>
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/">Return home</Link>
    </PageContainer>
  )
}

export default NotFoundPage
