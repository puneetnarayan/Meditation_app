export interface Category {
  id: string
  /** URL-safe identifier, used for /library/:category routes. */
  slug: string
  name: string
  description: string
}
