import { useMemo, useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatCurrency, formatDate } from '../utils/format';

const COLORS = ['#6c63ff','#ff6584','#43d9ad','#ffb347','#4fc3f7','#ce93d8','#a5d6a7','#ef9a9a','#80cbc4','#ffe082'];

interface ParcelaGroup {
  key: string;
  base: string;
  total: number;
  amount: number;
  paid: { date: string; parcela: string }[];
  remaining: { date: string; parcela: string }[];
  pct: number;
  totalPaid: number;
  totalRemaining: number;
  totalGeral: number;
  nextDate?: string;
  nextParcela?: string;
  done: boolean;
}

export function Parcelas() {
  const transactions = useFinanceStore(s => s.transactions);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState<'card'|'table'>('card');

  const today = new Date().toISOString().slice(0,10);

  const groups = useMemo((): ParcelaGroup[] => {
    const parcelas = transactions.filter(t => t.type === 'expense' && t.parcela);
    const map = new Map<string, ParcelaGroup>();

    for (const t of parcelas) {
      const m = t.parcela!.match(/^(\d+)\/(\d+)$/);
      if (!m) continue;
      const tot = parseInt(m[2]);
      const base = t.description.replace(/\s*\d{1,2}\/\d{1,2}\s*$/, '').trim();
      const key = `${base}||${tot}||${t.amount}`;

      if (!map.has(key)) {
        map.set(key, { key, base, total: tot, amount: t.amount, paid: [], remaining: [], pct: 0, totalPaid: 0, totalRemaining: 0, totalGeral: t.amount * tot, done: false });
      }
      const g = map.get(key)!;
      if (t.date <= today) g.paid.push({ date: t.date, parcela: t.parcela! });
      else g.remaining.push({ date: t.date, parcela: t.parcela! });
    }

    return Array.from(map.values()).map(g => {
      const rem = [...g.remaining].sort((a,b) => a.date.localeCompare(b.date));
      return {
        ...g,
        pct: Math.round(g.paid.length / g.total * 100),
        totalPaid: g.paid.length * g.amount,
        totalRemaining: g.remaining.length * g.amount,
        nextDate: rem[0]?.date,
        nextParcela: rem[0]?.parcela,
        done: g.remaining.length === 0,
      };
    });
  }, [transactions, today]);

  const filtered = useMemo(() => {
    let list = [...groups];
    if (search) list = list.filter(g => g.base.toLowerCase().includes(search.toLowerCase()));
    if (status === 'andamento') list = list.filter(g => !g.done);
    if (status === 'quitada') list = list.filter(g => g.done);
    return list.sort((a,b) => b.totalRemaining - a.totalRemaining);
  }, [groups, search, status]);

  const totalRest  = filtered.reduce((s,g) => s + g.totalRemaining, 0);
  const totalPago  = filtered.reduce((s,g) => s + g.totalPaid, 0);
  const emAndamento = filtered.filter(g => !g.done).length;
  const quitadas   = filtered.filter(g => g.done).length;

  const chip = (label: string, value: string, color?: string) => (
    <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'6px 14px', fontSize:12, display:'flex', gap:6, alignItems:'center' }}>
      {label} <strong style={{ color: color || 'var(--text)', fontSize: 13 }}>{value}</strong>
    </div>
  );

  const inp = { background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text)', padding:'6px 10px', borderRadius:8, fontSize:12, outline:'none' };
  const btnView = (v: 'card'|'table', label: string) => (
    <button onClick={() => setView(v)} style={{
      background: view===v ? 'var(--accent)' : 'var(--surface2)',
      border: `1px solid ${view===v ? 'var(--accent)' : 'var(--border)'}`,
      color: view===v ? '#fff' : 'var(--muted)',
      padding: '5px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', transition: '.18s',
    }}>{label}</button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filters */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 20px' }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <input style={{ ...inp, flex:1, minWidth:180, maxWidth:280 }} placeholder="🔍 Buscar pelo nome..." value={search} onChange={e=>setSearch(e.target.value)} />
          <select style={inp} value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="andamento">Em andamento</option>
            <option value="quitada">Quitadas</option>
          </select>
          <div style={{ display:'flex', gap:6, marginLeft:'auto' }}>
            {btnView('card','⊞ Cards')}
            {btnView('table','☰ Tabela')}
          </div>
        </div>
        <div style={{ display:'flex', gap:12, marginTop:12, flexWrap:'wrap' }}>
          {chip('📦 Total encontrado:', String(filtered.length))}
          {chip('⏳ Em andamento:', String(emAndamento))}
          {chip('✅ Quitadas:', String(quitadas))}
          {chip('💳 Já pago:', formatCurrency(totalPago), 'var(--success)')}
          {chip('⚠️ Ainda deve:', formatCurrency(totalRest), 'var(--warning)')}
        </div>
      </div>

      {/* Content */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:20 }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>Compras Parceladas ({filtered.length})</div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'50px 20px', color:'var(--muted)' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🔄</div>
            <p>Nenhuma parcela encontrada.</p>
          </div>
        ) : view === 'card' ? (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map((g, i) => {
              const cor = COLORS[i % COLORS.length];
              const remSorted = [...g.remaining].sort((a,b) => a.date.localeCompare(b.date));
              return (
                <div key={g.key} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 18px', display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:cor, flexShrink:0 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13.5, fontWeight:600 }}>{g.base}</div>
                      <div style={{ fontSize:11, color:'var(--muted)', marginTop:4, display:'flex', gap:16, flexWrap:'wrap' }}>
                        <span>💰 {formatCurrency(g.amount)}/parcela</span>
                        <span style={{ color:'var(--success)' }}>✅ {g.paid.length} paga{g.paid.length!==1?'s':''} ({formatCurrency(g.totalPaid)})</span>
                        <span style={{ color:'var(--warning)' }}>⏳ {g.remaining.length} restante{g.remaining.length!==1?'s':''} ({formatCurrency(g.totalRemaining)})</span>
                        {g.nextDate ? <span style={{ color:'var(--muted)' }}>Próxima: {formatDate(g.nextDate)}</span> : <span style={{ color:'var(--success)' }}>Quitada!</span>}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
                        <div style={{ flex:1, background:'var(--border)', borderRadius:999, height:6, overflow:'hidden' }}>
                          <div style={{ height:'100%', borderRadius:999, background:cor, width:`${g.pct}%` }} />
                        </div>
                        <span style={{ fontSize:11, color:'var(--muted)', whiteSpace:'nowrap' }}>{g.paid.length}/{g.total} ({g.pct}%)</span>
                      </div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ color:'var(--danger)', fontWeight:800, fontSize:13 }}>{formatCurrency(g.totalGeral)}</div>
                      <div style={{ fontSize:10, color:'var(--muted)' }}>total</div>
                    </div>
                  </div>
                  {remSorted.length > 0 ? (
                    <div style={{ borderTop:'1px solid var(--border)', paddingTop:8 }}>
                      <div style={{ fontSize:11, color:'var(--muted)', marginBottom:6, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>Parcelas restantes</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {remSorted.map(x => (
                          <span key={x.date} style={{ background:'rgba(255,179,71,.12)', border:'1px solid rgba(255,179,71,.25)', color:'var(--warning)', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:6 }}>
                            {x.parcela} · {formatDate(x.date)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ borderTop:'1px solid var(--border)', paddingTop:8, textAlign:'center' }}>
                      <span style={{ background:'rgba(67,217,173,.15)', color:'var(--success)', border:'1px solid rgba(67,217,173,.3)', padding:'2px 10px', borderRadius:6, fontSize:11, fontWeight:700 }}>✅ Quitada!</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ overflowX:'auto', border:'1px solid var(--border)', borderRadius:8 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'var(--surface2)' }}>
                  {['Nome','Parcelas','Pagas','Restantes','Progresso','Valor/Parc','Já Pago','Restante','Total','Próxima','Status'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', fontSize:11, color:'var(--muted)', fontWeight:700, textTransform:'uppercase', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((g, i) => {
                  const cor = COLORS[i % COLORS.length];
                  const pct = Math.min(g.pct, 100);
                  return (
                    <tr key={g.key} style={{ borderBottom:'1px solid var(--border)' }}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(108,99,255,.06)'}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                      <td style={{ padding:'10px 14px', fontWeight:600 }}>
                        <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:cor, marginRight:8 }} />
                        {g.base}
                      </td>
                      <td style={{ padding:'10px 14px', textAlign:'center', fontWeight:700 }}>{g.total}</td>
                      <td style={{ padding:'10px 14px', textAlign:'center', color:'var(--success)' }}>{g.paid.length}</td>
                      <td style={{ padding:'10px 14px', textAlign:'center', color:'var(--warning)' }}>{g.remaining.length}</td>
                      <td style={{ padding:'10px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:70, height:6, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
                            <div style={{ height:'100%', background:cor, width:`${pct}%`, borderRadius:4 }} />
                          </div>
                          <span style={{ fontSize:11, color:'var(--muted)' }}>{g.pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding:'10px 14px', textAlign:'right' }}>{formatCurrency(g.amount)}</td>
                      <td style={{ padding:'10px 14px', textAlign:'right', color:'var(--success)', fontWeight:600 }}>{formatCurrency(g.totalPaid)}</td>
                      <td style={{ padding:'10px 14px', textAlign:'right', color:'var(--warning)', fontWeight:700 }}>{formatCurrency(g.totalRemaining)}</td>
                      <td style={{ padding:'10px 14px', textAlign:'right', color:'var(--muted)' }}>{formatCurrency(g.totalGeral)}</td>
                      <td style={{ padding:'10px 14px', textAlign:'center', fontSize:12 }}>
                        {g.nextDate ? <>{g.nextParcela}<br/><span style={{ color:'var(--muted)' }}>{formatDate(g.nextDate)}</span></> : '—'}
                      </td>
                      <td style={{ padding:'10px 14px', textAlign:'center' }}>
                        {g.done
                          ? <span style={{ background:'rgba(67,217,173,.15)',color:'var(--success)',border:'1px solid rgba(67,217,173,.3)',padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:700 }}>✅ Quitada</span>
                          : <span style={{ background:'rgba(255,179,71,.12)',color:'var(--warning)',border:'1px solid rgba(255,179,71,.25)',padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:700 }}>⏳ Andamento</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
