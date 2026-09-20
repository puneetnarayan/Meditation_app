export interface PrimaryNavItem {
  to: string
  label: string
  icon: string
  end?: boolean
}

/** Single source of truth for the shell's primary navigation, shared by
 * the desktop sidebar and the mobile bottom bar. */
export const primaryNavItems: PrimaryNavItem[] = [
  { to: '/', label: 'Home', icon: '⌂', end: true },
  { to: '/library', label: 'Library', icon: '▤' },
  { to: '/bell-timer', label: 'Bell Timer', icon: '\u{1F514}︎' },
  { to: '/progress', label: 'Progress', icon: '◔' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]
