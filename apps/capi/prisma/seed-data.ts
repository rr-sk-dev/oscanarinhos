// Mock fixtures for local development. Image paths are served by cfe from
// `apps/cfe/public/assets`, so they resolve when the app runs on the same origin.

import { CURRENT_SEASON, OUR_TEAM_NAME } from '../src/scrapper/cif.constants';

export { OUR_TEAM_NAME };
export const SEASON = CURRENT_SEASON;

const ASSETS = '/assets/seed';

export interface TeamFixture {
  name: string;
  shortName: string | null;
  logo: string;
}

export const OUR_TEAM = {
  name: OUR_TEAM_NAME,
  shortName: 'Os Canarinhos',
  logo: '/assets/canarinhos.png',
  teamPhoto: `${ASSETS}/teams/canarinhos-team-photo.webp`,
  webContent: {
    title: 'Os Canarinhos',
    subtitle: 'A voar mais alto desde 1974',
    instagram: 'oscanarinhos1974',
  },
};

const opponent = (
  name: string,
  file: string,
  shortName: string | null = null,
  logoExtension = 'webp',
): TeamFixture => ({
  name,
  shortName,
  logo: `${ASSETS}/teams/${file}-logo.${logoExtension}`,
});

export const OPPONENTS: TeamFixture[] = [
  opponent('Amigos CDUL', 'amigos-cdul', 'CDUL'),
  opponent('AQA', 'aqa'),
  opponent('Briosa', 'briosa'),
  opponent('Cosmos', 'cosmos'),
  opponent('Incríveis', 'incriveis'),
  opponent('Laranjada', 'laranjada'),
  opponent('Leões', 'leoes'),
  opponent('Madeira', 'madeira'),
  opponent('Madeirinha', 'madeirinha'),
  opponent('Milionários', 'milionarios'),
  opponent('Olímpico', 'olimpico'),
  opponent('Purrianos', 'purrianos'),
  opponent('Pé Leve', 'pe-leve'),
  opponent('SD76', 'sd76'),
  opponent('Tigres', 'tigres'),
  opponent('VIPs', 'vips'),
  opponent('VDR', 'vdr', null, 'png'),
];

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';
export type Foot = 'LEFT' | 'RIGHT' | 'BOTH';

export interface PlayerFixture {
  slug: string;
  firstName: string;
  lastName: string;
  shirtNumber: number;
  position: Position;
  preferredFoot: Foot;
  dateOfBirth: string;
  nickname?: string;
  leadershipRole?: 'CAPTAIN' | 'VICE_CAPTAIN';
  status?: 'INJURED' | 'SUSPENDED';
  bio?: string;
}

