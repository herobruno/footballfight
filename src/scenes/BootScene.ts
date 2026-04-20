// ─────────────────────────────────────
// FutebolFight — Cena de Inicialização
// Gera todas as texturas proceduralmente
// ─────────────────────────────────────

import Phaser from 'phaser';
import { LARGURA_JOGO, ALTURA_JOGO, UNIFORMES } from '../constantes';

export class CenaInicializacao extends Phaser.Scene {
  constructor() {
    super({ key: 'CenaInicializacao' });
  }

  preload(): void {
    // Barra de carregamento
    const larguraBarra = 400;
    const alturaBarra = 8;
    const barraX = (LARGURA_JOGO - larguraBarra) / 2;
    const barraY = ALTURA_JOGO / 2;

    const fundo = this.add.rectangle(LARGURA_JOGO / 2, barraY, larguraBarra, alturaBarra, 0x222233, 1);
    fundo.setStrokeStyle(1, 0x444466);
    const preenchimento = this.add.rectangle(barraX + 2, barraY, 0, alturaBarra - 4, 0x42a5f5, 1);
    preenchimento.setOrigin(0, 0.5);

    const rotulo = this.add.text(LARGURA_JOGO / 2, barraY - 40, 'CARREGANDO...', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '14px',
      color: '#aabbcc',
    }).setOrigin(0.5);

