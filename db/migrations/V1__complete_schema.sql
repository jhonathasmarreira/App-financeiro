-- V1: Complete baseline schema
-- Consolidates all previous migrations (001-007) into a single idempotent script.
-- Safe to run on both new and existing databases.

-- ── Tables ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT          NOT NULL,
  type        TEXT          NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT          NOT NULL,
  amount      DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  category    TEXT          NOT NULL,
  date        DATE          NOT NULL,
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  parcela     TEXT          DEFAULT '',
  data_fatura DATE,
  cartao      TEXT          DEFAULT ''
);

CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_date_idx    ON transactions(date);

CREATE TABLE IF NOT EXISTS cartoes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL,
  nome       TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Row Level Security ────────────────────────────────────────────────────
-- Requires Clerk JWT Template named "supabase" configured in Clerk Dashboard.
-- The JWT 'sub' claim (Clerk user ID) must match the stored user_id.

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartoes      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;
CREATE POLICY "Users can manage own transactions"
  ON transactions FOR ALL
  USING  (user_id = (SELECT auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (SELECT auth.jwt() ->> 'sub'));

DROP POLICY IF EXISTS "cartoes_user_policy" ON cartoes;
CREATE POLICY "cartoes_user_policy" ON cartoes
  USING  (user_id = (SELECT auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (SELECT auth.jwt() ->> 'sub'));

-- ── Cleanup ───────────────────────────────────────────────────────────────

-- Drop legacy migration-tracking table (superseded by flyway_schema_history)
DROP TABLE IF EXISTS schema_migrations;