export const PLAYERS: PlayerFixture[] = [
  {
    slug: 'francisco-bourbon',
    firstName: 'Francisco',
    lastName: 'Bourbon',
    shirtNumber: 1,
    position: 'GK',
    preferredFoot: 'RIGHT',
    dateOfBirth: '1994-03-12',
    bio: 'Guarda-redes titular, conhecido pelos reflexos entre os postes.',
  },
  {
    slug: 'nuno-ferreira',
    firstName: 'Nuno',
    lastName: 'Ferreira',
    shirtNumber: 12,
    position: 'GK',
    preferredFoot: 'RIGHT',
    dateOfBirth: '1997-08-02',
  },
  {
    slug: 'joao-monteiro',
    firstName: 'João',
    lastName: 'Monteiro',
    shirtNumber: 2,
    position: 'DEF',
    preferredFoot: 'RIGHT',
    dateOfBirth: '1995-11-21',
  },
  {
    slug: 'joao-jesus',
    firstName: 'João',
    lastName: 'Jesus',
    shirtNumber: 3,
    position: 'DEF',
    preferredFoot: 'LEFT',
    dateOfBirth: '1996-05-30',
  },
  {
    slug: 'rodrigo-correia',
    firstName: 'Rodrigo',
    lastName: 'Correia',
    shirtNumber: 4,
    position: 'DEF',
    preferredFoot: 'RIGHT',
    dateOfBirth: '1992-01-17',
    leadershipRole: 'CAPTAIN',
    bio: 'Capitão de equipa e voz de comando na defesa.',
  },
  {
    slug: 'miguel-fortes',
    firstName: 'Miguel',
    lastName: 'Fortes',
    shirtNumber: 5,
    position: 'DEF',
    preferredFoot: 'RIGHT',
    dateOfBirth: '1993-09-08',
  },
  {
    slug: 'tomas-duarte',
    firstName: 'Tomás',
    lastName: 'Duarte',
    shirtNumber: 13,
    position: 'DEF',
    preferredFoot: 'LEFT',
    dateOfBirth: '1999-04-14',
    status: 'INJURED',
  },
  {
    slug: 'rodrigo-mateus',
    firstName: 'Rodrigo',
    lastName: 'Mateus',
    shirtNumber: 6,
    position: 'MID',
    preferredFoot: 'RIGHT',
    dateOfBirth: '1995-02-25',
  },
  {
    slug: 'duarte-silva',
    firstName: 'Duarte',
    lastName: 'Silva',
    shirtNumber: 8,
    position: 'MID',
    preferredFoot: 'BOTH',
    dateOfBirth: '1998-07-03',
  },
  {
    slug: 'joao-vieira',
    firstName: 'João',
    lastName: 'Vieira',
    shirtNumber: 10,
    position: 'MID',
    preferredFoot: 'LEFT',
    dateOfBirth: '1994-12-09',
    leadershipRole: 'VICE_CAPTAIN',
    bio: 'O número 10 que dita o ritmo do meio-campo.',
  },
  {
    slug: 'ruben-rodrigues',
    firstName: 'Ruben',
    lastName: 'Rodrigues',
    shirtNumber: 14,
    position: 'MID',
    preferredFoot: 'RIGHT',
    dateOfBirth: '1996-10-19',
  },
  {
    slug: 'tiago-ornelas',
    firstName: 'Tiago',
    lastName: 'Ornelas',
    shirtNumber: 16,
    position: 'MID',
    preferredFoot: 'RIGHT',
    dateOfBirth: '1997-06-11',
  },
  {
    slug: 'vasco-maia',
    firstName: 'Vasco',
    lastName: 'Maia',
    shirtNumber: 18,
    position: 'MID',
    preferredFoot: 'LEFT',
    dateOfBirth: '2000-01-28',
  },
  {
    slug: 'rodrigo-morais',
    firstName: 'Rodrigo',
    lastName: 'Morais',
    shirtNumber: 7,
    position: 'FWD',
    preferredFoot: 'RIGHT',
    dateOfBirth: '1998-03-05',
  },
  {
    slug: 'david-santos',
    firstName: 'David',
    lastName: 'Santos',
    shirtNumber: 9,
    position: 'FWD',
    preferredFoot: 'RIGHT',
    dateOfBirth: '1995-08-22',
    nickname: 'Davi',
    bio: 'Melhor marcador da equipa na época 2025/26.',
  },
  {
    slug: 'martim-melro',
    firstName: 'Martim',
    lastName: 'Melro',
    shirtNumber: 11,
    position: 'FWD',
    preferredFoot: 'LEFT',
    dateOfBirth: '1999-11-13',
  },
  {
    slug: 'tiago-rodrigues',
    firstName: 'Tiago',
    lastName: 'Rodrigues',
    shirtNumber: 17,
    position: 'FWD',
    preferredFoot: 'RIGHT',
    dateOfBirth: '1997-02-07',
    status: 'SUSPENDED',
  },
  {
    slug: 'thomas-cecchetti',
    firstName: 'Thomas',
    lastName: 'Cecchetti',
    shirtNumber: 19,
    position: 'FWD',
    preferredFoot: 'RIGHT',
    dateOfBirth: '1996-09-26',
  },
  {
    slug: 'ulpiano-capalbo',
    firstName: 'Ulpiano',
    lastName: 'Capalbo',
    shirtNumber: 20,
    position: 'FWD',
    preferredFoot: 'BOTH',
    dateOfBirth: '1993-05-16',
  },
];

export const playerPhoto = (slug: string): string => `${ASSETS}/players/${slug}.webp`;

