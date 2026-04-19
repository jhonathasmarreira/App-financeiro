import { useState, useEffect, useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useCartaoStore } from '../store/useCartaoStore';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../types';
import type { Transaction, TransactionType, Category, Page } from '../types';

interface Props {
  onClose: () => void;
  editing?: Transaction;
  duplicating?: Transaction;
  onNavigate?: (p: Page) => void;
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

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function TransactionModal({ onClose, editing, duplicating, onNavigate }: Props) {
  const addTransaction    = useFinanceStore(s => s.addTransaction);
  const addTransactions   = useFinanceStore(s => s.addTransactions);
  const updateTransaction = useFinanceStore(s => s.updateTransaction);
  const transactions      = useFinanceStore(s => s.transactions);
  const cartoes           = useCartaoStore(s => s.cartoes);

  const source = editing ?? duplicating;
  const today  = new Date().toISOString().slice(0, 10);

  const [type, setType]         = useState<TransactionType>(source?.type ?? 'expense');
  const [description, setDesc]  = useState(source?.description ?? '');
  const [amount, setAmount]     = useState(source ? String(source.amount) : '');
  const [category, setCategory] = useState<Category>(source?.category ?? 'Outros (Despesa)');
  const [date, setDate]         = useState(source?.date ?? today);
  const [cartao, setCartao]     = useState(source?.cartao ?? '');
  const [errors, setErrors]     = useState<Record<string, string>>({});

  // Parcelado — somente criação nova
  const [parcelado, setParcelado]     = useState(false);
  const [totalAmount, setTotalAmount] = useState('');
  const [numParcelas, setNumParcelas] = useState('2');

  // Editar série de parcelas
  const [editMode, setEditMode] = useState<'single' | 'series'>('single');

  const isNew  = !editing && !duplicating;
  const isDup  = !!duplicating;
  const isEdit = !!editing;

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Siblings da mesma série (somente ao editar com parcela)
  const seriesSiblings = useMemo(() => {
    if (!editing?.parcela) return [];
    const total = editing.parcela.split('/')[1];
    return transactions.filter(t =>
      t.id !== editing.id &&
      t.description === editing.description &&
      (t.cartao ?? '') === (editing.cartao ?? '') &&
      t.parcela?.split('/')[1] === total
    );
  }, [editing, transactions]);

  useEffect(() => {
    if (!categories.includes(category)) setCategory(categories[0]);
  }, [type]);

  useEffect(() => {
    if (type !== 'expense') setParcelado(false);
  }, [type]);

  const n = Math.max(2, parseInt(numParcelas) || 2);
  const tot = parseFloat(totalAmount.replace(',', '.')) || 0;
  const valorParcela = parcelado && tot > 0 ? tot / n : 0;

  const sameDateAsDup = isDup && date === duplicating!.date;

  function validate() {
    const errs: Record<string, string> = {};
    if (!description.trim()) errs.description = 'Informe uma descrição.';
    if (parcelado) {
      if (isNaN(tot) || tot <= 0) errs.totalAmount = 'Informe o valor total.';
      if (isNaN(n) || n < 2)      errs.numParcelas = 'Mínimo 2 parcelas.';
    } else {
      const val = parseFloat(amount.replace(',', '.'));
      if (isNaN(val) || val <= 0) errs.amount = 'Informe um valor válido.';
    }
    if (!date) errs.date = 'Informe a data.';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const val      = parseFloat(amount.replace(',', '.'));
    const cartaoFinal = type === 'expense' ? cartao.trim() : '';

    if (isEdit) {
      await updateTransaction(editing!.id, {
        type, description: description.trim(), amount: val,
        category, date, cartao: cartaoFinal,
        parcela: editing!.parcela ?? '',
        data_fatura: editing!.data_fatura ?? '',
      });
      if (editMode === 'series' && seriesSiblings.length > 0) {
        for (const t of seriesSiblings) {
          await updateTransaction(t.id, {
            type, description: description.trim(), amount: val,
            category, cartao: cartaoFinal,
            date: t.date, parcela: t.parcela ?? '',
            data_fatura: t.data_fatura ?? '',
          });
        }
      }
    } else if (isDup) {
      await addTransaction({
        type, description: description.trim(), amount: val,
        category, date, cartao: cartaoFinal,
        parcela: duplicating!.parcela ?? '',
        data_fatura: duplicating!.data_fatura ?? '',
      });
    } else if (parcelado) {
      const baseVal = Math.round((tot / n) * 100) / 100;
      const items = Array.from({ length: n }, (_, i) => ({
        type: 'expense' as TransactionType,
        description: description.trim(),
        amount: i === n - 1
          ? Math.round((tot - baseVal * (n - 1)) * 100) / 100
          : baseVal,
        category,
        date: addMonths(date, i),
        cartao: cartaoFinal,
        parcela: `${String(i + 1).padStart(2, '0')}/${String(n).padStart(2, '0')}`,
      }));
      await addTransactions(items);
    } else {
      await addTransaction({
        type, description: description.trim(), amount: val,
        category, date, cartao: cartaoFinal, parcela: '',
      });
    }

    onClose();
  }

  const title = isEdit ? 'Editar transação' : isDup ? 'Duplicar lançamento' : 'Nova transação';
  const submitLabel = isEdit
    ? (editMode === 'series' && seriesSiblings.length > 0
        ? `Salvar ${seriesSiblings.length + 1} parcelas`
        : 'Salvar alterações')
    : isDup
      ? 'Duplicar'
      : parcelado
        ? `Criar ${n} parcelas`
        : 'Adicionar transação';

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
        <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 20, padding: 4 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Tipo */}
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

