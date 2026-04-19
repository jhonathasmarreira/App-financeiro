CREATE TABLE IF NOT EXISTS cartoes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL,
  nome       TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cartoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cartoes_user_policy" ON cartoes
  USING  (user_id = (select auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (select auth.jwt() ->> 'sub'));
