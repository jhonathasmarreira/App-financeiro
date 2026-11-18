import { useEffect, useState } from 'react';

type Barra = 'grande' | 'pequena' | 'halter';

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
      { id: 'Incline_Dumbbell_Press', nome: 'Supino inclinado com halteres', barra: 'halter', series: 4, reps: '10', descanso: '90s', dica: 'Banco entre 30° e 45°, halteres se encontram acima do peito.' },
      { id: 'Dumbbell_Bench_Press_with_Neutral_Grip', nome: 'Supino com halteres colados', barra: 'halter', series: 3, reps: '12', descanso: '60s', dica: 'Pegada neutra, halteres pressionados um contra o outro do início ao fim; foco no peitoral interno.' },
      { id: 'Dumbbell_Flyes', nome: 'Crucifixo reto', barra: 'halter', series: 3, reps: '12', descanso: '60s', dica: 'Cotovelos levemente flexionados, abra até sentir o peitoral alongar.' },
      { id: 'Straight-Arm_Dumbbell_Pullover', nome: 'Pullover com halter', barra: 'halter', series: 3, reps: '12', descanso: '60s', dica: 'Segure um halter com as duas mãos, desça atrás da cabeça com controle.' },
      { id: 'Close-Grip_EZ-Bar_Press', nome: 'Supino fechado', barra: 'pequena', series: 3, reps: '10', descanso: '60s', dica: 'Pegada na largura dos ombros, cotovelos junto ao corpo.' },
      { id: 'EZ-Bar_Skullcrusher', nome: 'Tríceps testa', barra: 'pequena', series: 3, reps: '12', descanso: '60s', dica: 'Só o antebraço se move; cotovelos apontando para o teto.' },
      { id: 'Standing_Dumbbell_Triceps_Extension', nome: 'Tríceps francês', barra: 'halter', series: 3, reps: '12', descanso: '60s', dica: 'Halter atrás da cabeça, cotovelos fechados apontando para cima.' },
    ],
  },
  {
    key: 'costas', label: 'Costas', icon: '💪', foco: 'Dorsais + bíceps',
    exercicios: [
      { id: 'Barbell_Deadlift', nome: 'Levantamento terra', barra: 'grande', series: 4, reps: '6–8', descanso: '120s', dica: 'Coluna neutra, barra colada nas pernas o tempo todo.' },
      { id: 'Bent_Over_Barbell_Row', nome: 'Remada curvada pronada', barra: 'grande', series: 4, reps: '8–10', descanso: '90s', dica: 'Tronco a ~45°, puxe a barra em direção ao umbigo.' },
      { id: 'One-Arm_Dumbbell_Row', nome: 'Remada serrote', barra: 'halter', series: 3, reps: '10 cada lado', descanso: '60s', dica: 'Joelho e mão no banco, puxe o halter em direção ao quadril.' },
      { id: 'Bent_Over_Two-Arm_Long_Bar_Row', nome: 'Remada cavalinho (barra T)', barra: 'grande', series: 3, reps: '10', descanso: '75s', dica: 'Ponta da barra no canto da parede, junte as escápulas no topo.' },
      { id: 'Dumbbell_Incline_Row', nome: 'Remada no banco inclinado', barra: 'halter', series: 3, reps: '12', descanso: '60s', dica: 'Peito apoiado no banco, elimina o embalo do tronco.' },
      { id: 'EZ-Bar_Curl', nome: 'Rosca direta', barra: 'pequena', series: 3, reps: '12', descanso: '60s', dica: 'Sem balançar o tronco; cotovelos parados ao lado do corpo.' },
      { id: 'Dumbbell_Alternate_Bicep_Curl', nome: 'Rosca alternada', barra: 'halter', series: 3, reps: '10 cada braço', descanso: '60s', dica: 'Gire o punho (supinação) enquanto sobe o halter.' },
      { id: 'Hammer_Curls', nome: 'Rosca martelo', barra: 'halter', series: 3, reps: '12', descanso: '60s', dica: 'Pegada neutra; trabalha braquial e antebraço.' },
    ],
  },
  {
    key: 'perna', label: 'Perna', icon: '🦵', foco: 'Quadríceps, posterior, glúteo e panturrilha',
    exercicios: [
      { id: 'Barbell_Squat', nome: 'Agachamento livre', barra: 'grande', series: 4, reps: '8–10', descanso: '120s', dica: 'Joelhos na direção dos pés, desça até pelo menos 90°.' },
      { id: 'Front_Barbell_Squat', nome: 'Agachamento frontal', barra: 'grande', series: 3, reps: '8', descanso: '90s', dica: 'Barra apoiada nos deltoides, tronco o mais ereto possível.' },
      { id: 'Stiff-Legged_Barbell_Deadlift', nome: 'Stiff', barra: 'grande', series: 4, reps: '10', descanso: '90s', dica: 'Quadril vai para trás, joelhos quase estendidos, sinta o posterior.' },
      { id: 'Dumbbell_Lunges', nome: 'Afundo com halteres', barra: 'halter', series: 3, reps: '10 cada perna', descanso: '75s', dica: 'Passo largo, joelho de trás quase toca o chão.' },
      { id: 'Split_Squat_with_Dumbbells', nome: 'Agachamento búlgaro', barra: 'halter', series: 3, reps: '10 cada perna', descanso: '75s', dica: 'Pé de trás apoiado no banco, tronco levemente inclinado à frente.' },
      { id: 'Plie_Dumbbell_Squat', nome: 'Agachamento sumô', barra: 'halter', series: 3, reps: '12', descanso: '60s', dica: 'Pés afastados e virados para fora, halter entre as pernas.' },
      { id: 'Barbell_Hip_Thrust', nome: 'Elevação pélvica', barra: 'grande', series: 3, reps: '12', descanso: '75s', dica: 'Use uma almofada na barra; contraia o glúteo 1s no topo.' },
      { id: 'Standing_Barbell_Calf_Raise', nome: 'Panturrilha em pé', barra: 'grande', series: 4, reps: '15', descanso: '45s', dica: 'Ponta dos pés numa anilha para ganhar amplitude.' },
    ],
  },
  {
    key: 'ombro', label: 'Ombro', icon: '🎯', foco: 'Deltoides + trapézio',
    exercicios: [
      { id: 'Standing_Military_Press', nome: 'Desenvolvimento militar em pé', barra: 'grande', series: 4, reps: '8–10', descanso: '90s', dica: 'Abdômen e glúteo contraídos, barra sobe em linha reta.' },
      { id: 'Arnold_Dumbbell_Press', nome: 'Desenvolvimento Arnold', barra: 'halter', series: 3, reps: '10', descanso: '75s', dica: 'Comece com as palmas para você e gire enquanto empurra para cima.' },
      { id: 'Side_Lateral_Raise', nome: 'Elevação lateral', barra: 'halter', series: 4, reps: '12–15', descanso: '45s', dica: 'Suba até a altura dos ombros, cotovelos levemente flexionados.' },
      { id: 'Upright_Barbell_Row', nome: 'Remada alta', barra: 'pequena', series: 3, reps: '12', descanso: '60s', dica: 'Cotovelos lideram o movimento, até a altura dos ombros.' },
      { id: 'Standing_Front_Barbell_Raise_Over_Head', nome: 'Elevação frontal', barra: 'pequena', series: 3, reps: '12', descanso: '60s', dica: 'Carga leve, braços quase estendidos, sem embalo.' },
      { id: 'Reverse_Flyes', nome: 'Crucifixo invertido', barra: 'halter', series: 3, reps: '12', descanso: '60s', dica: 'Tronco inclinado, abra os braços focando no deltoide posterior.' },
      { id: 'Barbell_Shrug', nome: 'Encolhimento', barra: 'grande', series: 4, reps: '12', descanso: '60s', dica: 'Suba os ombros em direção às orelhas, segure 1s.' },
    ],
  },
];

