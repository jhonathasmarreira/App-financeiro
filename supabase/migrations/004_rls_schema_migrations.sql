-- Migration 004: Enable RLS on schema_migrations (security advisory fix)
-- This table is internal and should not be accessible via PostgREST.

ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;

-- No policies = no public access allowed (deny by default).
