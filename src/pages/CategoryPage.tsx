import { useParams } from 'react-router-dom'
import { LibraryBrowser } from '../components/library/LibraryBrowser'
import { EmptyState } from '../components/common/EmptyState'
import { PageContainer } from '../components/common/PageContainer'
import { categories } from '../data/categories'

export function CategoryPage() {
  const { category: slug } = useParams<{ category: string }>()
  const category = categories.find((c) => c.slug === slug)

  if (!category) {
    return (
      <PageContainer>
        <EmptyState
          title="Category not found"
          description="This category may have been removed or the link is incorrect."
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <h1>{category.name}</h1>
      <LibraryBrowser category={category} />
    </PageContainer>
  )
}

export default CategoryPage
