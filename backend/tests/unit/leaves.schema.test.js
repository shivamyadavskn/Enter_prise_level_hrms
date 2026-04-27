import { describe, it, expect } from 'vitest'
import { applyLeaveSchema } from '../../src/modules/leaves/leaves.schema.js'

/**
 * Leave application validation. These rules are the front line of defence
 * against bad data — keeping them tested means controllers can trust their
 * inputs.
 */
describe('applyLeaveSchema', () => {
  const valid = {
    leaveTypeId: 1,
    startDate: '2026-01-10',
    endDate:   '2026-01-12',
    reason:    'Family function',
  }

  it('accepts a well-formed payload', () => {
    const r = applyLeaveSchema.safeParse(valid)
    expect(r.success).toBe(true)
  })

  it('rejects malformed dates', () => {
    const r = applyLeaveSchema.safeParse({ ...valid, startDate: '10-01-2026' })
    expect(r.success).toBe(false)
  })

  it('rejects non-positive leave type id', () => {
    const r = applyLeaveSchema.safeParse({ ...valid, leaveTypeId: 0 })
    expect(r.success).toBe(false)
  })

  it('requires startDate and endDate', () => {
    expect(applyLeaveSchema.safeParse({ ...valid, startDate: undefined }).success).toBe(false)
    expect(applyLeaveSchema.safeParse({ ...valid, endDate:   undefined }).success).toBe(false)
  })
})
