# Database Migrations — Cloud Flight Simulator

## Overview

This directory contains all Alembic database migrations for Cloud Flight Simulator. P2 (Backend Platform Lead) is the sole migration author.

## Migration Files

### Infrastructure Files
- **alembic.ini** — Alembic configuration file
- **env.py** — Migration environment setup (handles DATABASE_URL from environment variables)
- **script.py.mako** — Alembic migration template

### Migration Versions
- **versions/001_initial_schema.py** — Day 1: All 9 platform tables (users, refresh_tokens, missions, challenge_sessions, environments, submissions, evaluations, feedback_reports, audit_events)

### Documentation
- **README.md** — This file
- **SCHEMA_SUMMARY.md** — Detailed schema documentation with all tables, columns, indexes, and relationships
- **MIGRATION_VERIFICATION.md** — Comprehensive verification report

## Running Migrations

### Prerequisites

1. Set up a PostgreSQL database
2. Create a `.env` file in `backend/` with:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/cloud_flight_simulator
   ```

3. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   pip install alembic
   ```

### Upgrade to Latest

```bash
cd backend
alembic upgrade head
```

### Downgrade One Revision

```bash
cd backend
alembic downgrade -1
```

### Check Current Revision

```bash
cd backend
alembic current
```

### View Migration History

```bash
cd backend
alembic history
```

## Schema Overview

### 9 Tables Created

1. **users** — Learner accounts (P2)
2. **refresh_tokens** — JWT session management (P2)
3. **missions** — AI-generated challenges (P3, created by P2)
4. **challenge_sessions** — Learner attempts (P4, created by P2)
5. **environments** — GCP environments (P4, created by P2)
6. **submissions** — Learner explanations (P1/P5, created by P2)
7. **evaluations** — Scoring results (P5, created by P2)
8. **feedback_reports** — AI feedback (P6, created by P2)
9. **audit_events** — Audit trail (P7, created by P2)

### Key Characteristics

- **9 UUID primary keys** — All use `gen_random_uuid()`
- **25 timestamp columns** — All use `TIMESTAMPTZ` for timezone awareness
- **16 indexes** — Optimized for common query patterns
- **9 foreign keys** — Enforce relational integrity
- **Partial unique index** — `environments.resource_prefix` when status='READY'
- **Append-only audit** — No UPDATE/DELETE semantics on audit_events

### Foreign Key Graph

```
users ─┬─> refresh_tokens
       ├─> challenge_sessions ─┬─> environments
       │                      ├─> submissions
       │                      ├─> evaluations
       │                      ├─> feedback_reports
       │                      └─> audit_events
       └─> missions
```

## Governance

### P2 Responsibilities

- ✅ Sole migration author
- ✅ All migrations in `backend/migrations/`
- ✅ All migrations use Alembic (no raw SQL)
- ✅ Version control for migrations (001, 002, 003...)
- ✅ Maintain schema documentation
- ✅ Approve all schema changes

### Frozen Rules

- ✅ All 9 tables created in single Day 1 migration
- ✅ No new tables without governance approval
- ✅ No column additions without formal amendment
- ✅ No column removals
- ✅ No column renames
- ✅ No type changes
- ✅ No index additions without P2 review

## Adding New Migrations

When a schema change is needed:

1. **Domain owner** requests change in PR comment with:
   - Reason (e.g., "P5 needs to track evaluation duration")
   - Affected table
   - Column(s) to add/modify

2. **P2** approves/requests changes

3. **P2** creates new migration:
   ```bash
   cd backend
   alembic revision -m "p5_evaluation_duration"
   ```

4. **P2** edits migration file with upgrade/downgrade logic

5. **P2** updates `docs/contracts/CHANGELOG.md` if contracts affected

6. **P2 + domain owner** approve PR before merge

## Testing Migrations

### Local Testing

```bash
# Start fresh
dropdb cloud_flight_simulator
createdb cloud_flight_simulator

# Run migration
cd backend
alembic upgrade head

# Verify tables
psql cloud_flight_simulator -c "\dt"

# Verify indexes
psql cloud_flight_simulator -c "\di"
```

### Downgrade Testing

```bash
cd backend
alembic downgrade -1

# Verify tables dropped
psql cloud_flight_simulator -c "\dt"

# Re-apply
alembic upgrade head
```

## Troubleshooting

### Migration fails with "database does not exist"

Create the database first:
```bash
createdb cloud_flight_simulator
```

### Migration fails with "DATABASE_URL not set"

Set the environment variable:
```bash
export DATABASE_URL="postgresql://user:password@localhost/cloud_flight_simulator"
```

Or create a `.env` file in `backend/`:
```
DATABASE_URL=postgresql://user:password@localhost/cloud_flight_simulator
```

### Foreign key constraint violations during downgrade

The migration drops tables in reverse dependency order. If errors occur:
1. Check current revision: `alembic current`
2. Check history: `alembic history`
3. Contact P2 for debugging

## References

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [PostgreSQL UUID Type](https://www.postgresql.org/docs/current/datatype-uuid.html)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [Cloud Flight Simulator Architecture](../docs/CLAUDE.md)
- [P2 Responsibilities](../P2_RESPONSIBILITY_ANALYSIS.md)

## Maintenance

### Backup Before Major Operations

```bash
pg_dump cloud_flight_simulator > backup_$(date +%Y%m%d).sql
```

### Restore from Backup

```bash
psql cloud_flight_simulator < backup_20260621.sql
```

### Schema Inspection Queries

```sql
-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname='public';

-- List all indexes
SELECT indexname FROM pg_indexes WHERE schemaname='public';

-- List foreign keys
SELECT constraint_name FROM information_schema.table_constraints 
WHERE constraint_type='FOREIGN KEY';

-- Inspect table structure
\d+ table_name

-- Check index details
\di+ index_name
```

---

**Last Updated:** 2026-06-21  
**Migration Version:** 001 (Day 1 Initial Schema)  
**P2 Ownership:** All migrations authored by P2 exclusively
