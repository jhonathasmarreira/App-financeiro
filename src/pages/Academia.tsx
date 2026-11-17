import { useEffect, useState } from 'react';

type Barra = 'grande' | 'pequena';

interface Exercicio {
  id: string;          // pasta no free-exercise-db
  nome: string;
  barra: Barra;
  series: number;
  reps: string;
  descanso: string;
  dica: string;
}

interface Treino {
  key: string;
  label: string;
  icon: string;
  foco: string;
  exercicios: Exercicio[];
}

const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

const TREINOS: Treino[] = [
  {
    key: 'peito', label: 'Peito', icon: '🏋️', foco: 'Peitoral + tríceps',
    exercicios: [
      { id: 'Barbell_Bench_Press_-_Medium_Grip', nome: 'Supino reto', barra: 'grande', series: 4, reps: '8–10', descanso: '90s', dica: 'Desça a barra até a linha do mamilo, escápulas retraídas.' },
      { id: 'Barbell_Incline_Bench_Press_-_Medium_Grip', nome: 'Supino inclinado', barra: 'grande', series: 4, reps: '8–10', descanso: '90s', dica: 'Banco entre 30° e 45°, barra desce na parte alta do peito.' },
      { id: 'Decline_Barbell_Bench_Press', nome: 'Supino declinado', barra: 'grande', series: 3, reps: '10', descanso: '75s', dica: 'Pés bem presos, desça a barra na parte baixa do peito.' },
      { id: 'Bent-Arm_Barbell_Pullover', nome: 'Pullover com barra', barra: 'pequena', series: 3, reps: '12', descanso: '60s', dica: 'Cotovelos levemente flexionados, alongue bem o peitoral.' },
      { id: 'Close-Grip_EZ-Bar_Press', nome: 'Supino fechado', barra: 'pequena', series: 3, reps: '10', descanso: '60s', dica: 'Pegada na largura dos ombros, cotovelos junto ao corpo.' },
      { id: 'EZ-Bar_Skullcrusher', nome: 'Tríceps testa', barra: 'pequena', series: 3, reps: '12', descanso: '60s', dica: 'Só o antebraço se move; cotovelos apontando para o teto.' },
    ],
  },
  {
    key: 'costas', label: 'Costas', icon: '💪', foco: 'Dorsais + bíceps',
    exercicios: [
      { id: 'Barbell_Deadlift', nome: 'Levantamento terra', barra: 'grande', series: 4, reps: '6–8', descanso: '120s', dica: 'Coluna neutra, barra colada nas pernas o tempo todo.' },
      { id: 'Bent_Over_Barbell_Row', nome: 'Remada curvada pronada', barra: 'grande', series: 4, reps: '8–10', descanso: '90s', dica: 'Tronco a ~45°, puxe a barra em direção ao umbigo.' },
      { id: 'Reverse_Grip_Bent-Over_Rows', nome: 'Remada curvada supinada', barra: 'grande', series: 3, reps: '10', descanso: '75s', dica: 'Pegada supinada ativa mais a dorsal baixa e o bíceps.' },
      { id: 'Bent_Over_Two-Arm_Long_Bar_Row', nome: 'Remada cavalinho (barra T)', barra: 'grande', series: 3, reps: '10', descanso: '75s', dica: 'Ponta da barra no canto da parede, junte as escápulas no topo.' },
      { id: 'EZ-Bar_Curl', nome: 'Rosca direta', barra: 'pequena', series: 3, reps: '12', descanso: '60s', dica: 'Sem balançar o tronco; cotovelos parados ao lado do corpo.' },
      { id: 'Reverse_Barbell_Curl', nome: 'Rosca inversa', barra: 'pequena', series: 3, reps: '12', descanso: '60s', dica: 'Pegada pronada; trabalha braquial e antebraço.' },
    ],
  },
  {
    key: 'perna', label: 'Perna', icon: '🦵', foco: 'Quadríceps, posterior, glúteo e panturrilha',
    exercicios: [
      { id: 'Barbell_Squat', nome: 'Agachamento livre', barra: 'grande', series: 4, reps: '8–10', descanso: '120s', dica: 'Joelhos na direção dos pés, desça até pelo menos 90°.' },
      { id: 'Front_Barbell_Squat', nome: 'Agachamento frontal', barra: 'grande', series: 3, reps: '8', descanso: '90s', dica: 'Barra apoiada nos deltoides, tronco o mais ereto possível.' },
      { id: 'Stiff-Legged_Barbell_Deadlift', nome: 'Stiff', barra: 'grande', series: 4, reps: '10', descanso: '90s', dica: 'Quadril vai para trás, joelhos quase estendidos, sinta o posterior.' },
      { id: 'Barbell_Lunge', nome: 'Afundo', barra: 'pequena', series: 3, reps: '10 cada perna', descanso: '75s', dica: 'Passo largo, joelho de trás quase toca o chão.' },
      { id: 'Barbell_Hip_Thrust', nome: 'Elevação pélvica', barra: 'grande', series: 3, reps: '12', descanso: '75s', dica: 'Use uma almofada na barra; contraia o glúteo 1s no topo.' },
      { id: 'Standing_Barbell_Calf_Raise', nome: 'Panturrilha em pé', barra: 'grande', series: 4, reps: '15', descanso: '45s', dica: 'Ponta dos pés numa anilha para ganhar amplitude.' },
    ],
  },
  {
    key: 'ombro', label: 'Ombro', icon: '🎯', foco: 'Deltoides + trapézio',
    exercicios: [
      { id: 'Standing_Military_Press', nome: 'Desenvolvimento militar em pé', barra: 'grande', series: 4, reps: '8–10', descanso: '90s', dica: 'Abdômen e glúteo contraídos, barra sobe em linha reta.' },
      { id: 'Seated_Barbell_Military_Press', nome: 'Desenvolvimento sentado', barra: 'grande', series: 3, reps: '10', descanso: '75s', dica: 'Desça a barra até a altura do queixo.' },
      { id: 'Upright_Barbell_Row', nome: 'Remada alta', barra: 'pequena', series: 3, reps: '12', descanso: '60s', dica: 'Cotovelos lideram o movimento, até a altura dos ombros.' },
      { id: 'Standing_Front_Barbell_Raise_Over_Head', nome: 'Elevação frontal', barra: 'pequena', series: 3, reps: '12', descanso: '60s', dica: 'Carga leve, braços quase estendidos, sem embalo.' },
      { id: 'Barbell_Rear_Delt_Row', nome: 'Remada p/ deltoide posterior', barra: 'grande', series: 3, reps: '12', descanso: '60s', dica: 'Pegada aberta, puxe a barra em direção ao peito.' },
      { id: 'Barbell_Shrug', nome: 'Encolhimento', barra: 'grande', series: 4, reps: '12', descanso: '60s', dica: 'Suba os ombros em direção às orelhas, segure 1s.' },
    ],
  },
];

