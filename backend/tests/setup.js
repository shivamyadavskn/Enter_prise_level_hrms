/**
 * Vitest global setup — runs before every test file.
 *
 * Loads .env.test if present, otherwise .env. Disables cron + Slack so
 * tests never hit external systems.
 */
import 'dotenv/config'

process.env.NODE_ENV = 'test'
process.env.DISABLE_CRON = 'true'
process.env.SLACK_WEBHOOK_URL = '' // force no-op
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error'