export interface StaffFixture {
  slug: string;
  firstName: string;
  lastName: string;
  role: 'COACH' | 'ASSISTANT_COACH' | 'DELEGATE' | 'PHYSICAL_PREPARATOR';
  dateOfBirth: string;
  bio: string;
}

export const STAFF: StaffFixture[] = [
  {
    slug: 'leandro-paraizo',
    firstName: 'Leandro',
    lastName: 'Paraízo',
    role: 'COACH',
    dateOfBirth: '1985-04-03',
    bio: 'Treinador principal desde 2023. Cumpriu 50 jogos ao comando da equipa em outubro de 2026.',
  },
  {
    slug: 'reinaldo-santos',
    firstName: 'Reinaldo',
    lastName: 'Santos',
    role: 'ASSISTANT_COACH',
    dateOfBirth: '1982-10-30',
    bio: 'Treinador adjunto e responsável pela análise dos adversários.',
  },
  {
    slug: 'miguel-goncalves',
    firstName: 'Miguel',
    lastName: 'Gonçalves',
    role: 'DELEGATE',
    dateOfBirth: '1979-07-21',
    bio: 'Delegado ao jogo e ponte entre a equipa e a organização do torneio.',
  },
];

export const staffPhoto = (slug: string): string => `${ASSETS}/staff/${slug}.webp`;

// Our mock results so far, used for our standings row and scorers.
// `scorers` lists shirt numbers of our goal scorers. Matches come from the fixtures scraper.
export interface ResultFixture {
  goalsFor: number;
  goalsAgainst: number;
  scorers: number[];
}

export const RESULTS: ResultFixture[] = [
  { goalsFor: 2, goalsAgainst: 1, scorers: [9, 10] },
  { goalsFor: 1, goalsAgainst: 1, scorers: [9] },
  { goalsFor: 3, goalsAgainst: 0, scorers: [9, 11, 7] },
  { goalsFor: 0, goalsAgainst: 2, scorers: [] },
  { goalsFor: 4, goalsAgainst: 2, scorers: [9, 9, 10, 8] },
  { goalsFor: 2, goalsAgainst: 0, scorers: [11, 4] },
  { goalsFor: 1, goalsAgainst: 1, scorers: [10] },
  { goalsFor: 2, goalsAgainst: 3, scorers: [9, 6] },
  { goalsFor: 2, goalsAgainst: 0, scorers: [7, 9] },
  { goalsFor: 0, goalsAgainst: 1, scorers: [] },
  { goalsFor: 2, goalsAgainst: 2, scorers: [10, 11] },
  { goalsFor: 3, goalsAgainst: 1, scorers: [9, 8, 7] },
];

// Other teams' standings after 12 games: [wins, draws, losses, goalsFor, goalsAgainst].
export const OTHER_STANDINGS: Record<string, [number, number, number, number, number]> = {
  'Amigos CDUL': [9, 2, 1, 31, 12],
  AQA: [8, 2, 2, 26, 14],
  Briosa: [6, 3, 3, 22, 17],
  Cosmos: [6, 2, 4, 20, 16],
  Incríveis: [5, 4, 3, 19, 17],
  Laranjada: [5, 3, 4, 18, 18],
  Leões: [5, 2, 5, 21, 20],
  Madeira: [4, 4, 4, 16, 17],
  Madeirinha: [4, 3, 5, 15, 19],
  Milionários: [4, 2, 6, 17, 21],
  Olímpico: [3, 4, 5, 14, 18],
  Purrianos: [3, 3, 6, 13, 20],
  'Pé Leve': [3, 2, 7, 12, 22],
  SD76: [2, 4, 6, 11, 19],
  Tigres: [2, 3, 7, 12, 24],
  VIPs: [1, 3, 8, 9, 26],
  VDR: [1, 2, 9, 8, 27],
};

// Goals scored by other teams' top scorers this season.
export const OTHER_SCORERS: [string, string, number][] = [
  ['Pedro Lacerda', 'Amigos CDUL', 13],
  ['Hugo Matias', 'AQA', 10],
  ['Bruno Teles', 'Briosa', 8],
  ['André Pinto', 'Leões', 7],
  ['Carlos Mendes', 'Cosmos', 6],
];

export interface NewsFixture {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string | null;
  author: string;
  status: 'DRAFT' | 'PUBLISHED';
  daysAgo: number;
}

