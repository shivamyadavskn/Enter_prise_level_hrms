import { describe, it, expect } from 'vitest'
import { loginSchema, changePasswordSchema } from '../../src/modules/auth/auth.schema.js'

/**
 * Authentication input validation — guarding the front door of the API.
 * Keep these green or login becomes either too lax or unusable.
 */
describe('loginSchema', () => {
  it('accepts a valid email + password', () => {
    expect(loginSchema.safeParse({ email: 'admin@example.com', password: 'p@ss1' }).success).toBe(true)
  })

  it('rejects a malformed email', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: 'p' }).success).toBe(false)
  })

  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false)
  })

  it('accepts an optional TOTP token', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: 'x', totp: '123456' })
    expect(r.success).toBe(true)
  })
})

describe('changePasswordSchema', () => {
  it('rejects when newPassword is too weak (covered by min length)', () => {
    const r = changePasswordSchema.safeParse({ currentPassword: 'old', newPassword: 'x' })
    expect(r.success).toBe(false)
  })
})