/** Músculos trabalhados: [principais, secundários]. Base: free-exercise-db, refinado em PT-BR. */
const MUSCULOS: Record<string, [string[], string[]]> = {
  'Barbell_Bench_Press_-_Medium_Grip':      [['Peitoral'], ['Deltoide anterior', 'Tríceps']],
  'Incline_Dumbbell_Press':                 [['Peitoral superior'], ['Deltoide anterior', 'Tríceps']],
  'Dumbbell_Bench_Press_with_Neutral_Grip': [['Peitoral (porção interna)'], ['Tríceps', 'Deltoide anterior']],
  'Dumbbell_Flyes':                         [['Peitoral'], ['Deltoide anterior']],
  'Straight-Arm_Dumbbell_Pullover':         [['Peitoral', 'Dorsal (latíssimo)'], ['Tríceps', 'Serrátil']],
  'Close-Grip_EZ-Bar_Press':                [['Tríceps'], ['Peitoral', 'Deltoide anterior']],
  'EZ-Bar_Skullcrusher':                    [['Tríceps'], ['Antebraço']],
  'Standing_Dumbbell_Triceps_Extension':    [['Tríceps (cabeça longa)'], []],
  'Barbell_Deadlift':                       [['Lombar', 'Glúteos', 'Posterior de coxa'], ['Quadríceps', 'Trapézio', 'Dorsal', 'Antebraço']],
  'Bent_Over_Barbell_Row':                  [['Meio das costas', 'Dorsal (latíssimo)'], ['Bíceps', 'Deltoide posterior', 'Lombar']],
  'One-Arm_Dumbbell_Row':                   [['Dorsal (latíssimo)', 'Meio das costas'], ['Bíceps', 'Deltoide posterior']],
  'Bent_Over_Two-Arm_Long_Bar_Row':         [['Meio das costas'], ['Dorsal (latíssimo)', 'Bíceps']],
  'Dumbbell_Incline_Row':                   [['Meio das costas'], ['Dorsal (latíssimo)', 'Bíceps', 'Deltoide posterior']],
  'EZ-Bar_Curl':                            [['Bíceps'], ['Antebraço']],
  'Dumbbell_Alternate_Bicep_Curl':          [['Bíceps'], ['Antebraço']],
  'Hammer_Curls':                           [['Braquial', 'Bíceps'], ['Antebraço']],
  'Barbell_Squat':                          [['Quadríceps', 'Glúteos'], ['Posterior de coxa', 'Lombar', 'Panturrilha']],
  'Front_Barbell_Squat':                    [['Quadríceps'], ['Glúteos', 'Abdômen', 'Lombar']],
  'Stiff-Legged_Barbell_Deadlift':          [['Posterior de coxa'], ['Glúteos', 'Lombar']],
  'Dumbbell_Lunges':                        [['Quadríceps', 'Glúteos'], ['Posterior de coxa', 'Panturrilha']],
  'Split_Squat_with_Dumbbells':             [['Quadríceps', 'Glúteos'], ['Posterior de coxa']],
  'Plie_Dumbbell_Squat':                    [['Adutores (parte interna)', 'Glúteos'], ['Quadríceps', 'Posterior de coxa']],
  'Barbell_Hip_Thrust':                     [['Glúteos'], ['Posterior de coxa']],
  'Standing_Barbell_Calf_Raise':            [['Panturrilha'], []],
  'Standing_Military_Press':                [['Deltoide anterior', 'Deltoide lateral'], ['Tríceps', 'Trapézio', 'Abdômen']],
  'Arnold_Dumbbell_Press':                  [['Deltoide anterior', 'Deltoide lateral'], ['Tríceps']],
  'Side_Lateral_Raise':                     [['Deltoide lateral'], ['Trapézio']],
  'Upright_Barbell_Row':                    [['Deltoide lateral', 'Trapézio'], ['Bíceps']],
  'Standing_Front_Barbell_Raise_Over_Head': [['Deltoide anterior'], ['Peitoral superior']],
  'Reverse_Flyes':                          [['Deltoide posterior'], ['Meio das costas', 'Trapézio']],
  'Barbell_Shrug':                          [['Trapézio'], ['Antebraço']],
};

