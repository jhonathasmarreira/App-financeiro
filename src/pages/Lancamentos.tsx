import { useState, useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import type { Transaction } from '../types';
import { formatCurrency, formatDate, toMonthKey, getMonthLabel } from '../utils/format';

function badge(t: Transaction) {
  const today = new Date().toISOString().slice(0,10);
  const future = !!t.parcela && t.date > today;
  if (t.type === 'income')
    return <span style={bs('rgba(67,217,173,.15)','var(--success)')}>💚 Pagamento</span>;
  if (future)
    return <span style={bs('rgba(255,179,71,.12)','var(--warning)')}>⏳ Futura</span>;
  if (t.parcela)
    return <span style={bs('rgba(108,99,255,.15)','var(--accent)')}>🔄 Parcela</span>;
  return <span style={bs('rgba(255,77,109,.15)','var(--danger)')}>💳 Crédito</span>;
}

function bs(bg: string, color: string) {
  return { background: bg, color, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, display: 'inline-block', whiteSpace: 'nowrap' as const };
}

export function Lancamentos() {
  const { transactions, removeTransaction } = useFinanceStore();
  const [search, setSearch]           = useState('');
  const [filterData, setFilterData]   = useState('');
  const [filterFatura, setFilterFatura] = useState('');
  const [filterParcela, setFilterParcela] = useState('');
  const [filterTipo, setFilterTipo]   = useState('');
  const [filterCartao, setFilterCartao] = useState('');
  const [filterOpen, setFilterOpen]   = useState(false);
  const [sortCol, setSortCol]         = useState<string>('date');
  const [sortDir, setSortDir]         = useState<'asc'|'desc'>('desc');
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const months = useMemo(() =>
    [...new Set(transactions.map(t => toMonthKey(t.date)))].sort().reverse(), [transactions]);
  const faturaMonths = useMemo(() =>
    [...new Set(transactions.filter(t=>t.data_fatura).map(t => t.data_fatura!.slice(0,7)))].sort().reverse(), [transactions]);
  const cartaoList = useMemo(() =>
    [...new Set(transactions.filter(t=>t.cartao).map(t=>t.cartao!))].sort(), [transactions]);

  const activeFilters = [filterData, filterFatura, filterParcela, filterTipo, filterCartao].filter(Boolean).length;

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  const filtered = useMemo(() => {
    let rows = [...transactions];
    if (filterData)   rows = rows.filter(t => toMonthKey(t.date) === filterData);
    if (filterFatura) rows = rows.filter(t => t.data_fatura?.slice(0,7) === filterFatura);
    if (search)       rows = rows.filter(t => t.description.toLowerCase().includes(search.toLowerCase()));
    if (filterParcela === 'com') rows = rows.filter(t => !!t.parcela);
    if (filterParcela === 'sem') rows = rows.filter(t => !t.parcela);
    if (filterTipo === 'income')  rows = rows.filter(t => t.type === 'income');
    if (filterTipo === 'expense') rows = rows.filter(t => t.type === 'expense' && !t.parcela);
    if (filterTipo === 'parcela') rows = rows.filter(t => t.type === 'expense' && !!t.parcela);
    if (filterCartao)  rows = rows.filter(t => t.cartao === filterCartao);
    const m = sortDir === 'asc' ? 1 : -1;
    if (sortCol === 'date')        rows.sort((a,b) => m * a.date.localeCompare(b.date));
    if (sortCol === 'fatura')      rows.sort((a,b) => m * (a.data_fatura||'').localeCompare(b.data_fatura||''));
    if (sortCol === 'description') rows.sort((a,b) => m * a.description.localeCompare(b.description));
    if (sortCol === 'amount')      rows.sort((a,b) => m * (a.amount - b.amount));
    if (sortCol === 'parcela')     rows.sort((a,b) => m * (a.parcela||'').localeCompare(b.parcela||''));
    if (sortCol === 'cartao')      rows.sort((a,b) => m * (a.cartao||'').localeCompare(b.cartao||''));
    return rows;
  }, [transactions, filterData, filterFatura, search, filterParcela, filterTipo, filterCartao, sortCol, sortDir]);

  const allSelected = filtered.length > 0 && filtered.every(t => selected.has(t.id));

  const totalCreditos  = useMemo(() => filtered.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0), [filtered]);
  const totalPagamentos = useMemo(() => filtered.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0), [filtered]);
  const saldo = totalPagamentos - totalCreditos;

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(t => t.id)));
  }

  async function deleteSelected() {
    for (const id of selected) await removeTransaction(id);
    setSelected(new Set());
    setBulkConfirm(false);
  }

  function clearFilters() {
    setFilterData(''); setFilterFatura(''); setFilterParcela('');
    setFilterTipo(''); setFilterCartao('');
  }

  function Th({ col, label, align='left' }: { col: string; label: string; align?: string }) {
    const active = sortCol === col;
    return (
      <th onClick={() => handleSort(col)} style={{
        padding: '10px 12px', textAlign: align as 'left', cursor: 'pointer',
        fontSize: 11, textTransform: 'uppercase', letterSpacing: '.07em',
        color: active ? 'var(--accent)' : 'var(--muted)', fontWeight: 700,
        borderBottom: '1px solid var(--border)', userSelect: 'none', whiteSpace: 'nowrap',
      }}>
        {label} <span style={{ fontSize: 9, opacity: active ? 1 : 0.3 }}>{active ? (sortDir==='asc'?'▲':'▼') : '⇅'}</span>
      </th>
    );
  }

  const inp = { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px', borderRadius: 8, fontSize: 12, outline: 'none' };
  const sheetInp = { ...inp, width: '100%', padding: '10px 14px', fontSize: 14 };

  return (
    <div>
      {/* Search + mobile filter button */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
        <input style={{ ...inp, flex: 1, minWidth: 0 }} placeholder="🔍 Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="lancamentos-filter-btn" onClick={() => setFilterOpen(true)}>
          🔧 Filtros{activeFilters > 0 ? ` (${activeFilters})` : ''}
        </button>
      </div>

      {/* Desktop filter bar — hidden on mobile */}
      <div className="lancamentos-filters-bar" style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <select style={inp} value={filterData} onChange={e => setFilterData(e.target.value)}>
          <option value="">Todas as datas</option>
          {months.map(m => <option key={m} value={m}>{getMonthLabel(m)}</option>)}
        </select>
        <select style={inp} value={filterFatura} onChange={e => setFilterFatura(e.target.value)}>
          <option value="">Todas as faturas</option>
          {faturaMonths.map(m => <option key={m} value={m}>{getMonthLabel(m)}</option>)}
        </select>
        <select style={inp} value={filterCartao} onChange={e => setFilterCartao(e.target.value)}>
          <option value="">Todos os cartões</option>
          {cartaoList.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select style={inp} value={filterParcela} onChange={e => setFilterParcela(e.target.value)}>
          <option value="">Parcelas</option>
          <option value="com">Com parcela</option>
          <option value="sem">Sem parcela</option>
        </select>
        <select style={inp} value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="income">💚 Pagamento</option>
          <option value="expense">💳 Crédito</option>
          <option value="parcela">🔄 Parcela</option>
        </select>
        {activeFilters > 0 && (
          <button onClick={clearFilters} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
            ✕ Limpar
          </button>
        )}
      </div>

      {/* Totalizador */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
        {[
          { label: 'Créditos', value: totalCreditos, color: 'var(--danger)' },
          { label: 'Pagamentos', value: totalPagamentos, color: 'var(--success)' },
          { label: 'Saldo', value: Math.abs(saldo), color: saldo >= 0 ? 'var(--success)' : 'var(--danger)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color }}>{formatCurrency(value)}</div>
          </div>
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, background: 'rgba(255,77,109,.1)', border: '1px solid var(--danger)', borderRadius: 10, padding: '10px 14px' }}>
          <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>
            <strong>{selected.size}</strong> selecionado{selected.size !== 1 ? 's' : ''}
          </span>
          <button onClick={() => setSelected(new Set())} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12 }}>Cancelar</button>
          <button onClick={() => setBulkConfirm(true)} style={{ background: 'var(--danger)', border: 'none', color: '#fff', padding: '5px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>🗑 Excluir {selected.size}</button>
        </div>
      )}

      {/* Count */}
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
        {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
            <p>Nenhum dado. Importe um CSV ou adicione um lançamento.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 740 }}>
              <thead>
                <tr style={{ background: 'var(--surface2)' }}>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', width: 36 }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      style={{ cursor: 'pointer', width: 15, height: 15, accentColor: 'var(--accent)' }} />
                  </th>
                  <Th col="date" label="Compra / Fatura" />
                  <Th col="description" label="Lançamento" />
                  <Th col="cartao" label="Cartão" />
                  <Th col="parcela" label="Parcela" align="center" />
                  <Th col="amount" label="Valor" align="right" />
                  <th style={{ padding: '10px 12px', fontSize: 11, color: 'var(--muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Tipo</th>
                  <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', width: 36 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>Nenhum resultado para os filtros.</td></tr>
                ) : filtered.map((t) => {
                  const today = new Date().toISOString().slice(0,10);
                  const future = !!t.parcela && t.date > today;
                  const isSel = selected.has(t.id);
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', opacity: future ? .7 : 1, background: isSel ? 'rgba(108,99,255,.08)' : 'transparent' }}
                      onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'; }}
                      onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                      <td style={{ padding: '10px 12px' }}>
                        <input type="checkbox" checked={isSel} onChange={() => toggleOne(t.id)}
                          style={{ cursor: 'pointer', width: 15, height: 15, accentColor: 'var(--accent)' }} />
                      </td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        <div>{formatDate(t.date)}</div>
                        {t.data_fatura && (
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                            Fat: {t.data_fatura.slice(0,7).split('-').reverse().join('/')}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                      <td style={{ padding: '10px 12px', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: t.cartao ? 'var(--text)' : 'var(--border)' }}>{t.cartao || '—'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        {t.parcela
                          ? <span style={{ fontSize: 12, fontWeight: 700, color: future?'var(--warning)':'var(--accent)' }}>{t.parcela}</span>
                          : <span style={{ color: 'var(--border)' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: t.type==='income'?'var(--success)':'var(--danger)', whiteSpace: 'nowrap' }}>
                        {t.type==='income'?'−':''}{formatCurrency(t.amount)}
                      </td>
                      <td style={{ padding: '10px 12px' }}>{badge(t)}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => setDeleteTarget(t)} style={{
                          background: 'var(--surface2)', border: '1px solid var(--border)',
                          color: 'var(--muted)', padding: '4px 8px', borderRadius: 6,
                          fontSize: 12, cursor: 'pointer',
                        }}>🗑</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Single delete modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setDeleteTarget(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28, width: '100%', maxWidth: 380, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ marginBottom: 8 }}>Excluir lançamento?</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              <strong style={{ color: 'var(--text)' }}>{deleteTarget.description}</strong><br/>Esta ação não poderá ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
              <button onClick={() => { removeTransaction(deleteTarget.id); setDeleteTarget(null); }}
                style={{ background: 'var(--danger)', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>🗑 Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile filter bottom sheet */}
      {filterOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setFilterOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 520, padding: '24px 20px 32px', maxHeight: '82vh', overflowY: 'auto' }}>
            <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 16px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Filtros</h3>
              <button onClick={clearFilters} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Limpar tudo</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Mês', value: filterData, set: setFilterData, opts: months.map(m => ({ v: m, l: getMonthLabel(m) })), ph: 'Todos os meses' },
                { label: 'Fatura', value: filterFatura, set: setFilterFatura, opts: faturaMonths.map(m => ({ v: m, l: getMonthLabel(m) })), ph: 'Todas as faturas' },
                { label: 'Cartão', value: filterCartao, set: setFilterCartao, opts: cartaoList.map(c => ({ v: c, l: c })), ph: 'Todos os cartões' },
                { label: 'Parcelas', value: filterParcela, set: setFilterParcela, opts: [{ v: 'com', l: 'Com parcela' }, { v: 'sem', l: 'Sem parcela' }], ph: 'Todas' },
                { label: 'Tipo', value: filterTipo, set: setFilterTipo, opts: [{ v: 'income', l: '💚 Pagamento' }, { v: 'expense', l: '💳 Crédito' }, { v: 'parcela', l: '🔄 Parcela' }], ph: 'Todos os tipos' },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <select style={sheetInp} value={f.value} onChange={e => f.set(e.target.value)}>
                    <option value="">{f.ph}</option>
                    {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <button onClick={() => setFilterOpen(false)} style={{ background: 'var(--accent)', border: 'none', color: '#fff', padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 24, width: '100%' }}>
              Ver {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* Bulk delete modal */}
      {bulkConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setBulkConfirm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28, width: '100%', maxWidth: 380, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ marginBottom: 8 }}>Excluir {selected.size} lançamentos?</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Esta ação não poderá ser desfeita.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setBulkConfirm(false)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
              <button onClick={deleteSelected} style={{ background: 'var(--danger)', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>🗑 Excluir tudo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
