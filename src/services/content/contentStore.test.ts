import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { meditations as baseMeditations } from '../../data/meditations'
import type { NewMeditationInput } from '../../types'
import {
  addCustomMeditation,
  getAdminMeditationRows,
  getAllMeditations,
  removeCustomMeditation,
  setMeditationHidden,
  setMeditationOverride,
  updateCustomMeditation,
} from './contentStore'

function clear() {
  window.localStorage.clear()
}

const customInput: NewMeditationInput = {
  title: 'Lunch Reset',
  description: 'A short reset for the middle of the day.',
  categoryId: 'cat-stress',
  durationSeconds: 300,
  type: 'guided',
  difficulty: 'beginner',
  tags: ['quick-reset'],
  isPremium: false,
  isFeatured: false,
}

describe('contentStore', () => {
  beforeEach(clear)
  afterEach(clear)

  it('getAllMeditations returns exactly the shipped catalog with no admin changes', () => {
    expect(getAllMeditations()).toEqual(baseMeditations)
  })

  it('applies an override on top of the shipped meditation', () => {
    const [first] = baseMeditations
    setMeditationOverride(first.id, { isFeatured: true, title: 'Renamed' })

    const result = getAllMeditations().find((m) => m.id === first.id)
    expect(result?.isFeatured).toBe(true)
    expect(result?.title).toBe('Renamed')
    // Untouched fields still come from the shipped content.
    expect(result?.description).toBe(first.description)
  })

  it('merges successive overrides on the same meditation', () => {
    const [first] = baseMeditations
    setMeditationOverride(first.id, { isFeatured: true })
    setMeditationOverride(first.id, { isPremium: true })

    const result = getAllMeditations().find((m) => m.id === first.id)
    expect(result?.isFeatured).toBe(true)
    expect(result?.isPremium).toBe(true)
  })

  it('excludes a hidden meditation from getAllMeditations', () => {
    const [first] = baseMeditations
    setMeditationHidden(first.id, true)

    expect(getAllMeditations().some((m) => m.id === first.id)).toBe(false)
  })

  it('un-hiding restores a meditation', () => {
    const [first] = baseMeditations
    setMeditationHidden(first.id, true)
    setMeditationHidden(first.id, false)

    expect(getAllMeditations().some((m) => m.id === first.id)).toBe(true)
  })

  it('addCustomMeditation appends a new meditation with a generated id', () => {
    const added = addCustomMeditation(customInput)
    expect(added.id).toBeTruthy()
    expect(added.title).toBe('Lunch Reset')

    const result = getAllMeditations().find((m) => m.id === added.id)
    expect(result).toMatchObject(customInput)
  })

  it('updateCustomMeditation edits a custom meditation in place, keeping its id', () => {
    const added = addCustomMeditation(customInput)

    updateCustomMeditation(added.id, {
      ...customInput,
      title: 'Lunch Reset (Updated)',
      isFeatured: true,
    })

    const result = getAllMeditations().find((m) => m.id === added.id)
    expect(result?.id).toBe(added.id)
    expect(result?.title).toBe('Lunch Reset (Updated)')
    expect(result?.isFeatured).toBe(true)
    expect(getAllMeditations()).toHaveLength(baseMeditations.length + 1)
  })

  it('setMeditationOverride has no effect on a custom meditation (it is not shipped content)', () => {
    const added = addCustomMeditation(customInput)
    setMeditationOverride(added.id, { title: 'Should not apply' })

    const result = getAllMeditations().find((m) => m.id === added.id)
    expect(result?.title).toBe('Lunch Reset')
  })

  it('removeCustomMeditation deletes a custom meditation but leaves shipped content alone', () => {
    const added = addCustomMeditation(customInput)
    removeCustomMeditation(added.id)

    expect(getAllMeditations().some((m) => m.id === added.id)).toBe(false)
    expect(getAllMeditations()).toEqual(baseMeditations)
  })

  it('getAdminMeditationRows annotates shipped content as not custom, not hidden, no override', () => {
    const rows = getAdminMeditationRows()
    expect(rows).toHaveLength(baseMeditations.length)
    expect(
      rows.every((r) => !r.isCustom && !r.isHidden && !r.hasOverride),
    ).toBe(true)
  })

  it('getAdminMeditationRows reflects overrides, hidden state, and custom additions', () => {
    const [first, second] = baseMeditations
    setMeditationOverride(first.id, { isFeatured: true })
    setMeditationHidden(second.id, true)
    const added = addCustomMeditation(customInput)

    const rows = getAdminMeditationRows()
    expect(rows.find((r) => r.id === first.id)?.hasOverride).toBe(true)
    expect(rows.find((r) => r.id === second.id)?.isHidden).toBe(true)
    const customRow = rows.find((r) => r.id === added.id)
    expect(customRow?.isCustom).toBe(true)
  })

  it('persists changes across reads', () => {
    addCustomMeditation(customInput)
    expect(getAllMeditations()).toHaveLength(baseMeditations.length + 1)
  })
})
