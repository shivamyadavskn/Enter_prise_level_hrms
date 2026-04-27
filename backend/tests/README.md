# Backend tests

Vitest + Supertest. Tests are split into:

```
tests/
├── setup.js                # Global env (NODE_ENV=test, cron+slack disabled)
└── unit/                   # Pure logic — no DB, no network
    ├── response.test.js
    ├── slack.test.js
    ├── auth.schema.test.js
    └── leaves.schema.test.js
```

## Running

```bash
cd backend
npm install            # picks up vitest + supertest the first time
npm test               # one-shot (CI mode)
npm run test:watch     # interactive, re-runs on save
```

All current tests are pure-logic so they need **no database**. They cover:

- response helpers (every API endpoint funnels through these)
- Slack webhook service (must stay a no-op when unset)
- auth login + change-password Zod schemas
- leave-application Zod schema

## Adding integration tests

For Supertest-driven HTTP tests, create files under `tests/integration/`,
point `DATABASE_URL` at a throw-away test DB, and run migrations first:

```bash
DATABASE_URL=postgres://localhost/hrms_test npx prisma migrate deploy
DATABASE_URL=postgres://localhost/hrms_test npm test
```

Each integration test should `beforeEach` truncate the tables it touches
to stay isolated. Use `app` from `src/app.js` (it does not call
`listen()`, so it's safe to import).
