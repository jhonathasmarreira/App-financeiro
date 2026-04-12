-- Migration 003: Enable Row Level Security
-- Requires Clerk JWT Template named "supabase" to be configured in Clerk Dashboard
-- See: https://clerk.com/docs/integrations/databases/supabase

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Each user can only read/write their own transactions.
-- The JWT 'sub' claim (Clerk user ID) must match the stored user_id.
CREATE POLICY "Users can manage own transactions"
  ON transactions
  FOR ALL
  USING  (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

INSERT INTO schema_migrations (version)
VALUES ('003_enable_rls')
ON CONFLICT (version) DO NOTHING;
