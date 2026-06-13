"""Initial schema

Revision ID: 4570c0c285e8
Revises:
Create Date: 2026-06-13 12:45:00.000000

Squashed from:
  - b18538fb70bb (initial_migration, 2026-04-30)
  - 0de01c981a6c (recreate_safety_events, 2026-05-29)

The second migration was a redundant DROP + CREATE of safety_events with
an identical schema.  This squash eliminates the destructive pattern and
produces the same final schema in a single, clean migration.

See: docs/database/migration-guide.md for migration best practices.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "4570c0c285e8"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the initial 2ndEye schema."""

    # ── auth_sessions ────────────────────────────────────────────────
    op.create_table(
        "auth_sessions",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("refresh_token", sa.String(length=512), nullable=False),
        sa.Column("token_version", sa.Integer(), nullable=False),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_auth_sessions")),
    )
    op.create_index(
        op.f("ix_auth_sessions_refresh_token"),
        "auth_sessions",
        ["refresh_token"],
        unique=False,
    )
    op.create_index(
        op.f("ix_auth_sessions_user_id"),
        "auth_sessions",
        ["user_id"],
        unique=False,
    )

    # ── users ────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("roles", sa.JSON(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
    )
    op.create_index(
        op.f("ix_users_email"), "users", ["email"], unique=True
    )

    # ── safety_events ────────────────────────────────────────────────
    op.create_table(
        "safety_events",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("trace_id", sa.String(length=100), nullable=False),
        sa.Column("idempotency_key", sa.String(length=100), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_safety_events")),
    )
    op.create_index(
        op.f("ix_safety_events_idempotency_key"),
        "safety_events",
        ["idempotency_key"],
        unique=True,
    )
    op.create_index(
        op.f("ix_safety_events_trace_id"),
        "safety_events",
        ["trace_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_safety_events_user_id"),
        "safety_events",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    """Drop all tables in reverse dependency order."""

    op.drop_index(op.f("ix_safety_events_user_id"), table_name="safety_events")
    op.drop_index(op.f("ix_safety_events_trace_id"), table_name="safety_events")
    op.drop_index(
        op.f("ix_safety_events_idempotency_key"), table_name="safety_events"
    )
    op.drop_table("safety_events")

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    op.drop_index(
        op.f("ix_auth_sessions_refresh_token"), table_name="auth_sessions"
    )
    op.drop_index(op.f("ix_auth_sessions_user_id"), table_name="auth_sessions")
    op.drop_table("auth_sessions")
