import { defineConfig } from 'vitest/config'

/**
 * Vitest configuration.
 *
 * - `tests/unit/**`         — pure unit tests (no DB / network).
 * - `tests/integration/**`  — Supertest tests that hit Express + Prisma.
 *                             Skipped automatically when DATABASE_URL is unset
 *                             so they never fail in CI without a test DB.
 *
 * Run with `npm test` (CI) or `npm run test:watch` (dev).
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    setupFiles: ['./tests/setup.js'],
    testTimeout: 15_000,
    pool: 'forks', // isolate Prisma client across tests
    poolOptions: { forks: { singleFork: true } },
  },
})
