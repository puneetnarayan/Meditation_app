import { describe, expect, it } from 'vitest'
import { env } from './env'

describe('env', () => {
  it('exposes only the expected client-safe keys', () => {
    expect(Object.keys(env).sort()).toEqual(
      ['supabaseAnonKey', 'supabaseUrl'].sort(),
    )
  })
})
