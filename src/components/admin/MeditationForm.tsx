import { useState, type FormEvent } from 'react'
import { categories } from '../../data/categories'
import { instructors } from '../../data/instructors'
import {
  MEDITATION_DIFFICULTIES,
  MEDITATION_TAGS,
  MEDITATION_TYPES,
  type MeditationDifficulty,
  type MeditationTag,
  type MeditationType,
  type NewMeditationInput,
} from '../../types'
import { toTitleCase } from '../../utils/text'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Select } from '../common/Select'
import { Switch } from '../common/Switch'
import styles from './MeditationForm.module.css'

export interface MeditationFormProps {
  initialValues?: NewMeditationInput
  submitLabel: string
  onSubmit: (input: NewMeditationInput) => void
  onCancel: () => void
}

const EMPTY_VALUES: NewMeditationInput = {
  title: '',
  description: '',
  categoryId: categories[0]?.id ?? '',
  instructorId: undefined,
  durationSeconds: 600,
  type: 'guided',
  difficulty: 'beginner',
  tags: [],
  audioUrl: undefined,
  isPremium: false,
  isFeatured: false,
}

/** Shared by AdminPage for both adding a new meditation and editing an
 * existing one — the fields are identical either way, only the initial
 * values and submit label differ. */
export function MeditationForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: MeditationFormProps) {
  const values = initialValues ?? EMPTY_VALUES
  const [title, setTitle] = useState(values.title)
  const [description, setDescription] = useState(values.description)
  const [categoryId, setCategoryId] = useState(values.categoryId)
  const [instructorId, setInstructorId] = useState(values.instructorId ?? '')
  const [minutes, setMinutes] = useState(
    String(Math.round(values.durationSeconds / 60)),
  )
  const [type, setType] = useState<MeditationType>(values.type)
  const [difficulty, setDifficulty] = useState<MeditationDifficulty>(
    values.difficulty,
  )
  const [tags, setTags] = useState<MeditationTag[]>(values.tags)
  const [audioUrl, setAudioUrl] = useState(values.audioUrl ?? '')
  const [isFeatured, setIsFeatured] = useState(values.isFeatured)
  const [isPremium, setIsPremium] = useState(values.isPremium)

  function toggleTag(tag: MeditationTag) {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag],
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim() || !description.trim()) return

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      categoryId,
      instructorId: instructorId || undefined,
      durationSeconds: Math.max(1, Number(minutes) || 0) * 60,
      type,
      difficulty,
      tags,
      audioUrl: audioUrl.trim() || undefined,
      isPremium,
      isFeatured,
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input
        label="Title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
      />

      <label className={styles.textareaField}>
        <span className={styles.textareaLabel}>Description</span>
        <textarea
          className={styles.textarea}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
        />
      </label>

      <Select
        label="Category"
        value={categoryId}
        onChange={(event) => setCategoryId(event.target.value)}
      >
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>

      <Select
        label="Instructor"
        value={instructorId}
        onChange={(event) => setInstructorId(event.target.value)}
      >
        <option value="">No instructor</option>
        {instructors.map((instructor) => (
          <option key={instructor.id} value={instructor.id}>
            {instructor.name}
          </option>
        ))}
      </Select>

      <Input
        label="Duration (minutes)"
        type="number"
        min={1}
        value={minutes}
        onChange={(event) => setMinutes(event.target.value)}
        required
      />

      <Select
        label="Type"
        value={type}
        onChange={(event) => setType(event.target.value as MeditationType)}
      >
        {MEDITATION_TYPES.map((option) => (
          <option key={option} value={option}>
            {toTitleCase(option)}
          </option>
        ))}
      </Select>

      <Select
        label="Difficulty"
        value={difficulty}
        onChange={(event) =>
          setDifficulty(event.target.value as MeditationDifficulty)
        }
      >
        {MEDITATION_DIFFICULTIES.map((option) => (
          <option key={option} value={option}>
            {toTitleCase(option)}
          </option>
        ))}
      </Select>

      <Input
        label="Audio URL (optional)"
        type="url"
        placeholder="https://…"
        value={audioUrl}
        onChange={(event) => setAudioUrl(event.target.value)}
      />

      <fieldset className={styles.tagFieldset}>
        <legend>Tags</legend>
        <div className={styles.tagGrid}>
          {MEDITATION_TAGS.map((tag) => (
            <label key={tag} className={styles.tagOption}>
              <input
                type="checkbox"
                checked={tags.includes(tag)}
                onChange={() => toggleTag(tag)}
              />
              {toTitleCase(tag)}
            </label>
          ))}
        </div>
      </fieldset>

      <Switch
        label="Featured"
        checked={isFeatured}
        onChange={(event) => setIsFeatured(event.target.checked)}
      />
      <Switch
        label="Premium"
        checked={isPremium}
        onChange={(event) => setIsPremium(event.target.checked)}
      />

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}
