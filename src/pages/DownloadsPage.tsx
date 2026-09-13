import { useState } from 'react'
import { Button } from '../components/common/Button'
import { EmptyState } from '../components/common/EmptyState'
import { PageContainer } from '../components/common/PageContainer'
import { categories } from '../data/categories'
import { getAllMeditations } from '../services/content/contentStore'
import {
  getDownloadedEntries,
  removeDownload,
} from '../services/offline/offlineAudioStore'
import { getMeditationById } from '../utils/meditationQueries'
import { formatSecondsAsClock } from '../utils/time'
import styles from './DownloadsPage.module.css'

const categoryById = new Map(
  categories.map((category) => [category.id, category]),
)

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 KB'
  const kilobytes = bytes / 1024
  if (kilobytes < 1024) return `${Math.round(kilobytes)} KB`
  return `${(kilobytes / 1024).toFixed(1)} MB`
}

export function DownloadsPage() {
  const [entries, setEntries] = useState(() => getDownloadedEntries())
  const meditations = getAllMeditations()

  async function handleRemove(id: string) {
    await removeDownload(id)
    setEntries(getDownloadedEntries())
  }

  const totalBytes = entries.reduce(
    (sum, entry) => sum + (entry.byteSize ?? 0),
    0,
  )

  return (
    <PageContainer>
      <h1>Downloads</h1>
      <p className={styles.description}>
        Meditations you've downloaded for offline listening.
      </p>

      {entries.length === 0 ? (
        <EmptyState
          title="No downloads yet"
          description="Download a meditation from its details page to listen without a connection."
        />
      ) : (
        <>
          <p className={styles.summary}>
            {entries.length} downloaded · {formatBytes(totalBytes)} used
          </p>
          <ul className={styles.list}>
            {entries.map((entry) => {
              const meditation = getMeditationById(meditations, entry.id)
              return (
                <li key={entry.id} className={styles.row}>
                  <div className={styles.info}>
                    <p className={styles.title}>{entry.title}</p>
                    <p className={styles.meta}>
                      {[
                        meditation &&
                          categoryById.get(meditation.categoryId)?.name,
                        meditation &&
                          formatSecondsAsClock(meditation.durationSeconds),
                        entry.byteSize !== undefined &&
                          formatBytes(entry.byteSize),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => void handleRemove(entry.id)}
                  >
                    Remove
                  </Button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </PageContainer>
  )
}

export default DownloadsPage
