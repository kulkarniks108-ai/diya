# Database Migration Safety Guide

This document outlines the standard operating procedures for creating, reviewing, and applying database migrations in the 2ndEye project using Alembic.

Our goal is **zero data loss** and **safe schema evolution** across multiple environments.

## 1. Migration Philosophy

- **Migrations are immutable.** Once a migration is merged to `main`, it can never be altered.
- **Never `DROP` data unnecessarily.** Always prefer `ALTER TABLE` over recreating tables.
- **Fail-fast on startup.** The API container runs `alembic upgrade head` on boot. If it fails, the container crashes. This is intentional to prevent the app from running with a mismatched schema.

## 2. Generating Migrations

To generate a new migration, use the `uv` environment within the API container:

```bash
docker compose exec api alembic revision --autogenerate -m "Add battery level to goggles"
```

This creates a new file in `backend/api/migrations/versions/`.

### Pre-Commit Checklist

Always review the auto-generated migration file manually. Alembic is smart, but it can make destructive mistakes.

1. [ ] **Verify `upgrade()`:** Does it make the changes you expect?
2. [ ] **Verify `downgrade()`:** Can this migration be safely reversed?
3. [ ] **Check for Drops:** Does it contain `op.drop_table` or `op.drop_column`? If so, have you verified this will not destroy production data?
4. [ ] **Check for Renames:** Did Alembic misinterpret a column rename as a `drop_column` + `add_column`? (If so, manually change it to `op.alter_column(..., new_column_name='...')`).

## 3. Safe vs. Dangerous Patterns

### ❌ Dangerous: Table Recreation
Never drop and recreate a table to apply a schema change.

```python
# DANGEROUS - Destroys data
op.drop_table('safety_events')
op.create_table('safety_events', ...)
```

### ✅ Safe: Alter Table
Use explicit alter commands to add, modify, or remove constraints.

```python
# SAFE - Preserves data
op.add_column('safety_events', sa.Column('battery_level', sa.Integer(), nullable=True))
```

### ⚠️ Risky: Adding Non-Nullable Columns
If a table already has data, adding a `nullable=False` column will crash because existing rows have no value for it.

**Correct Approach:**
1. Add the column as `nullable=True`.
2. Write a manual `op.execute("UPDATE table SET new_col = 'default'")` to populate existing rows.
3. Alter the column to `nullable=False` (`op.alter_column('table', 'new_col', nullable=False)`).

## 4. Recovering from Mistakes

If you generate a bad migration locally but **have not pushed it yet**:

1. Downgrade your local database to the previous revision:
   ```bash
   docker compose exec api alembic downgrade -1
   ```
2. Delete the bad migration file.
3. Re-generate the migration.

## 5. Automated Health Checks

The infrastructure provides diagnostic tooling to verify migration states.

Run the health check script to ensure your local database matches the migration head:
```bash
./infra/scripts/check-db.ps1
# or
./infra/scripts/check-db.sh
```
