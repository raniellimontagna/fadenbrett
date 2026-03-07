import type { Node, Edge } from '@xyflow/react'

export interface BoardTemplate {
  id: string
  name: string
  description: string
  emoji: string
  genre: string
  nodes: Node[]
  edges: Edge[]
}

// ---------------------------------------------------------------------------
// Template: Dark (Netflix – Ciclos de Winden)
// ---------------------------------------------------------------------------
const DARK_NODES: Node[] = [
  { id: 'd-jonas', type: 'card', position: { x: 300, y: 200 }, data: { id: 'd-jonas', title: 'Jonas Kahnwald', description: 'O protagonista. Viaja pelo tempo para salvar Mikkel e entender o paradoxo.', avatarType: 'emoji', avatarValue: '⏳', tags: ['Winden', 'Viajante'], eraLabel: '2019', groupColor: '#2563eb', imageUrl: '' } },
  { id: 'd-mikkel', type: 'card', position: { x: 700, y: 200 }, data: { id: 'd-mikkel', title: 'Mikkel Nielsen', description: 'Desaparece em 2019 e reaparece em 1986, tornando-se Michael Kahnwald — pai de Jonas.', avatarType: 'emoji', avatarValue: '🕳️', tags: ['Winden', 'Paradoxo'], eraLabel: '2019/1986', groupColor: '#9333ea', imageUrl: '' } },
  { id: 'd-noah', type: 'card', position: { x: 520, y: 420 }, data: { id: 'd-noah', title: 'Noah', description: 'Sacerdote misterioso que coleta crianças. Revela-se filho de Bartosz e Elizabeth.', avatarType: 'emoji', avatarValue: '✝️', tags: ['Antagonista', 'Viajante'], eraLabel: 'Multiplico', groupColor: '#b91c1c', imageUrl: '' } },
  { id: 'd-claudia', type: 'card', position: { x: 100, y: 420 }, data: { id: 'd-claudia', title: 'Claudia Tiedemann', description: 'Diretora da usina. Opera fora dos ciclos para destruir o nó.', avatarType: 'emoji', avatarValue: '🧬', tags: ['Winden', 'Estrategista'], eraLabel: 'Múltiplos ciclos', groupColor: '#16a34a', imageUrl: '' } },
  { id: 'd-adam', type: 'card', position: { x: 900, y: 420 }, data: { id: 'd-adam', title: 'Adam (Jonas Futuro)', description: 'Versão mais velha e desfigurada de Jonas; lidera Sic Mundus.', avatarType: 'emoji', avatarValue: '💀', tags: ['Futuro', 'Antagonista'], eraLabel: '2053+', groupColor: '#b91c1c', imageUrl: '' } },
  { id: 'd-cave', type: 'note', position: { x: 460, y: 50 }, data: { id: 'd-cave', content: 'A caverna de Winden conecta 1953 ↔ 1986 ↔ 2019 ↔ 2053', color: '#3b4a6b', rotation: -1.2 } },
  { id: 'd-wormhole', type: 'note', position: { x: 50, y: 80 }, data: { id: 'd-wormhole', content: 'O paradoxo do bootstrap: nada tem origem — só existe o ciclo.', color: '#4a3b6b', rotation: 1.8 } },
]

const DARK_EDGES: Edge[] = [
  { id: 'de-1', source: 'd-mikkel', target: 'd-jonas', type: 'yarn', data: { label: 'é pai de', style: 'solid', color: '#9333ea' } },
  { id: 'de-2', source: 'd-jonas', target: 'd-noah', type: 'yarn', data: { label: 'confronta', style: 'dashed', color: '#b91c1c' } },
  { id: 'de-3', source: 'd-claudia', target: 'd-jonas', type: 'yarn', data: { label: 'guia', style: 'solid', color: '#16a34a' } },
  { id: 'de-4', source: 'd-jonas', target: 'd-adam', type: 'yarn', data: { label: 'torna-se', style: 'dotted', color: '#737373' } },
  { id: 'de-5', source: 'd-noah', target: 'd-adam', type: 'yarn', data: { label: 'serve', style: 'solid', color: '#b91c1c' } },
]

