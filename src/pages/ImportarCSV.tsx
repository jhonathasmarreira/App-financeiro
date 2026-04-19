import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatCurrency, formatDate } from '../utils/format';
import type { Transaction } from '../types';

interface PreviewRow {
  date: string;
  description: string;
  amount: number;
  parcela: string;
  type: Transaction['type'];
  data_fatura: string;
}

function parseValor(v: string): number {
  const s = String(v).trim().replace(/\s/g, '');
  // Remove símbolo de moeda se houver
  const clean = s.replace(/^[R$\s]+/, '');
  if (clean.includes(',') && clean.includes('.')) return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
  if (clean.includes(',')) return parseFloat(clean.replace(',', '.'));
  return parseFloat(clean) || 0;
}

const PT_MONTHS: Record<string, string> = {
  jan:'01', fev:'02', mar:'03', abr:'04', mai:'05', jun:'06',
  jul:'07', ago:'08', set:'09', out:'10', nov:'11', dez:'12',
};

/**
 * Infere o ano considerando que datas de meses futuros ao mês da fatura
 * pertencem ao ano anterior (ex: fatura março/2026, data novembro → 2025).
 */
function inferYear(monthNum: number, faturaMonth: string): string {
  const faturaYear = parseInt(faturaMonth.slice(0, 4));
  const faturaMonthNum = parseInt(faturaMonth.slice(5, 7));
  return (monthNum > faturaMonthNum + 1 ? faturaYear - 1 : faturaYear).toString();
}

/**
 * Converte vários formatos de data do Itaú para YYYY-MM-DD:
 *   DD/MM/YYYY  → 14/11/2026
 *   DD/MM       → 14/11  (sem ano — usa mês da fatura)
 *   DD/MMM      → 14/nov (sem ano — usa mês da fatura)
 *   YYYY-MM-DD  → já correto
 */
function parseItauDate(dateStr: string, faturaMonth: string): string {
  const s = String(dateStr).trim();

  // DD/MM/YYYY
  const full = s.match(/^(\d{1,2})\/(\d{2})\/(\d{4})$/);
  if (full) return `${full[3]}-${full[2].padStart(2,'0')}-${full[1].padStart(2,'0')}`;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MMM  (ex: 14/nov)
  const abbr = s.toLowerCase().match(/^(\d{1,2})\/([a-z]{3})$/);
  if (abbr) {
    const month = PT_MONTHS[abbr[2]];
    if (month) {
      const year = inferYear(parseInt(month), faturaMonth);
      return `${year}-${month}-${abbr[1].padStart(2,'0')}`;
    }
  }

  // DD/MM  (ex: 14/11 — sem ano)
  const short = s.match(/^(\d{1,2})\/(\d{2})$/);
  if (short) {
    const year = inferYear(parseInt(short[2]), faturaMonth);
    return `${year}-${short[2]}-${short[1].padStart(2,'0')}`;
  }

  return s;
}

function extractParcela(desc: string): string {
  const m = desc.match(/(\d{1,2})\/(\d{1,2})\s*$/) || desc.match(/(\d{1,2})\s+de\s+(\d{1,2})\s*$/i);
  return m ? String(+m[1]).padStart(2,'0') + '/' + String(+m[2]).padStart(2,'0') : '';
}

/** Extrai o valor de um campo a partir de múltiplas variações de nome de coluna */
function col(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null) return String(row[k]);
  }
  return '';
}

