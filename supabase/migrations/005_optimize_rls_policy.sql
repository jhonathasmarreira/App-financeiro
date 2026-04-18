-- Migration 005: Optimize RLS policy performance
-- Wraps auth.jwt() in (select ...) so it is evaluated once per query, not once per row.

DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;

CREATE POLICY "Users can manage own transactions"
  ON transactions
  FOR ALL
  USING  (user_id = (select auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (select auth.jwt() ->> 'sub'));
