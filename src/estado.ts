// ─────────────────────────────────────
// FutebolFight — Estado Global do Jogo
// ─────────────────────────────────────

import { UNIFORMES, CICLOS_HORARIO, type OpcaoUniforme, type PresetHorario } from './constantes';

export interface EstadoJogo {
  uniformeJogador1: OpcaoUniforme;
  uniformeJogador2: OpcaoUniforme;
  cicloHorario: PresetHorario;
}

// Estado singleton
const estado: EstadoJogo = {
  uniformeJogador1: UNIFORMES[0],   // Azul
  uniformeJogador2: UNIFORMES[1],   // Amarelo
  cicloHorario: CICLOS_HORARIO[0],  // Manhã
};

export function obterEstado(): EstadoJogo {
  return estado;
}

export function definirUniformeJogador1(uniforme: OpcaoUniforme): void {
  estado.uniformeJogador1 = uniforme;
  // auto-atribuir oponente com o uniforme oposto
  estado.uniformeJogador2 = UNIFORMES.find(u => u.id !== uniforme.id) || UNIFORMES[1];
}

export function definirCicloHorario(ciclo: PresetHorario): void {
  estado.cicloHorario = ciclo;
}
