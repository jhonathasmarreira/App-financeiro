-- Migration 001: Create transactions table

CREATE TABLE IF NOT EXISTS transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  amount      DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  category    TEXT NOT NULL,
  date        DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions(date);

-- Migration control table
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     TEXT PRIMARY KEY,
  applied_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO schema_migrations (version)
VALUES ('001_create_transactions')
ON CONFLICT (version) DO NOTHING;
