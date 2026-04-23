-- ============================================================
-- CATCH-UP: aplica as migrations 004-007 de forma segura
-- Execute no SQL Editor do Supabase (uma vez)
-- ============================================================

-- ── 004: RLS na tabela schema_migrations ──────────────────
ALTER TABLE IF EXISTS schema_migrations ENABLE ROW LEVEL SECURITY;

-- ── 005: Otimização da política RLS de transactions ────────
DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;

CREATE POLICY "Users can manage own transactions"
  ON transactions
  FOR ALL
  USING  (user_id = (select auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (select auth.jwt() ->> 'sub'));

-- ── 006: Coluna cartao em transactions ────────────────────
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cartao TEXT DEFAULT '';

-- ── 007: Tabela cartoes ───────────────────────────────────
CREATE TABLE IF NOT EXISTS cartoes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL,
  nome       TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cartoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cartoes_user_policy" ON cartoes;

CREATE POLICY "cartoes_user_policy" ON cartoes
  USING  (user_id = (select auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (select auth.jwt() ->> 'sub'));

-- ── Registrar versões no schema_migrations ────────────────
INSERT INTO schema_migrations (version, applied_at)
VALUES
  ('004_rls_schema_migrations', now()),
  ('005_optimize_rls_policy',   now()),
  ('006_add_cartao',            now()),
  ('007_cartoes',               now())
ON CONFLICT (version) DO NOTHING;
