#!/usr/bin/env node
/**
 * Migration runner — executa arquivos SQL via Supabase Management API.
 * Requer: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente.
 */

import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.');
  process.exit(1);
}

async function execSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  return res.json().catch(() => null);
}

async function ensureExecSQL() {
  // Cria a função exec_sql no banco se não existir
  const createFn = `
    CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ sql: createFn }),
  });

  if (!res.ok) {
    // exec_sql ainda não existe — usa o endpoint de query direto se disponível
    const direct = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: createFn }),
    });
    if (!direct.ok) {
      console.warn('⚠️  Não foi possível criar exec_sql automaticamente.');
      console.warn('   Rode o SQL das migrations manualmente no Supabase SQL Editor.');
      process.exit(0);
    }
  }
}

async function run() {
  const migrationsDir = join(__dirname, 'migrations');
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  await ensureExecSQL();

  // Tabela de controle
  await execSQL(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `).catch(() => {});

  const res = await fetch(`${SUPABASE_URL}/rest/v1/schema_migrations?select=version`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });

  const applied = res.ok ? await res.json() : [];
  const appliedSet = new Set(applied.map((r) => r.version));

  let ran = 0;
  for (const file of files) {
    const version = file.replace('.sql', '');
    if (appliedSet.has(version)) {
      console.log(`⏭  ${file} — já aplicado`);
      continue;
    }

    const sql = await readFile(join(migrationsDir, file), 'utf8');
    console.log(`▶  Aplicando ${file}...`);

    try {
      await execSQL(sql);
      console.log(`✅  ${file} aplicado.`);
      ran++;
    } catch (err) {
      console.error(`❌  Erro em ${file}: ${err.message}`);
      process.exit(1);
    }
  }

  if (ran === 0) console.log('✅  Nenhuma migration pendente.');
}

run().catch((err) => {
  console.error('❌  Erro inesperado:', err.message);
  process.exit(1);
});