// ---------------------------------------------------------------------------
// Template: Lost (ABC – Os Sobreviventes)
// ---------------------------------------------------------------------------
const LOST_NODES: Node[] = [
  { id: 'l-jack', type: 'card', position: { x: 300, y: 180 }, data: { id: 'l-jack', title: 'Jack Shephard', description: 'Médico e líder involuntário dos sobreviventes. "Live together, die alone."', avatarType: 'emoji', avatarValue: '⚕️', tags: ['Líder', 'Sobrevivente'], eraLabel: 'Ilha', groupColor: '#2563eb', imageUrl: '' } },
  { id: 'l-locke', type: 'card', position: { x: 700, y: 180 }, data: { id: 'l-locke', title: 'John Locke', description: 'Ex-paralítico que acredita no destino da ilha. Manipulado por MiB.', avatarType: 'emoji', avatarValue: '🌴', tags: ['Crente', 'Manipulado'], eraLabel: 'Ilha', groupColor: '#16a34a', imageUrl: '' } },
  { id: 'l-sawyer', type: 'card', position: { x: 100, y: 380 }, data: { id: 'l-sawyer', title: 'James "Sawyer" Ford', description: 'Golpista arrependido. Lider alternativo. Vive em 1977 com os Dharma.', avatarType: 'emoji', avatarValue: '🎭', tags: ['Sobrevivente', 'Dharma'], eraLabel: 'Ilha / 1977', groupColor: '#ea580c', imageUrl: '' } },
  { id: 'l-ben', type: 'card', position: { x: 520, y: 380 }, data: { id: 'l-ben', title: 'Benjamin Linus', description: 'Líder dos Outros. Manipulador nato. Mata o pai, perde a filha.', avatarType: 'emoji', avatarValue: '🧩', tags: ['Outros', 'Antagonista'], eraLabel: 'Ilha', groupColor: '#b91c1c', imageUrl: '' } },
  { id: 'l-mib', type: 'card', position: { x: 900, y: 380 }, data: { id: 'l-mib', title: 'Homem de Preto (Fumaça)', description: 'Entidade presa na ilha. Usa a forma de Locke para manipular todos.', avatarType: 'emoji', avatarValue: '🖤', tags: ['Antagonista', 'Sobrenatural'], eraLabel: 'Eterno', groupColor: '#374151', imageUrl: '' } },
  { id: 'l-hatch', type: 'note', position: { x: 440, y: 40 }, data: { id: 'l-hatch', content: 'A Escotilha — pressionar o botão a cada 108 minutos. Número: 4 8 15 16 23 42', color: '#3b5a3b', rotation: -0.8 } },
  { id: 'l-flash', type: 'note', position: { x: 50, y: 60 }, data: { id: 'l-flash', content: 'Flash-sideways: universo alternativo onde Jacob nunca trouxe os candidatos à ilha.', color: '#5a3b3b', rotation: 1.5 } },
]

const LOST_EDGES: Edge[] = [
  { id: 'll-1', source: 'l-jack', target: 'l-locke', type: 'yarn', data: { label: 'conflito fé vs ciência', style: 'dashed', color: '#ca8a04' } },
  { id: 'll-2', source: 'l-locke', target: 'l-mib', type: 'yarn', data: { label: 'assume forma de', style: 'solid', color: '#374151' } },
  { id: 'll-3', source: 'l-mib', target: 'l-ben', type: 'yarn', data: { label: 'manipula', style: 'solid', color: '#b91c1c' } },
  { id: 'll-4', source: 'l-ben', target: 'l-jack', type: 'yarn', data: { label: 'adversário/aliado', style: 'dotted', color: '#737373' } },
  { id: 'll-5', source: 'l-sawyer', target: 'l-jack', type: 'yarn', data: { label: 'rivalidade/amizade', style: 'solid', color: '#ea580c' } },
]