export const NEWS: NewsFixture[] = [
  {
    title: 'Leo Paraízo cumpre 50 jogos ao comando dos Canarinhos',
    slug: 'leo-paraizo-50-jogos',
    excerpt: 'O treinador chegou à marca dos 50 jogos com a vitória frente aos Purrianos.',
    content:
      'Leandro Paraízo atingiu no último fim de semana os 50 jogos como treinador principal dos Canarinhos.\n\nDesde que chegou ao clube, em 2023, a equipa somou mais vitórias do que derrotas e voltou a lutar pelos lugares cimeiros do Torneio CIF.\n\n"Isto é mérito dos jogadores e de quem nos apoia todos os domingos", disse o treinador no final do jogo.',
    image: '/assets/misterLeo50Jogos.webp',
    author: 'Os Canarinhos',
    status: 'PUBLISHED',
    daysAgo: 4,
  },
  {
    title: 'Vitória em casa dos Purrianos mantém a equipa no pódio',
    slug: 'vitoria-purrianos-jornada-12',
    excerpt: 'Três golos na segunda parte deram a volta ao resultado na jornada 12.',
    content:
      'Os Canarinhos venceram por 3-1 em casa dos Purrianos e seguem no terceiro lugar da classificação.\n\nDavid Santos, Duarte Silva e Rodrigo Morais marcaram os golos da reviravolta, todos na segunda parte.\n\nO resumo do jogo já está disponível no nosso canal de YouTube.',
    image: `${ASSETS}/teams/canarinhos-team-photo.webp`,
    author: 'Os Canarinhos',
    status: 'PUBLISHED',
    daysAgo: 6,
  },
  {
    title: 'Equipamentos da nova época já estão disponíveis',
    slug: 'equipamentos-2025-26',
    excerpt: 'A camisola principal mantém o amarelo e preto; a alternativa estreia o azul.',
    content:
      'Os equipamentos para a época 2025/26 chegaram.\n\nA camisola principal mantém o amarelo e preto que nos identifica desde 1974. A alternativa aposta no azul, com os detalhes clássicos do clube.\n\nAs encomendas estarão disponíveis na loja online, em breve.',
    image: '/assets/equip1.jpg',
    author: 'Os Canarinhos',
    status: 'PUBLISHED',
    daysAgo: 12,
  },
  {
    title: 'Cachecol oficial chega às bancadas',
    slug: 'cachecol-oficial',
    excerpt: 'O novo cachecol do clube vai estar à venda nos jogos em casa.',
    content:
      'O cachecol oficial dos Canarinhos já está disponível.\n\nVai poder comprá-lo nos jogos em casa e, em breve, na loja online.',
    image: '/assets/scarf.webp',
    author: 'Os Canarinhos',
    status: 'PUBLISHED',
    daysAgo: 21,
  },
  {
    title: 'Rascunho: antevisão da jornada 13',
    slug: 'antevisao-jornada-13',
    excerpt: 'Rascunho por publicar.',
    content: 'Texto em preparação.',
    image: null,
    author: 'Os Canarinhos',
    status: 'DRAFT',
    daysAgo: 0,
  },
];

export const TESTIMONIALS = [
  {
    quote:
      'Acompanho os Canarinhos há mais de dez anos. O ambiente nos jogos em casa é sempre especial, ganhe-se ou perca-se.',
    author: 'Ana Sousa',
    role: 'Sócia',
    initials: 'AS',
  },
  {
    quote:
      'As transmissões em direto permitem-me ver todos os jogos, mesmo quando estou fora de Lisboa.',
    author: 'Miguel Ramos',
    role: 'Adepto',
    initials: 'MR',
  },
  {
    quote:
      'Joguei aqui nos anos 90. Ver o clube com esta energia, quase 50 anos depois, enche-me de orgulho.',
    author: 'João Pires',
    role: 'Antigo jogador',
    initials: 'JP',
  },
  {
    quote: 'Uma equipa de amigos que joga com o coração. Domingo de manhã é dia de Canarinhos.',
    author: 'Carla Nunes',
    role: 'Adepta',
    initials: 'CN',
  },
];
