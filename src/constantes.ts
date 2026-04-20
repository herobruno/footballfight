// ─────────────────────────────────────────────
// FutebolFight — Constantes do Jogo
// ─────────────────────────────────────────────

export const LARGURA_JOGO = 1280;
export const ALTURA_JOGO = 720;

// ─── Física do Jogador ───────────────────────
export const VELOCIDADE_ANDAR = 260;
export const VELOCIDADE_CORRER = 420;
export const FORCA_PULO = -520;
export const TAMANHO_JOGADOR = { largura: 48, altura: 72 };
export const CHAO_Y = 580;

// ─── Vigor / Estamina ────────────────────────
export const VIGOR_MAXIMO = 100;
export const GASTO_VIGOR_CORRER = 18;       // por segundo
export const REGEN_VIGOR_PARADO = 10;       // por segundo
export const REGEN_VIGOR_ANDANDO = 5;       // por segundo
export const LIMIAR_EXAUSTO = 5;            // abaixo disso fica ofegante

// ─── Ciclo de Horário ────────────────────────
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
    ceuTopo: 0x87ceeb,
    ceuBase: 0xffecd2,
    corGrama: 0x4caf50,
    alfaAmbiente: 0.05,
    corAmbiente: 0xffee58,
    rotuloPt: 'Manhã',
  },
  {
    nome: 'golden',
    ceuTopo: 0xff8f00,
    ceuBase: 0xffd54f,
    corGrama: 0x558b2f,
    alfaAmbiente: 0.15,
    corAmbiente: 0xff6f00,
    rotuloPt: 'Golden Hour',
  },
  {
    nome: 'noite',
    ceuTopo: 0x0d1b2a,
    ceuBase: 0x1b2838,
    corGrama: 0x1b5e20,
    alfaAmbiente: 0.35,
    corAmbiente: 0x1a237e,
    rotuloPt: 'Noite',
  },
];

// ─── Dados de Uniforme ───────────────────────
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
    nomeTime: 'Team Cobalt',
    corPrimaria: 0x1565c0,
    corSecundaria: 0xffffff,
    corDestaque: 0x42a5f5,
    rotuloPt: 'Competidor Azul',
  },
  {
    id: 'amarelo',
    nomeTime: 'Team Amber',
    corPrimaria: 0xf9a825,
    corSecundaria: 0xffffff,
    corDestaque: 0xffee58,
    rotuloPt: 'Competidor Amarelo',
  },
];