// ---------------------------------------------------------------------------
// Template: Breaking Bad (AMC)
// ---------------------------------------------------------------------------
const BB_NODES: Node[] = [
  { id: 'bb-walt', type: 'card', position: { x: 300, y: 200 }, data: { id: 'bb-walt', title: 'Walter White', description: 'Professor de química que vira traficante de metanfetamina após diagnóstico de câncer. "I am the danger."', avatarType: 'emoji', avatarValue: '🧪', tags: ['Protagonista', 'Heisenberg'], eraLabel: 'Albuquerque', groupColor: '#16a34a', imageUrl: '' } },
  { id: 'bb-jesse', type: 'card', position: { x: 700, y: 200 }, data: { id: 'bb-jesse', title: 'Jesse Pinkman', description: 'Ex-aluno e parceiro de Walt. Vítima de manipulação constante.', avatarType: 'emoji', avatarValue: '🎮', tags: ['Parceiro', 'Vítima'], eraLabel: 'Albuquerque', groupColor: '#2563eb', imageUrl: '' } },
  { id: 'bb-hank', type: 'card', position: { x: 100, y: 380 }, data: { id: 'bb-hank', title: 'Hank Schrader', description: 'Cunhado de Walt, agente da DEA. Descobre a verdade tarde demais.', avatarType: 'emoji', avatarValue: '🔫', tags: ['DEA', 'Família'], eraLabel: 'Albuquerque', groupColor: '#b91c1c', imageUrl: '' } },
  { id: 'bb-gus', type: 'card', position: { x: 520, y: 380 }, data: { id: 'bb-gus', title: 'Gustavo Fring', description: 'Empresário respeitável e chefe do cartel local. Antagonista principal.', avatarType: 'emoji', avatarValue: '🍗', tags: ['Antagonista', 'Cartel'], eraLabel: 'Albuquerque', groupColor: '#ca8a04', imageUrl: '' } },
  { id: 'bb-saul', type: 'card', position: { x: 900, y: 380 }, data: { id: 'bb-saul', title: 'Saul Goodman', description: 'Advogado oportunista. Faz a ponte entre Walt e o submundo.', avatarType: 'emoji', avatarValue: '⚖️', tags: ['Advogado', 'Oportunista'], eraLabel: 'Albuquerque', groupColor: '#9333ea', imageUrl: '' } },
  { id: 'bb-lab', type: 'note', position: { x: 450, y: 50 }, data: { id: 'bb-lab', content: 'A meth azul de Walt tem 99,1% de pureza — a mais pura já vista no mercado.', color: '#1e3a5f', rotation: -1 } },
  { id: 'bb-ego', type: 'note', position: { x: 40, y: 70 }, data: { id: 'bb-ego', content: '"I did it for me. I liked it. I was alive." — Walt admite a Skyler.', color: '#3b2f1e', rotation: 1.2 } },
]

const BB_EDGES: Edge[] = [
  { id: 'bbe-1', source: 'bb-walt', target: 'bb-jesse', type: 'yarn', data: { label: 'parceria tóxica', style: 'solid', color: '#16a34a' } },
  { id: 'bbe-2', source: 'bb-gus', target: 'bb-walt', type: 'yarn', data: { label: 'emprega / ameaça', style: 'dashed', color: '#ca8a04' } },
  { id: 'bbe-3', source: 'bb-walt', target: 'bb-gus', type: 'yarn', data: { label: 'elimina', style: 'solid', color: '#b91c1c' } },
  { id: 'bbe-4', source: 'bb-saul', target: 'bb-walt', type: 'yarn', data: { label: 'assessora', style: 'dotted', color: '#9333ea' } },
  { id: 'bbe-5', source: 'bb-hank', target: 'bb-walt', type: 'yarn', data: { label: 'rastreia (sem saber)', style: 'dashed', color: '#b91c1c' } },
]

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: 'tpl-dark',
    name: 'Dark',
    description: 'Ciclos temporais de Winden — família Kahnwald, Tiedemann, Nielsen e Doppler entrelaçadas em paradoxos.',
    emoji: '⏳',
    genre: 'Sci-Fi / Mistério',
    nodes: DARK_NODES,
    edges: DARK_EDGES,
  },
  {
    id: 'tpl-lost',
    name: 'Lost',
    description: 'Sobreviventes do voo 815, a ilha misteriosa, os Outros e os candidatos de Jacob.',
    emoji: '✈️',
    genre: 'Drama / Mistério',
    nodes: LOST_NODES,
    edges: LOST_EDGES,
  },
  {
    id: 'tpl-bb',
    name: 'Breaking Bad',
    description: 'A queda de Walter White, de professor de química a chefe do narcotráfico.',
    emoji: '🧪',
    genre: 'Crime / Drama',
    nodes: BB_NODES,
    edges: BB_EDGES,
  },
]
