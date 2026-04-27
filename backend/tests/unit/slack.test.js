import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Slack notifier should be a silent no-op when SLACK_WEBHOOK_URL is unset.
 * If this regresses, every controller call would start throwing.
 */
describe('slack.service', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.SLACK_WEBHOOK_URL
  })

  it('is a no-op when SLACK_WEBHOOK_URL is empty', async () => {
    process.env.SLACK_WEBHOOK_URL = ''
    const { sendSlack, slackEnabled } = await import('../../src/services/slack.service.js')
    expect(slackEnabled()).toBe(false)
    await sendSlack('hello')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('posts JSON to the webhook when configured', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test'
    fetch.mockResolvedValue({ ok: true, status: 200 })
    const { sendSlack, slackEnabled } = await import('../../src/services/slack.service.js')
    expect(slackEnabled()).toBe(true)
    await sendSlack('hello')
    expect(fetch).toHaveBeenCalledOnce()
    const [url, opts] = fetch.mock.calls[0]
    expect(url).toBe('https://hooks.slack.com/test')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toEqual({ text: 'hello' })
  })

  it('swallows network errors so callers never crash', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test'
    fetch.mockRejectedValue(new Error('ECONNREFUSED'))
    const { sendSlack } = await import('../../src/services/slack.service.js')
    await expect(sendSlack('hi')).resolves.toBeUndefined()
  })
})
