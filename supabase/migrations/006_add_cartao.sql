-- Migration 006: Add cartao column to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cartao TEXT DEFAULT '';