          {/* Descrição */}
          <div>
            <label style={lbl}>Descrição</label>
            <input style={inp} type="text" value={description}
              onChange={e => setDesc(e.target.value)} placeholder="Ex: Salário, Aluguel..." />
            {errors.description && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.description}</p>}
          </div>

          {/* Toggle parcelado — somente nova despesa */}
          {isNew && type === 'expense' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button type="button" onClick={() => setParcelado(p => !p)} style={{
                background: parcelado ? 'rgba(108,99,255,.15)' : 'var(--surface2)',
                border: `1px solid ${parcelado ? 'var(--accent)' : 'var(--border)'}`,
                color: parcelado ? 'var(--accent)' : 'var(--muted)',
                padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                🔄 Compra parcelada
              </button>
              {parcelado && (
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>preencha total + nº de parcelas</span>
              )}
            </div>
          )}

          {/* Valor — simples ou parcelado */}
          {!parcelado ? (
            <div>
              <label style={lbl}>Valor (R$)</label>
              <input style={inp} type="number" min="0.01" step="0.01" value={amount}
                onChange={e => setAmount(e.target.value)} placeholder="0,00" />
              {errors.amount && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.amount}</p>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Valor total (R$)</label>
                  <input style={inp} type="number" min="0.01" step="0.01" value={totalAmount}
                    onChange={e => setTotalAmount(e.target.value)} placeholder="0,00" />
                  {errors.totalAmount && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.totalAmount}</p>}
                </div>
                <div style={{ width: 110 }}>
                  <label style={lbl}>Parcelas</label>
                  <input style={inp} type="number" min="2" max="60" step="1" value={numParcelas}
                    onChange={e => setNumParcelas(e.target.value)} placeholder="12" />
                  {errors.numParcelas && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.numParcelas}</p>}
                </div>
              </div>
              {valorParcela > 0 && (
                <div style={{ background: 'rgba(108,99,255,.08)', border: '1px solid var(--accent)', borderRadius: 8, padding: '8px 14px', fontSize: 13 }}>
                  <span style={{ color: 'var(--muted)' }}>{n}× de </span>
                  <strong style={{ color: 'var(--accent)' }}>
                    R$ {valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}> — 1ª parcela em {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          )}

          {/* Categoria */}
          <div>
            <label style={lbl}>Categoria</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={category}
              onChange={e => setCategory(e.target.value as Category)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Data */}
          <div>
            <label style={lbl}>{parcelado ? 'Data da 1ª parcela' : 'Data'}</label>
            <input style={inp} type="date" value={date} onChange={e => setDate(e.target.value)} />
            {errors.date && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.date}</p>}
            {/* Aviso de data duplicada */}
            {sameDateAsDup && (
              <div style={{ marginTop: 6, background: 'rgba(255,179,71,.12)', border: '1px solid var(--warning)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--warning)' }}>
                ⚠️ A data é igual à do lançamento original. Altere para uma data diferente ou confirme mesmo assim.
              </div>
            )}
          </div>

          {/* Cartão — somente despesas */}
          {type === 'expense' && (
            <div>
              <label style={lbl}>Cartão (opcional)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={cartao} onChange={e => setCartao(e.target.value)}
                  style={{ ...inp, color: cartao ? 'var(--text)' : 'var(--muted)', cursor: 'pointer', flex: 1 }}>
                  <option value="">Sem cartão</option>
                  {cartoes.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                </select>
                {onNavigate && (
                  <button type="button" onClick={() => { onClose(); onNavigate('cartoes'); }}
                    title="Gerenciar cartões"
                    style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--accent)', padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    + Cartões
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Opção de editar série — somente ao editar parcela */}
          {isEdit && editing!.parcela && (
            <div style={{ background: 'rgba(108,99,255,.06)', border: '1px solid var(--accent)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>
                🔄 Parcela {editing!.parcela} — série detectada
              </div>
              {(['single', 'series'] as const).map(m => (
                <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                  <input type="radio" name="editMode" value={m} checked={editMode === m}
                    onChange={() => setEditMode(m)} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
                  <span>
                    {m === 'single'
                      ? `Salvar só esta parcela (${editing!.parcela})`
                      : seriesSiblings.length > 0
                        ? `Salvar todas as parcelas da série (${seriesSiblings.length + 1} no total)`
                        : 'Salvar todas as parcelas da série'}
                  </span>
                </label>
              ))}
              {editMode === 'series' && seriesSiblings.length > 0 && (
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  Descrição, valor, categoria e cartão serão atualizados em todas. As datas de cada parcela são mantidas.
                </p>
              )}
            </div>
          )}

          <button type="submit" style={{
            background: 'var(--accent)', border: 'none', color: '#fff',
            padding: '12px', borderRadius: 10, fontSize: 15, fontWeight: 700,
            cursor: 'pointer', marginTop: 4,
          }}>
            {submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
