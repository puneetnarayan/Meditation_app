import { useState } from 'react'
import { MeditationForm } from '../components/admin/MeditationForm'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { Modal } from '../components/common/Modal'
import { PageContainer } from '../components/common/PageContainer'
import { Switch } from '../components/common/Switch'
import { categories } from '../data/categories'
import {
  addCustomMeditation,
  getAdminMeditationRows,
  removeCustomMeditation,
  setMeditationHidden,
  setMeditationOverride,
  updateCustomMeditation,
  type AdminMeditationRow,
} from '../services/content/contentStore'
import type { NewMeditationInput } from '../types'
import { formatSecondsAsClock } from '../utils/time'
import { toTitleCase } from '../utils/text'
import styles from './AdminPage.module.css'

const categoryById = new Map(
  categories.map((category) => [category.id, category]),
)

export function AdminPage() {
  const [rows, setRows] = useState<AdminMeditationRow[]>(() =>
    getAdminMeditationRows(),
  )
  const [search, setSearch] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  function refresh() {
    setRows(getAdminMeditationRows())
  }

  function handleToggleFeatured(row: AdminMeditationRow) {
    setMeditationOverride(row.id, { isFeatured: !row.isFeatured })
    refresh()
  }

  function handleTogglePremium(row: AdminMeditationRow) {
    setMeditationOverride(row.id, { isPremium: !row.isPremium })
    refresh()
  }

  function handleToggleHidden(row: AdminMeditationRow) {
    setMeditationHidden(row.id, !row.isHidden)
    refresh()
  }

  function handleRemoveCustom(row: AdminMeditationRow) {
    removeCustomMeditation(row.id)
    refresh()
  }

  function handleAddSubmit(input: NewMeditationInput) {
    addCustomMeditation(input)
    setIsAdding(false)
    refresh()
  }

  function handleEditSubmit(input: NewMeditationInput) {
    if (!editingId) return
    const target = rows.find((row) => row.id === editingId)
    if (target?.isCustom) {
      updateCustomMeditation(editingId, input)
    } else {
      setMeditationOverride(editingId, input)
    }
    setEditingId(null)
    refresh()
  }

  const editingRow = rows.find((row) => row.id === editingId)
  const filteredRows = search.trim()
    ? rows.filter((row) =>
        row.title.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : rows

  return (
    <PageContainer>
      <h1>Content management</h1>
      <p className={styles.description}>
        Internal tool for managing the meditation catalog. Changes apply
        everywhere the catalog is used — Home, Library, Favorites, and Programs.
      </p>

      <div className={styles.toolbar}>
        <Input
          label="Search"
          type="search"
          placeholder="Search by title…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button onClick={() => setIsAdding(true)}>Add meditation</Button>
      </div>

      <ul className={styles.list}>
        {filteredRows.map((row) => (
          <li key={row.id} className={styles.row}>
            <div className={styles.info}>
              <p className={styles.title}>
                {row.title}
                {row.isCustom && <span className={styles.badge}>Custom</span>}
                {row.hasOverride && (
                  <span className={styles.badge}>Edited</span>
                )}
              </p>
              <p className={styles.meta}>
                {categoryById.get(row.categoryId)?.name ?? row.categoryId}
                {' · '}
                {formatSecondsAsClock(row.durationSeconds)}
                {' · '}
                {toTitleCase(row.difficulty)}
              </p>
            </div>

            <div className={styles.toggles}>
              <Switch
                label={`Featured — ${row.title}`}
                checked={row.isFeatured}
                onChange={() => handleToggleFeatured(row)}
              />
              <Switch
                label={`Premium — ${row.title}`}
                checked={row.isPremium}
                onChange={() => handleTogglePremium(row)}
              />
              <Switch
                label={`Hidden — ${row.title}`}
                checked={row.isHidden}
                onChange={() => handleToggleHidden(row)}
              />
            </div>

            <div className={styles.rowActions}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditingId(row.id)}
              >
                Edit
              </Button>
              {row.isCustom && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleRemoveCustom(row)}
                >
                  Delete
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={isAdding}
        onClose={() => setIsAdding(false)}
        title="Add meditation"
      >
        <MeditationForm
          submitLabel="Add meditation"
          onSubmit={handleAddSubmit}
          onCancel={() => setIsAdding(false)}
        />
      </Modal>

      <Modal
        open={Boolean(editingRow)}
        onClose={() => setEditingId(null)}
        title={editingRow ? `Edit ${editingRow.title}` : 'Edit meditation'}
      >
        {editingRow && (
          <MeditationForm
            initialValues={{
              title: editingRow.title,
              description: editingRow.description,
              categoryId: editingRow.categoryId,
              instructorId: editingRow.instructorId,
              durationSeconds: editingRow.durationSeconds,
              type: editingRow.type,
              difficulty: editingRow.difficulty,
              tags: editingRow.tags,
              isPremium: editingRow.isPremium,
              isFeatured: editingRow.isFeatured,
            }}
            submitLabel="Save changes"
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingId(null)}
          />
        )}
      </Modal>
    </PageContainer>
  )
}

export default AdminPage
