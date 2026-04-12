#!/usr/bin/env node
/**
 * Migration runner — executa arquivos SQL em supabase/migrations/ em ordem.
 * Só roda migrations ainda não aplicadas (controla via tabela schema_migrations).
 *
 * Uso: node supabase/migrate.js
 * Requer: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente.
 */

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
  const migrationsDir = join(__dirname, 'migrations');
  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  // Garante que a tabela de controle existe
  await supabase.rpc('exec_sql', {
    sql: `CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );`,
  }).catch(() => {}); // ignora se rpc não existir — será criada pelo primeiro migration

  const { data: applied } = await supabase
    .from('schema_migrations')
    .select('version');

  const appliedVersions = new Set((applied ?? []).map((r) => r.version));

  let ran = 0;
  for (const file of files) {
    const version = file.replace('.sql', '');
    if (appliedVersions.has(version)) {
      console.log(`⏭  ${file} — já aplicado`);
      continue;
    }

    const sql = await readFile(join(migrationsDir, file), 'utf8');
    console.log(`▶  Aplicando ${file}...`);

    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      // fallback: tenta via query direta
      const { error: e2 } = await supabase.from('_').select().limit(0);
      console.warn('  ⚠  RPC exec_sql não disponível — rode o SQL manualmente via Supabase Dashboard.');
      console.log(`\n--- SQL de ${file} ---\n${sql}\n---`);
      if (ran === 0) process.exit(1);
      break;
    }

    console.log(`✅  ${file} aplicado.`);
    ran++;
  }

  if (ran === 0) console.log('✅  Nenhuma migration pendente.');
}

run().catch((err) => {
  console.error('❌  Erro inesperado:', err.message);
  process.exit(1);
});
