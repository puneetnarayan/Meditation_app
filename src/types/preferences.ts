export interface UserPreferences {
  /** 0–1. */
  audioVolume: number
  reducedMotion: boolean
  /** Preferred meditation length in seconds, used to pre-select a
   * duration elsewhere in the app. Undefined = no preference set. */
  preferredDurationSeconds?: number
}
