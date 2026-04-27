# Operations Runbook

This document covers everything an operator needs to keep PeopleOS running in
production: backups, restores, schema migrations, log rotation, and the
recommended deploy workflow.

> **Audience:** server administrators / DevOps. Application configuration is
> covered in `backend/.env.example`; this file is purely operational.

---

## 1. Database backups

PeopleOS uses **PostgreSQL**. All organisation data lives in a single
database — back it up daily.

### 1.1 Daily logical backup (recommended)

Run `pg_dump` from a host that can reach the database. The output is a
plain SQL file that can be replayed on any compatible PostgreSQL.

```bash
# Replace placeholders with real values
export PGPASSWORD='your-db-password'
BACKUP_DIR=/var/backups/peopleos
STAMP=$(date +%Y-%m-%d_%H%M)

mkdir -p "$BACKUP_DIR"
pg_dump \
  -h db.example.com -p 5432 \
  -U peopleos -d peopleos_prod \
  --format=custom --compress=9 \
  --file="$BACKUP_DIR/peopleos_${STAMP}.dump"
```

Schedule via **cron** on the backup host:

```cron
# 02:30 every day
30 2 * * * /usr/local/bin/peopleos-backup.sh >> /var/log/peopleos-backup.log 2>&1
```

### 1.2 Retention

Keep at least:

- **7 daily** backups (rolling)
- **4 weekly** backups (Sundays)
- **12 monthly** backups (1st of month)

A simple find-based cleanup:

```bash
find "$BACKUP_DIR" -name 'peopleos_*.dump' -mtime +7 -delete
```

### 1.3 Off-site copy

Copy each daily dump to **a different physical location** (S3, B2, Wasabi,
or another VPS). A single-host backup is no backup.

```bash
# AWS CLI example
aws s3 cp "$BACKUP_DIR/peopleos_${STAMP}.dump" \
  s3://peopleos-backups/$(hostname)/ --storage-class STANDARD_IA
```

### 1.4 Restore drill

**Practice your restore at least quarterly** on a staging database:

```bash
# Drop & recreate the staging DB first
dropdb -h staging-db -U peopleos peopleos_staging
createdb -h staging-db -U peopleos peopleos_staging

pg_restore \
  -h staging-db -U peopleos -d peopleos_staging \
  --no-owner --clean --if-exists \
  /var/backups/peopleos/peopleos_2026-01-15_0230.dump
```

A restore that hasn't been tested **does not exist**.

### 1.5 Uploaded files

Beyond the database, back up the uploads directory referenced by
`UPLOAD_DIR` in `.env` (default: `backend/uploads`). It contains employee
photos, document attachments, and reimbursement receipts.

```bash
rsync -aH --delete /opt/peopleos/uploads/ /var/backups/peopleos/uploads/
```

---

## 2. Schema migrations (Prisma)

> **IMPORTANT:** Never use `prisma db push` against production. It alters
> tables without leaving a migration history, and can destroy data. Always
> use `prisma migrate`.

### 2.1 Developer workflow (writing a migration)

When you change `backend/prisma/schema.prisma`:

```bash
cd backend

# Creates a new SQL migration file under prisma/migrations/<timestamp>_name/
# and applies it to your *development* database.
npx prisma migrate dev --name add_attendance_geo_fields

# Regenerate the Prisma client (auto-runs after migrate dev, but harmless)
npx prisma generate
```

Commit the generated `prisma/migrations/<timestamp>_*/migration.sql` to
git. **The migration file is the source of truth, not the schema.**

### 2.2 Production deploy workflow

On the production host (or in the CI/CD pipeline) **before starting the
new application version**:

```bash
cd backend
# Applies any unapplied migrations transactionally. Idempotent.
npx prisma migrate deploy
```

This is safe to run on every deploy, even if there are no pending
migrations.

### 2.3 If a migration fails mid-way

