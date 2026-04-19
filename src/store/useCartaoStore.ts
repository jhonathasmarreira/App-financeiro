import { create } from 'zustand';
import { supabase, createAuthClient } from '../lib/supabase';
import { v4 as uuidv4 } from '../utils/uuid';
import type { Cartao } from '../types';

let _client = supabase;

interface CartaoState {
  cartoes: Cartao[];
  userId: string | null;
  setToken: (token: string) => void;
  loadCartoes: (userId: string) => Promise<void>;
  addCartao: (nome: string) => Promise<void>;
  updateCartao: (id: string, nome: string) => Promise<void>;
  removeCartao: (id: string) => Promise<{ error?: string }>;
}

export const useCartaoStore = create<CartaoState>()((set, get) => ({
  cartoes: [],
  userId: null,

  setToken: (token) => { _client = createAuthClient(token); },

  loadCartoes: async (userId) => {
    set({ userId });
    const { data, error } = await _client
      .from('cartoes').select('*')
      .eq('user_id', userId).order('nome');
    if (error) { console.error('Erro ao carregar cartões:', error.message); return; }
    set({ cartoes: (data ?? []).map(r => ({ id: r.id, nome: r.nome, createdAt: r.created_at })) });
  },

  addCartao: async (nome) => {
    const { userId } = get();
    if (!userId) return;
    const id = uuidv4();
    const novo: Cartao = { id, nome: nome.trim(), createdAt: new Date().toISOString() };
    set(s => ({ cartoes: [...s.cartoes, novo].sort((a, b) => a.nome.localeCompare(b.nome)) }));
    const { error } = await _client.from('cartoes').insert({ id, user_id: userId, nome: nome.trim() });
    if (error) {
      console.error('Erro ao salvar cartão:', error.message);
      set(s => ({ cartoes: s.cartoes.filter(c => c.id !== id) }));
    }
  },

  updateCartao: async (id, nome) => {
    const prev = get().cartoes;
    set(s => ({ cartoes: s.cartoes.map(c => c.id === id ? { ...c, nome: nome.trim() } : c).sort((a, b) => a.nome.localeCompare(b.nome)) }));
    const { error } = await _client.from('cartoes').update({ nome: nome.trim() }).eq('id', id);
    if (error) { console.error('Erro ao atualizar cartão:', error.message); set({ cartoes: prev }); }
  },

  removeCartao: async (id) => {
    const prev = get().cartoes;
    set(s => ({ cartoes: s.cartoes.filter(c => c.id !== id) }));
    const { error } = await _client.from('cartoes').delete().eq('id', id);
    if (error) {
      console.error('Erro ao remover cartão:', error.message);
      set({ cartoes: prev });
      return { error: error.message };
    }
    return {};
  },
}));