function musculos(id: string) {
  const [principais, secundarios] = MUSCULOS[id] ?? [[], []];
  return { principais, secundarios };
}

function Chips({ itens, destaque }: { itens: string[]; destaque?: boolean }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {itens.map(m => (
        <span key={m} style={{
          fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
          background: destaque ? 'rgba(255,101,132,.15)' : 'var(--surface2)',
          color: destaque ? '#ff6584' : 'var(--muted)',
          border: destaque ? 'none' : '1px solid var(--border)',
        }}>{m}</span>
      ))}
    </div>
  );
}

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
  halter:  { label: 'Halteres',      bg: 'rgba(255,179,71,.15)', color: '#ffb347' },
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

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', paddingTop: 3 }}>🎯 Trabalha:</span>
                <Chips itens={musculos(e.id).principais} destaque />
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

              <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setZoom(e)}
                  style={{
                    padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)',
                  }}
                >ℹ️ Detalhes</button>
                <button
                  onClick={() => toggle(e)}
                  style={{
                    flex: 1, padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    background: feito ? 'rgba(67,217,173,.15)' : 'var(--accent)',
                    color: feito ? '#43d9ad' : '#fff',
                    border: feito ? '1px solid #43d9ad' : 'none',
                  }}
                >{feito ? '✓ Concluído' : 'Marcar como feito'}</button>
              </div>
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
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Músculos principais</div>
              <Chips itens={musculos(zoom.id).principais} destaque />
            </div>
            {musculos(zoom.id).secundarios.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Também trabalha</div>
                <Chips itens={musculos(zoom.id).secundarios} />
              </div>
            )}
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>💡 {zoom.dica}</div>
          </div>
        </div>
      )}
    </div>
  );
}