```bash
# Inspect what state Prisma thinks the DB is in
npx prisma migrate status

# If marked failed but the SQL did apply manually, mark it applied:
npx prisma migrate resolve --applied <migration_name>

# If it didn't apply, mark rolled-back so you can fix and redeploy:
npx prisma migrate resolve --rolled-back <migration_name>
```

### 2.4 First-time setup

If your prod database was bootstrapped via `prisma db push` (legacy), you
need to baseline the existing schema **once** before switching to migrations:

```bash
# Generate a baseline migration from the live schema
npx prisma migrate dev --name baseline --create-only

# On the prod DB, mark it as applied without re-running
DATABASE_URL=... npx prisma migrate resolve --applied baseline
```

After that, `prisma migrate deploy` works normally.

---

## 3. Deploy checklist

Before flipping traffic to a new release:

1. **Backup** database (`pg_dump` per § 1.1).
2. Run **`npx prisma migrate deploy`** on the new code.
3. Restart the Node process (PM2 / systemd / Docker restart).
4. Hit `/health` — must return 200 OK.
5. Smoke-test critical paths: login, view dashboard, view payroll list.
6. Tail logs for 5 minutes; abort if you see error spikes.

### Rollback

If the deploy goes wrong:

1. Stop the new process.
2. Re-deploy the previous container/image/commit.
3. **Do NOT roll back the database** unless absolutely necessary —
   restoring from § 1.4 will lose data created since the snapshot.
4. If you must, restore staging from the latest dump first to verify
   integrity, then promote.

---

## 4. Logs & monitoring

- Application logs go to **stdout** — capture them via your process
  manager (PM2: `~/.pm2/logs/`; Docker: `docker logs <container>`).
- The audit-log table (`audit_logs`) records every privileged action.
  Periodically archive and prune rows older than 12 months:

  ```sql
  DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '12 months';
  ```

- Health endpoint: `GET /health` returns DB + Redis status.
- Metrics endpoint (if Prometheus is wired): `GET /metrics`.

### Recommended (free) external monitoring

- **UptimeRobot** (free tier, 50 monitors) — ping `/health` every 5 min.
- **Better Stack / Logtail** (free 1 GB/mo) — log forwarding.

---

## 5. Background jobs (cron)

PeopleOS schedules its own cron tasks via `node-cron` inside the API
process. They are registered on boot (`startCronJobs()` in
`backend/server.js`).

| Job | Schedule | Purpose |
|---|---|---|
| Monthly leave accrual | `0 5 1 * *` (1st @ 00:05) | Adds `annualQuota / 12` to every active employee's leave balance |
| Daily celebrations digest | `0 0 8 * * *` (08:00) | Notifies admins/HR of birthdays + work anniversaries |

Disable in dev via `DISABLE_CRON=true` in `.env`.

Manual triggers (admin-only) for re-runs:

```http
POST /api/celebrations/run-accrual
POST /api/celebrations/run-cron
```

---

## 6. Secrets management

- Production secrets must live in **environment variables**, never in
  source control.
- Rotate the following on a fixed schedule:
  - `JWT_SECRET` and `JWT_REFRESH_SECRET` — every 6 months (will log out
    all users; do during low-traffic window).
  - Database passwords — every 12 months.
  - Email/SMTP credentials — when staff with access leave.
- After rotation, restart the application.

---

## 7. Disaster recovery

| Scenario | Action |
|---|---|
| App host dies | Spin up new VM, deploy latest container, point DNS — uploads come back from backup. |
| DB host dies | Provision new Postgres, restore latest dump (§ 1.4), update `DATABASE_URL`, restart app. |
| Region outage | Restore from off-site S3 copy (§ 1.3) into a fresh region. |
| Compromised credentials | Rotate all secrets (§ 6), force logout via `DELETE FROM refresh_tokens;`, audit `audit_logs` for unauthorised actions. |

**RTO (recovery time objective):** ≤ 1 hour with a tested runbook.
**RPO (data loss tolerance):** ≤ 24 hours with daily backups; reduce to
15 min by enabling Postgres WAL archiving.

---

_Last updated: 2026-04-27_