const STORAGE_KEY = 'academia-feitos';

function loadFeitos(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

/** Alterna os dois frames do exercício para animar como um GIF. */
function ExercicioAnimado({ id, nome, size }: { id: string; nome: string; size: number | string }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % 2), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ position: 'relative', width: size, aspectRatio: '4 / 3', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
      {[0, 1].map(i => (
        <img
          key={i}
          src={`${IMG_BASE}/${id}/${i}.jpg`}
          alt={`${nome} – posição ${i + 1}`}
          loading="lazy"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain',
            opacity: frame === i ? 1 : 0, transition: 'opacity .25s',
          }}
        />
      ))}
    </div>
  );
}

const BARRA_STYLE: Record<Barra, { label: string; bg: string; color: string }> = {
  grande:  { label: 'Barra grande',  bg: 'rgba(108,99,255,.15)', color: 'var(--accent)' },
  pequena: { label: 'Barra pequena', bg: 'rgba(67,217,173,.15)', color: '#43d9ad' },
};

export function Academia() {
  const [ativo, setAtivo] = useState(TREINOS[0].key);
  const [feitos, setFeitos] = useState<Record<string, boolean>>(loadFeitos);
  const [zoom, setZoom] = useState<Exercicio | null>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(feitos)); } catch { /* ignore */ }
  }, [feitos]);

  const treino = TREINOS.find(t => t.key === ativo)!;
  const totalSeries = treino.exercicios.reduce((s, e) => s + e.series, 0);
  const qtdFeitos = treino.exercicios.filter(e => feitos[`${treino.key}:${e.id}`]).length;

  function toggle(e: Exercicio) {
    const k = `${treino.key}:${e.id}`;
    setFeitos(f => ({ ...f, [k]: !f[k] }));
  }

  function resetar() {
    setFeitos(f => {
      const n = { ...f };
      treino.exercicios.forEach(e => delete n[`${treino.key}:${e.id}`]);
      return n;
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Abas dos treinos */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TREINOS.map((t, i) => (
          <button
            key={t.key}
            onClick={() => setAtivo(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10,
              fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all .18s',
              background: ativo === t.key ? 'var(--accent)' : 'var(--surface)',
              color: ativo === t.key ? '#fff' : 'var(--muted)',
              border: `1px solid ${ativo === t.key ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            <span>{t.icon}</span> Treino {String.fromCharCode(65 + i)} · {t.label}
          </button>
        ))}
      </div>

      {/* Resumo */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        padding: 20, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center',
      }}>
        <div style={{ flex: '1 1 200px' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{treino.icon} {treino.label}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{treino.foco}</div>
        </div>
        {[
          ['Exercícios', treino.exercicios.length],
          ['Séries', totalSeries],
          ['Concluídos', `${qtdFeitos}/${treino.exercicios.length}`],
        ].map(([l, v]) => (
          <div key={l} style={{ textAlign: 'center', minWidth: 70 }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{l}</div>
          </div>
        ))}
        <button
          onClick={resetar}
          style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
        >Zerar treino</button>
        <div style={{ flexBasis: '100%', height: 6, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${(qtdFeitos / treino.exercicios.length) * 100}%`,
            background: 'linear-gradient(90deg, var(--accent), var(--accent2))', transition: 'width .3s',
          }} />
        </div>
      </div>

      {/* Exercícios */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {treino.exercicios.map((e, i) => {
          const feito = !!feitos[`${treino.key}:${e.id}`];
          const b = BARRA_STYLE[e.barra];
          return (
            <div key={e.id} style={{
              background: 'var(--surface)', border: `1px solid ${feito ? '#43d9ad' : 'var(--border)'}`,
              borderRadius: 'var(--radius)', padding: 14, display: 'flex', flexDirection: 'column', gap: 12,
              opacity: feito ? .7 : 1, transition: 'all .2s',
            }}>
              <div onClick={() => setZoom(e)} style={{ cursor: 'zoom-in' }}>
                <ExercicioAnimado id={e.id} nome={e.nome} size="100%" />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', minWidth: 18 }}>{i + 1}.</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, textDecoration: feito ? 'line-through' : 'none' }}>{e.nome}</div>
                  <span style={{
                    display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 600,
                    padding: '2px 8px', borderRadius: 20, background: b.bg, color: b.color,
                  }}>{b.label}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[['Séries', e.series], ['Reps', e.reps], ['Descanso', e.descanso]].map(([l, v]) => (
                  <div key={l} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 4px', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{v}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>{l}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.45 }}>💡 {e.dica}</div>

              <button
                onClick={() => toggle(e)}
                style={{
                  marginTop: 'auto', padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: feito ? 'rgba(67,217,173,.15)' : 'var(--accent)',
                  color: feito ? '#43d9ad' : '#fff',
                  border: feito ? '1px solid #43d9ad' : 'none',
                }}
              >{feito ? '✓ Concluído' : 'Marcar como feito'}</button>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
        Imagens: free-exercise-db (domínio público). Ajuste cargas e volume conforme seu nível e orientação profissional.
      </div>

      {/* Zoom */}
      {zoom && (
        <div
          onClick={() => setZoom(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          <div onClick={ev => ev.stopPropagation()} style={{
            background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 16,
            width: 'min(640px, 100%)', display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{zoom.nome}</div>
              <button onClick={() => setZoom(null)} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <ExercicioAnimado id={zoom.id} nome={zoom.nome} size="100%" />
            <div style={{ fontSize: 14 }}>
              <b>{zoom.series} × {zoom.reps}</b> · descanso {zoom.descanso} · {BARRA_STYLE[zoom.barra].label}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>💡 {zoom.dica}</div>
          </div>
        </div>
      )}
    </div>
  );
}
