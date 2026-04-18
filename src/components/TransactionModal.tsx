import { useState, useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../types';
import type { Transaction, TransactionType, Category } from '../types';

interface Props {
  onClose: () => void;
  editing?: Transaction;
}

const inp: React.CSSProperties = {
  width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
  color: 'var(--text)', borderRadius: 10, padding: '10px 14px',
  fontSize: 14, outline: 'none',
};
const lbl: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: 'var(--muted)',
  textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6, display: 'block',
};

export function TransactionModal({ onClose, editing }: Props) {
  const addTransaction    = useFinanceStore(s => s.addTransaction);
  const updateTransaction = useFinanceStore(s => s.updateTransaction);

  const today = new Date().toISOString().slice(0, 10);
  const [type, setType]             = useState<TransactionType>(editing?.type ?? 'expense');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [amount, setAmount]         = useState(editing ? String(editing.amount) : '');
  const [category, setCategory]     = useState<Category>(editing?.category ?? 'Outros (Despesa)');
  const [date, setDate]             = useState(editing?.date ?? today);
  const [errors, setErrors]         = useState<Record<string, string>>({});

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    if (!categories.includes(category)) setCategory(categories[0]);
  }, [type]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!description.trim()) errs.description = 'Informe uma descrição.';
    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val) || val <= 0) errs.amount = 'Informe um valor válido.';
    if (!date) errs.date = 'Informe a data.';
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const val = parseFloat(amount.replace(',', '.'));
    if (editing) {
      updateTransaction(editing.id, { type, description: description.trim(), amount: val, category, date });
    } else {
      addTransaction({ type, description: description.trim(), amount: val, category, date });
    }
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)', display: 'flex',
        alignItems: 'flex-end', justifyContent: 'center', zIndex: 200,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 520,
        padding: '24px 20px 32px', maxHeight: '92vh', overflowY: 'auto',
      }}>
        {/* Handle bar */}
        <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>{editing ? 'Editar transação' : 'Nova transação'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 20, padding: 4 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Type toggle */}
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <button type="button" onClick={() => setType('income')} style={{
              flex: 1, padding: '10px 0', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: type === 'income' ? 'var(--success)' : 'transparent',
              color: type === 'income' ? '#fff' : 'var(--muted)', transition: 'all .2s',
            }}>Receita</button>
            <button type="button" onClick={() => setType('expense')} style={{
              flex: 1, padding: '10px 0', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: type === 'expense' ? 'var(--danger)' : 'transparent',
              color: type === 'expense' ? '#fff' : 'var(--muted)', transition: 'all .2s',
            }}>Despesa</button>
          </div>

          <div>
            <label style={lbl}>Descrição</label>
            <input style={inp} type="text" value={description}
              onChange={e => setDescription(e.target.value)} placeholder="Ex: Salário, Aluguel..." />
            {errors.description && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.description}</p>}
          </div>

          <div>
            <label style={lbl}>Valor (R$)</label>
            <input style={inp} type="number" min="0.01" step="0.01" value={amount}
              onChange={e => setAmount(e.target.value)} placeholder="0,00" />
            {errors.amount && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.amount}</p>}
          </div>

          <div>
            <label style={lbl}>Categoria</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={category}
              onChange={e => setCategory(e.target.value as Category)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={lbl}>Data</label>
            <input style={inp} type="date" value={date} onChange={e => setDate(e.target.value)} />
            {errors.date && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.date}</p>}
          </div>

          <button type="submit" style={{
            background: 'var(--accent)', border: 'none', color: '#fff',
            padding: '12px', borderRadius: 10, fontSize: 15, fontWeight: 700,
            cursor: 'pointer', marginTop: 4,
          }}>
            {editing ? 'Salvar alterações' : 'Adicionar transação'}
          </button>
        </form>
      </div>
    </div>
  );
}