export function ImportarCSV({ onImported }: { onImported: () => void }) {
  const { addTransactions } = useFinanceStore();
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [faturaMonth, setFaturaMonth] = useState(new Date().toISOString().slice(0,7));
  const [cartao, setCartao] = useState('');
  const [importing, setImporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [parseError, setParseError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function processFile(file: File | null) {
    if (!file) return;
    setParseError('');

    // Tenta parsear com a encoding ISO-8859-1 (padrão Itaú) e também UTF-8
    tryParse(file, 'ISO-8859-1');
  }

  function tryParse(file: File, encoding: string) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      encoding,
      complete(res) {
        const data = res.data as Record<string, string>[];

        const rows: PreviewRow[] = data.map((r) => {
          // Suporta múltiplas variações de nome de coluna do Itaú e outros bancos
          const desc = col(r,
            'lançamento', 'lancamento', 'Lançamento', 'Lancamento',
            'LANÇAMENTO', 'LANCAMENTO', 'descricao', 'Descricao',
            'DESCRICAO', 'descrição', 'Descrição', 'historico',
            'Historico', 'HISTORICO', 'memo', 'Memo',
          ).trim();

          const rawVal = col(r,
            'valor', 'Valor', 'VALOR',
            'valor (r$)', 'Valor (R$)', 'VALOR (R$)',
            'amount', 'Amount',
          ) || '0';

          const dateRaw = col(r,
            'data', 'Data', 'DATA',
            'data compra', 'Data Compra', 'DATA COMPRA',
            'date', 'Date', 'DATE',
          ).trim();

          const amount = Math.abs(parseValor(rawVal));
          const isNeg = parseValor(rawVal) < 0;
          const parcelaCol = col(r, 'parcela', 'Parcela', 'PARCELA').trim();
          const parcela = parcelaCol || extractParcela(desc);

          return {
            date: parseItauDate(dateRaw, faturaMonth),
            description: desc,
            amount,
            parcela,
            // No Itaú: positivo = débito (expense), negativo = pagamento/estorno (income)
            type: (isNeg ? 'income' : 'expense') as Transaction['type'],
            data_fatura: faturaMonth ? `${faturaMonth}-01` : '',
          };
        }).filter(r => r.date && r.description && r.amount > 0);

        if (rows.length === 0) {
          // Se não encontrou nada com ISO-8859-1, tenta UTF-8
          if (encoding === 'ISO-8859-1') {
            tryParse(file, 'UTF-8');
          } else {
            setParseError(
              'Nenhuma linha válida encontrada. Verifique se o arquivo é um CSV do Itaú com as colunas: data, lançamento, valor.'
            );
          }
          return;
        }

        setPreview(rows);
      },
      error(err) {
        setParseError(`Erro ao ler o arquivo: ${err.message}`);
      },
    });
  }

  async function handleImport() {
    if (!preview.length) return;
    setImporting(true);
    const items = preview.map(r => ({
      type: r.type,
      description: r.description,
      amount: r.amount,
      category: ('Importado' as Transaction['category']),
      date: r.date,
      parcela: r.parcela,
      data_fatura: r.data_fatura,
      cartao: cartao.trim(),
    }));
    const { count, error } = await addTransactions(items);
    setImporting(false);
    if (count > 0) {
      setPreview([]);
      onImported();
    } else {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const urlInfo = supabaseUrl ? `URL: ${supabaseUrl.slice(0, 40)}...` : 'URL do Supabase não configurada!';
      setParseError(`Erro ao salvar: ${error ?? 'erro desconhecido'} | ${urlInfo}`);
    }
  }

  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Importar Fatura CSV — Itaú</div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
          Colunas obrigatórias: <strong style={{ color: 'var(--text)' }}>data, lançamento, valor</strong> — opcional: <strong style={{ color: 'var(--text)' }}>parcela</strong>
          <br />
          <span style={{ fontSize: 12 }}>Datas no formato DD/MM/AAAA são convertidas automaticamente.</span>
        </p>

        <div className="csv-meta-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>📅 Mês da Fatura</label>
            <input type="month" value={faturaMonth} onChange={e => setFaturaMonth(e.target.value)}
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '7px 12px', borderRadius: 8, fontSize: 13 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>💳 Nome do Cartão</label>
            <input type="text" value={cartao} onChange={e => setCartao(e.target.value)}
              placeholder="Ex: Cartão Nubank"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '7px 12px', borderRadius: 8, fontSize: 13 }} />
          </div>
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
          style={{
            border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)', padding: '40px 24px',
            textAlign: 'center', cursor: 'pointer',
            background: dragging ? 'rgba(108,99,255,.05)' : 'var(--surface)',
            transition: 'all .2s',
          }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📁</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Arraste o CSV aqui ou clique para selecionar</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Formato aceito: .csv · Separador vírgula ou ponto-e-vírgula</div>
        </div>
        <input
          ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }}
          onChange={e => { processFile(e.target.files?.[0] ?? null); e.target.value = ''; }}
        />

        {parseError && (
          <div style={{ marginTop: 14, background: 'rgba(255,77,109,.12)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--danger)' }}>
            ⚠️ {parseError}
          </div>
        )}
      </div>

      {preview.length > 0 && (
        <div className="csv-preview-padding" style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
            Pré-visualização — <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 12 }}>{preview.length} registros</span>
          </div>
          <div className="csv-preview-table" style={{ maxHeight: 320, overflowY: 'auto', overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 520 }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  {['#','Data','Lançamento','Parcela','Valor','Tipo'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '9px 12px', color: 'var(--muted)' }}>{i+1}</td>
                    <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{formatDate(r.date)}</td>
                    <td style={{ padding: '9px 12px' }}>{r.description}</td>
                    <td style={{ padding: '9px 12px', color: 'var(--accent)', fontWeight: 700 }}>{r.parcela || '—'}</td>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: r.type==='income'?'var(--success)':'var(--danger)', whiteSpace: 'nowrap' }}>
                      {r.type==='income'?'−':''}{formatCurrency(r.amount)}
                    </td>
                    <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                      {r.type==='income'
                        ? <span style={{ background:'rgba(67,217,173,.15)',color:'var(--success)',padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:700 }}>💚 Pagamento</span>
                        : r.parcela
                          ? <span style={{ background:'rgba(108,99,255,.15)',color:'var(--accent)',padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:700 }}>🔄 Parcela</span>
                          : <span style={{ background:'rgba(255,77,109,.15)',color:'var(--danger)',padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:700 }}>💳 Crédito</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="csv-action-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setPreview([])} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
            <button onClick={handleImport} disabled={importing}
              style={{ background: 'var(--accent)', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: importing ? .7 : 1 }}>
              {importing ? 'Importando…' : `✅ Confirmar ${preview.length} registros`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
