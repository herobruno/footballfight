// ─────────────────────────────────────────────
// FutebolFight — Constantes do Jogo
// ─────────────────────────────────────────────

export const LARGURA_JOGO = 1280;
export const ALTURA_JOGO = 720;

// ─── Física do Jogador ───────────────────────
export const VELOCIDADE_ANDAR = 260;
export const VELOCIDADE_CORRER = 420;
export const FORCA_PULO = -520;
export const TAMANHO_JOGADOR = { largura: 56, altura: 61 };
export const CHAO_Y = 710;

// ─── Vigor / Estamina ────────────────────────
export const VIGOR_MAXIMO = 100;
export const VIDA_MAXIMA = 100;
export const GASTO_VIGOR_CORRER = 18;       // por segundo
export const REGEN_VIGOR_PARADO = 10;       // por segundo
export const REGEN_VIGOR_ANDANDO = 5;       // por segundo
export const LIMIAR_EXAUSTO = 5;            // abaixo disso fica ofegante

// ─── Ciclo de Horário (Paleta PS1: Verde, Marrom, Preto, Branco) ────────────────────────
export interface PresetHorario {
  nome: string;
  ceuTopo: number;
  ceuBase: number;
  corGrama: number;
  alfaAmbiente: number;
  corAmbiente: number;
  rotuloPt: string;
}

export const CICLOS_HORARIO: PresetHorario[] = [
  {
    nome: 'manha',
    ceuTopo: 0x2ecc71, // Verde
    ceuBase: 0xffffff, // Branco
    corGrama: 0x27ae60,
    alfaAmbiente: 0,
    corAmbiente: 0xffffff,
    rotuloPt: 'Manhã Verde',
  },
  {
    nome: 'golden',
    ceuTopo: 0x8d6e63, // Marrom
    ceuBase: 0x5d4037, // Marrom Escuro
    corGrama: 0x3e2723,
    alfaAmbiente: 0.1,
    corAmbiente: 0x5d4037,
    rotuloPt: 'Terra Batida',
  },
  {
    nome: 'noite',
    ceuTopo: 0x000033, // Azul escuro
    ceuBase: 0x000000, // Preto
    corGrama: 0x050510,
    alfaAmbiente: 0.6,
    corAmbiente: 0x000022, // Tom azulado para a noite
    rotuloPt: 'Noite Sombria',
  },
];

// ─── Dados de Uniforme (Paleta PS1) ───────────────────────
export interface OpcaoUniforme {
  id: string;
  nomeTime: string;
  corPrimaria: number;
  corSecundaria: number;
  corDestaque: number;
  rotuloPt: string;
}

export const UNIFORMES: OpcaoUniforme[] = [
  {
    id: 'azul',
    nomeTime: 'Garra',
    corPrimaria: 0x004DD6,    // Azul neon principal
    corSecundaria: 0xF1F1F1,  // Branco da fonte
    corDestaque: 0x0C439F,    // Azul brilho
    rotuloPt: 'Garra',
  },
  {
    id: 'branco',
    nomeTime: 'Sangue Futebol',
    corPrimaria: 0xF1F1F1,    // Branco da fonte
    corSecundaria: 0x004DD6,  // Azul neon principal
    corDestaque: 0x374459,    // Cinza azulado
    rotuloPt: 'Sangue Futebol',
  },
];
