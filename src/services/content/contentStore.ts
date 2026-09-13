import type {
  Meditation,
  MeditationOverride,
  NewMeditationInput,
} from '../../types'
import { meditations as baseMeditations } from '../../data/meditations'
import { readJSON, writeJSON } from '../storage/localStorage'

const CONTENT_STORAGE_KEY = 'meditation-app.content-admin'

interface ContentState {
  overrides: Record<string, MeditationOverride>
  custom: Meditation[]
  hiddenIds: string[]
}

const DEFAULT_STATE: ContentState = {
  overrides: {},
  custom: [],
  hiddenIds: [],
}

function getState(): ContentState {
  return {
    ...DEFAULT_STATE,
    ...readJSON<Partial<ContentState>>(CONTENT_STORAGE_KEY, {}),
  }
}

function saveState(state: ContentState): void {
  writeJSON(CONTENT_STORAGE_KEY, state)
}

/** All meditations the app should show: shipped content with any admin
 * overrides applied, plus admin-added custom meditations, minus
 * anything hidden. This is the single place the rest of the app reads
 * meditations from, so an edit made in Admin is reflected everywhere
 * the catalog is used (Home, Library, Favorites, Programs, Player). */
export function getAllMeditations(): Meditation[] {
  const state = getState()
  const builtIn = baseMeditations.map((meditation) => {
    const override = state.overrides[meditation.id]
    return override ? { ...meditation, ...override } : meditation
  })
  return [...builtIn, ...state.custom].filter(
    (meditation) => !state.hiddenIds.includes(meditation.id),
  )
}

/** A meditation annotated with admin bookkeeping — whether it's a
 * custom addition, currently hidden, or has an override applied. Only
 * meaningful to the Admin screen; the rest of the app just wants
 * getAllMeditations(). */
export interface AdminMeditationRow extends Meditation {
  isCustom: boolean
  isHidden: boolean
  hasOverride: boolean
}

export function getAdminMeditationRows(): AdminMeditationRow[] {
  const state = getState()
  const builtIn = baseMeditations.map((meditation) => {
    const override = state.overrides[meditation.id]
    return {
      ...meditation,
      ...override,
      isCustom: false,
      isHidden: state.hiddenIds.includes(meditation.id),
      hasOverride: Boolean(override),
    }
  })
  const custom = state.custom.map((meditation) => ({
    ...meditation,
    isCustom: true,
    isHidden: state.hiddenIds.includes(meditation.id),
    hasOverride: false,
  }))
  return [...builtIn, ...custom]
}

export function setMeditationOverride(
  id: string,
  patch: MeditationOverride,
): void {
  const state = getState()
  saveState({
    ...state,
    overrides: {
      ...state.overrides,
      [id]: { ...state.overrides[id], ...patch },
    },
  })
}

export function setMeditationHidden(id: string, hidden: boolean): void {
  const state = getState()
  const hiddenIds = hidden
    ? [...new Set([...state.hiddenIds, id])]
    : state.hiddenIds.filter((hiddenId) => hiddenId !== id)
  saveState({ ...state, hiddenIds })
}

export function addCustomMeditation(input: NewMeditationInput): Meditation {
  const meditation: Meditation = { id: crypto.randomUUID(), ...input }
  const state = getState()
  saveState({ ...state, custom: [...state.custom, meditation] })
  return meditation
}

/** Edits a custom meditation in place. Distinct from
 * setMeditationOverride, which only ever patches shipped content —
 * a custom meditation has no shipped original to layer over, so
 * editing it means replacing its stored fields directly. */
export function updateCustomMeditation(
  id: string,
  input: NewMeditationInput,
): void {
  const state = getState()
  saveState({
    ...state,
    custom: state.custom.map((meditation) =>
      meditation.id === id ? { id, ...input } : meditation,
    ),
  })
}

export function removeCustomMeditation(id: string): void {
  const state = getState()
  saveState({
    ...state,
    custom: state.custom.filter((meditation) => meditation.id !== id),
    hiddenIds: state.hiddenIds.filter((hiddenId) => hiddenId !== id),
  })
}
