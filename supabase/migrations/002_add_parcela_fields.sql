-- Migration 002: Add installment and billing fields

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS parcela      TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS data_fatura  DATE;

INSERT INTO schema_migrations (version)
VALUES ('002_add_parcela_fields')
ON CONFLICT (version) DO NOTHING;
