import { describe, it, expect, vi } from 'vitest'
import * as R from '../../src/utils/response.js'

/**
 * Smoke-tests for the canonical response helpers. These wrap Express's
 * `res.status().json()` chain so any regression here breaks every API
 * endpoint at once.
 */

const mockRes = () => {
  const res = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json   = vi.fn().mockReturnValue(res)
  return res
}

describe('response helpers', () => {
  it('success() returns 200 + { success: true, data, message }', () => {
    const res = mockRes()
    R.success(res, { id: 1 }, 'ok')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true, data: { id: 1 }, message: 'ok',
    }))
  })

  it('created() returns 201', () => {
    const res = mockRes()
    R.created(res, {})
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('badRequest() returns 400 with success:false', () => {
    const res = mockRes()
    R.badRequest(res, 'bad')
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }))
  })

  it('forbidden() returns 403', () => {
    const res = mockRes()
    R.forbidden(res, 'no')
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('notFound() returns 404', () => {
    const res = mockRes()
    R.notFound(res, 'gone')
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('error() returns 500 by default', () => {
    const res = mockRes()
    R.error(res, 'boom')
    expect(res.status).toHaveBeenCalledWith(500)
  })
})
