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
  const s = String(v).trim();
  if (s.includes(',') && s.includes('.')) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  if (s.includes(',')) return parseFloat(s.replace(',', '.'));
  return parseFloat(s) || 0;
}

function extractParcela(desc: string): string {
  const m = desc.match(/(\d{1,2})\/(\d{1,2})\s*$/) || desc.match(/(\d{1,2})\s+de\s+(\d{1,2})\s*$/i);
  return m ? String(+m[1]).padStart(2,'0') + '/' + String(+m[2]).padStart(2,'0') : '';
}

export function ImportarCSV({ onImported }: { onImported: () => void }) {
  const { addTransactions } = useFinanceStore();
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [faturaMonth, setFaturaMonth] = useState(new Date().toISOString().slice(0,7));
  const [importing, setImporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function processFile(file: File | null) {
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(res) {
        const rows: PreviewRow[] = (res.data as Record<string, string>[]).map((r) => {
          const desc = (r['lançamento'] || r['lancamento'] || r['Lançamento'] || r['LANCAMENTO'] || r['descricao'] || '').trim();
          const rawVal = (r.valor || r.Valor || r.VALOR || '0').toString();
          const amount = Math.abs(parseValor(rawVal));
          const isNeg = parseValor(rawVal) < 0;
          const parcela = extractParcela(desc);
          return {
            date: (r.data || r.Data || r.DATA || '').trim(),
            description: desc,
            amount,
            parcela,
            type: (isNeg ? 'income' : 'expense') as Transaction['type'],
            data_fatura: faturaMonth ? `${faturaMonth}-01` : '',
          };
        }).filter(r => r.date && r.description);
        setPreview(rows);
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
    }));
    await addTransactions(items);
    setPreview([]);
    setImporting(false);
    onImported();
  }

  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Importar Fatura CSV — Itaú</div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
          O arquivo deve ter as colunas: <strong style={{ color: 'var(--text)' }}>data, lançamento, valor</strong>
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>📅 Mês da Fatura</label>
          <input type="month" value={faturaMonth} onChange={e => setFaturaMonth(e.target.value)}
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '7px 12px', borderRadius: 8, fontSize: 13 }} />
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
          style={{
            border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)', padding: '50px 40px',
            textAlign: 'center', cursor: 'pointer',
            background: dragging ? 'rgba(108,99,255,.05)' : 'var(--surface)',
            transition: 'all .2s',
          }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>📁</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Arraste o CSV aqui ou clique para selecionar</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Formato aceito: .csv · Separador vírgula</div>
        </div>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => processFile(e.target.files?.[0] ?? null)} />
      </div>

      {preview.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
            Pré-visualização — <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 12 }}>{preview.length} registros</span>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  {['#','Data','Lançamento','Parcela','Valor','Tipo'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '9px 12px', color: 'var(--muted)' }}>{i+1}</td>
                    <td style={{ padding: '9px 12px' }}>{formatDate(r.date)}</td>
                    <td style={{ padding: '9px 12px' }}>{r.description}</td>
                    <td style={{ padding: '9px 12px', color: 'var(--accent)', fontWeight: 700 }}>{r.parcela || '—'}</td>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: r.type==='income'?'var(--success)':'var(--danger)' }}>
                      {r.type==='income'?'−':''}{formatCurrency(r.amount)}
                    </td>
                    <td style={{ padding: '9px 12px' }}>
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
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