    this.load.on('progress', (valor: number) => {
      preenchimento.width = (larguraBarra - 4) * valor;
    });
    this.load.on('complete', () => {
      fundo.destroy();
      preenchimento.destroy();
      rotulo.destroy();
    });
  }

  create(): void {
    this._gerarTexturas();
    this.scene.start('CenaMenu');
  }

  // ─── Geração procedural de texturas ────────
  private _gerarTexturas(): void {
    // Gerar sprites de jogador para cada uniforme
    for (const uniforme of UNIFORMES) {
      this._criarTexturaJogador(uniforme.id, uniforme.corPrimaria, uniforme.corSecundaria);
    }

    // Bola
    const bolaCfx = this.make.graphics({ x: 0, y: 0 });
    bolaCfx.fillStyle(0xffffff, 1);
    bolaCfx.fillCircle(12, 12, 12);
    bolaCfx.fillStyle(0x222222, 1);
    for (let i = 0; i < 5; i++) {
      const angulo = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      bolaCfx.fillCircle(12 + Math.cos(angulo) * 6, 12 + Math.sin(angulo) * 6, 3);
    }
    bolaCfx.generateTexture('bola', 24, 24);
    bolaCfx.destroy();

    // Partícula
    const partGfx = this.make.graphics({ x: 0, y: 0 });
    partGfx.fillStyle(0xffffff, 1);
    partGfx.fillCircle(4, 4, 4);
    partGfx.generateTexture('particula', 8, 8);
    partGfx.destroy();
  }

  private _criarTexturaJogador(chave: string, primaria: number, secundaria: number): void {
    const larg = 48;
    const alt = 72;

    // ── Frame Parado ─────────────────────────
    const gfx = this.make.graphics({ x: 0, y: 0 });

    // Pernas (calção + chuteiras)
    gfx.fillStyle(secundaria, 1);
    gfx.fillRect(12, 48, 10, 20);   // perna esquerda
    gfx.fillRect(26, 48, 10, 20);   // perna direita
    gfx.fillStyle(0x222222, 1);
    gfx.fillRect(12, 64, 10, 8);    // chuteira esquerda
    gfx.fillRect(26, 64, 10, 8);    // chuteira direita

    // Torso (camisa)
    gfx.fillStyle(primaria, 1);
    gfx.fillRoundedRect(8, 20, 32, 30, 4);
    // Faixa da camisa
    gfx.fillStyle(secundaria, 0.6);
    gfx.fillRect(8, 32, 32, 6);

    // Braços
    gfx.fillStyle(primaria, 1);
    gfx.fillRect(2, 22, 8, 18);     // braço esquerdo
    gfx.fillRect(38, 22, 8, 18);    // braço direito
    // Mãos
    gfx.fillStyle(0xe0a97a, 1);
    gfx.fillRect(3, 38, 6, 6);      // mão esquerda
    gfx.fillRect(39, 38, 6, 6);     // mão direita

    // Cabeça
    gfx.fillStyle(0xe0a97a, 1);
    gfx.fillCircle(24, 12, 12);
    // Cabelo
    gfx.fillStyle(0x3e2723, 1);
    gfx.fillEllipse(24, 6, 22, 12);
    // Olhos
    gfx.fillStyle(0x111111, 1);
    gfx.fillCircle(19, 12, 2);
    gfx.fillCircle(29, 12, 2);
    // Número na camisa
    gfx.fillStyle(secundaria, 1);
    gfx.fillRect(20, 26, 8, 10);

    gfx.generateTexture(`jogador_${chave}`, larg, alt);
    gfx.destroy();

    // ── Frames de Corrida (2 alternados) ─────
    for (let quadro = 0; quadro < 2; quadro++) {
      const gfxC = this.make.graphics({ x: 0, y: 0 });
      const deslocamento = quadro === 0 ? -4 : 4;

      // Pernas alternadas
      gfxC.fillStyle(secundaria, 1);
      gfxC.fillRect(12 + deslocamento, 48, 10, 20);
      gfxC.fillRect(26 - deslocamento, 48, 10, 20);
      gfxC.fillStyle(0x222222, 1);
      gfxC.fillRect(12 + deslocamento, 64, 10, 8);
      gfxC.fillRect(26 - deslocamento, 64, 10, 8);

      // Torso
      gfxC.fillStyle(primaria, 1);
      gfxC.fillRoundedRect(8, 20, 32, 30, 4);
      gfxC.fillStyle(secundaria, 0.6);
      gfxC.fillRect(8, 32, 32, 6);

      // Braços balançando
      gfxC.fillStyle(primaria, 1);
      gfxC.fillRect(2, 22 - deslocamento, 8, 18);
      gfxC.fillRect(38, 22 + deslocamento, 8, 18);
      gfxC.fillStyle(0xe0a97a, 1);
      gfxC.fillRect(3, 38 - deslocamento, 6, 6);
      gfxC.fillRect(39, 38 + deslocamento, 6, 6);

      // Cabeça
      gfxC.fillStyle(0xe0a97a, 1);
      gfxC.fillCircle(24, 12, 12);
      gfxC.fillStyle(0x3e2723, 1);
      gfxC.fillEllipse(24, 6, 22, 12);
      gfxC.fillStyle(0x111111, 1);
      gfxC.fillCircle(19, 12, 2);
      gfxC.fillCircle(29, 12, 2);
      gfxC.fillStyle(secundaria, 1);
      gfxC.fillRect(20, 26, 8, 10);

      gfxC.generateTexture(`jogador_${chave}_correndo${quadro}`, larg, alt);
      gfxC.destroy();
    }

    // ── Frame Ofegante (Exausto) ─────────────
    const gfxE = this.make.graphics({ x: 0, y: 0 });

    // Pernas levemente dobradas
    gfxE.fillStyle(secundaria, 1);
    gfxE.fillRect(10, 50, 10, 18);
    gfxE.fillRect(28, 50, 10, 18);
    gfxE.fillStyle(0x222222, 1);
    gfxE.fillRect(10, 64, 10, 8);
    gfxE.fillRect(28, 64, 10, 8);

    // Torso curvado
    gfxE.fillStyle(primaria, 0.85);
    gfxE.fillRoundedRect(8, 24, 32, 28, 4);
    gfxE.fillStyle(secundaria, 0.4);
    gfxE.fillRect(8, 36, 32, 5);

    // Braços caídos
    gfxE.fillStyle(primaria, 0.85);
    gfxE.fillRect(4, 26, 7, 20);
    gfxE.fillRect(37, 26, 7, 20);
    gfxE.fillStyle(0xe0a97a, 1);
    gfxE.fillRect(5, 44, 5, 5);
    gfxE.fillRect(38, 44, 5, 5);

    // Cabeça abaixada
    gfxE.fillStyle(0xe0a97a, 1);
    gfxE.fillCircle(24, 16, 11);
    gfxE.fillStyle(0x3e2723, 1);
    gfxE.fillEllipse(24, 10, 20, 11);
    gfxE.fillStyle(0x111111, 1);
    gfxE.fillCircle(20, 17, 1.5);
    gfxE.fillCircle(28, 17, 1.5);

    // Gotas de suor
    gfxE.fillStyle(0x64b5f6, 0.8);
    gfxE.fillCircle(34, 14, 2);
    gfxE.fillCircle(38, 20, 1.5);

    gfxE.generateTexture(`jogador_${chave}_ofegante`, larg, alt);
    gfxE.destroy();
  }
}
