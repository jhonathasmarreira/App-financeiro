import { useState, useMemo } from 'react';
import { useCartaoStore } from '../store/useCartaoStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatCurrency } from '../utils/format';
import type { Cartao } from '../types';

const card  = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 };
const inp   = { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, padding: '9px 12px', fontSize: 14, outline: 'none', flex: 1 as const };

function useCartaoStats(cartoes: Cartao[], transactions: ReturnType<typeof useFinanceStore.getState>['transactions']) {
  return useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    cartoes.forEach(c => { map[c.nome] = { count: 0, total: 0 }; });
    transactions
      .filter(t => t.type === 'expense' && t.cartao)
      .forEach(t => {
        if (!map[t.cartao!]) map[t.cartao!] = { count: 0, total: 0 };
        map[t.cartao!].count++;
        map[t.cartao!].total += t.amount;
      });
    return map;
  }, [cartoes, transactions]);
}

export function Cartoes() {
  const { cartoes, addCartao, updateCartao, removeCartao } = useCartaoStore();
  const transactions = useFinanceStore(s => s.transactions);
  const stats = useCartaoStats(cartoes, transactions);

  const [adding, setAdding]       = useState(false);
  const [novoNome, setNovoNome]   = useState('');
  const [editId, setEditId]       = useState<string | null>(null);
  const [editNome, setEditNome]   = useState('');
  const [deleteErr, setDeleteErr] = useState('');

  function hasTransactions(nome: string) {
    return transactions.some(t => t.cartao === nome);
  }

  async function handleAdd() {
    const nome = novoNome.trim();
    if (!nome) return;
    await addCartao(nome);
    setNovoNome('');
    setAdding(false);
  }

  async function handleUpdate() {
    const nome = editNome.trim();
    if (!nome || !editId) return;
    await updateCartao(editId, nome);
    setEditId(null);
  }

  async function handleRemove(c: Cartao) {
    if (hasTransactions(c.nome)) {
      setDeleteErr(`"${c.nome}" possui lançamentos vinculados e não pode ser excluído.`);
      return;
    }
    await removeCartao(c.id);
  }

  const btnPrimary = (label: string, onClick: () => void, disabled = false) => (
    <button onClick={onClick} disabled={disabled}
      style={{ background: 'var(--accent)', border: 'none', color: '#fff', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .6 : 1, whiteSpace: 'nowrap' as const }}>
      {label}
    </button>
  );

  const btnSecondary = (label: string, onClick: () => void) => (
    <button onClick={onClick}
      style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '9px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={card}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Meus Cartões</div>
          {!adding && (
            <button onClick={() => setAdding(true)}
              style={{ background: 'var(--accent)', border: 'none', color: '#fff', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              + Novo Cartão
            </button>
          )}
        </div>

        {/* Formulário de adição */}
        {adding && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input style={inp} autoFocus placeholder="Nome do cartão" value={novoNome}
              onChange={e => setNovoNome(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setAdding(false); setNovoNome(''); } }} />
            {btnPrimary('Salvar', handleAdd)}
            {btnSecondary('✕', () => { setAdding(false); setNovoNome(''); })}
          </div>
        )}

        {/* Erro de exclusão */}
        {deleteErr && (
          <div style={{ marginBottom: 14, background: 'rgba(255,77,109,.12)', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ {deleteErr}</span>
            <button onClick={() => setDeleteErr('')} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>✕</button>
          </div>
        )}

        {/* Lista de cartões */}
        {cartoes.length === 0 && !adding ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>💳</div>
            <p style={{ fontSize: 13 }}>Nenhum cartão cadastrado. Clique em "+ Novo Cartão" para começar.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cartoes.map(c => {
              const s = stats[c.nome] ?? { count: 0, total: 0 };
              const locked = hasTransactions(c.nome);

              return (
                <div key={c.id} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                  {editId === c.id ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input style={inp} autoFocus value={editNome}
                        onChange={e => setEditNome(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleUpdate(); if (e.key === 'Escape') setEditId(null); }} />
                      {btnPrimary('Salvar', handleUpdate)}
                      {btnSecondary('✕', () => setEditId(null))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>💳 {c.nome}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                          {s.count > 0
                            ? `${s.count} lançamento${s.count !== 1 ? 's' : ''} · ${formatCurrency(s.total)}`
                            : 'Sem lançamentos'}
                        </div>
                      </div>

                      <button onClick={() => { setEditId(c.id); setEditNome(c.nome); }}
                        style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '5px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>
                        ✏️ Editar
                      </button>

                      <button onClick={() => handleRemove(c)} disabled={locked}
                        title={locked ? 'Possui lançamentos — não pode excluir' : 'Excluir cartão'}
                        style={{
                          background: locked ? 'transparent' : 'rgba(255,77,109,.1)',
                          border: `1px solid ${locked ? 'var(--border)' : 'var(--danger)'}`,
                          color: locked ? 'var(--border)' : 'var(--danger)',
                          padding: '5px 12px', borderRadius: 7, fontSize: 12,
                          cursor: locked ? 'not-allowed' : 'pointer',
                        }}>
                        {locked ? '🔒 Em uso' : '🗑 Excluir'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
