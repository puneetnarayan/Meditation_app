import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { PageContainer } from '../components/common/PageContainer'
import { Select } from '../components/common/Select'
import { DURATION_OPTIONS } from '../config/durationOptions'
import { usePreferences } from '../hooks/usePreferences'
import {
  MEDITATION_DIFFICULTIES,
  MEDITATION_TAGS,
  PREFERRED_TIMES_OF_DAY,
  PRIMARY_GOALS,
  type MeditationDifficulty,
  type MeditationTag,
  type PreferredTimeOfDay,
  type PrimaryGoal,
} from '../types'
import { toTitleCase } from '../utils/text'
import styles from './OnboardingPage.module.css'

const GOAL_LABELS: Record<PrimaryGoal, string> = {
  stress: 'Reduce stress',
  sleep: 'Sleep better',
  focus: 'Improve focus',
  anxiety: 'Ease anxiety',
  'general-wellbeing': 'General wellbeing',
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const { preferences, updatePreferences } = usePreferences()

  const [goal, setGoal] = useState<PrimaryGoal | ''>(
    preferences.primaryGoal ?? '',
  )
  const [experience, setExperience] = useState<MeditationDifficulty | ''>(
    preferences.experienceLevel ?? '',
  )
  const [timeOfDay, setTimeOfDay] = useState<PreferredTimeOfDay | ''>(
    preferences.preferredTimeOfDay ?? '',
  )
  const [duration, setDuration] = useState<number | ''>(
    preferences.preferredDurationSeconds ?? '',
  )
  const [tags, setTags] = useState<MeditationTag[]>(
    preferences.contentPreferences,
  )

  function toggleTag(tag: MeditationTag) {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag],
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updatePreferences({
      primaryGoal: goal || undefined,
      experienceLevel: experience || undefined,
      preferredTimeOfDay: timeOfDay || undefined,
      preferredDurationSeconds: duration === '' ? undefined : duration,
      contentPreferences: tags,
      onboardingCompleted: true,
      onboardingSkipped: false,
    })
    navigate('/')
  }

  function handleSkip() {
    updatePreferences({ onboardingSkipped: true })
    navigate('/')
  }

  return (
    <PageContainer>
      <h1>Let's personalize your practice</h1>
      <p>
        A few quick questions — you can change your answers anytime in Settings.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <Select
          label="What brings you here?"
          value={goal}
          onChange={(event) => setGoal(event.target.value as PrimaryGoal | '')}
        >
          <option value="">Prefer not to say</option>
          {PRIMARY_GOALS.map((option) => (
            <option key={option} value={option}>
              {GOAL_LABELS[option]}
            </option>
          ))}
        </Select>

        <Select
          label="How experienced are you with meditation?"
          value={experience}
          onChange={(event) =>
            setExperience(event.target.value as MeditationDifficulty | '')
          }
        >
          <option value="">Prefer not to say</option>
          {MEDITATION_DIFFICULTIES.map((level) => (
            <option key={level} value={level}>
              {toTitleCase(level)}
            </option>
          ))}
        </Select>

        <Select
          label="When do you usually practice?"
          value={timeOfDay}
          onChange={(event) =>
            setTimeOfDay(event.target.value as PreferredTimeOfDay | '')
          }
        >
          <option value="">No preference</option>
          {PREFERRED_TIMES_OF_DAY.map((option) => (
            <option key={option} value={option}>
              {toTitleCase(option)}
            </option>
          ))}
        </Select>

        <Select
          label="Typical session length?"
          value={duration}
          onChange={(event) =>
            setDuration(event.target.value ? Number(event.target.value) : '')
          }
        >
          <option value="">No preference</option>
          {DURATION_OPTIONS.map((option) => (
            <option key={option.seconds} value={option.seconds}>
              {option.label}
            </option>
          ))}
        </Select>

        <fieldset className={styles.tagFieldset}>
          <legend>What are you interested in?</legend>
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

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={handleSkip}>
            Not now
          </Button>
          <Button type="submit">Get started</Button>
        </div>
      </form>
    </PageContainer>
  )
}

export default OnboardingPage
