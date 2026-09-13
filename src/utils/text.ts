/** Converts a kebab-case value (e.g. a MeditationType or tag) into a
 * human-readable label, e.g. "body-scan" -> "Body scan". */
export function toTitleCase(value: string): string {
  const withSpaces = value.replace(/-/g, ' ')
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1)
}
