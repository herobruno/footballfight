// ─────────────────────────────────────
// FutebolFight — Cena do Menu Principal
// Estilo PS1: Verde, Branco, Marrom, Preto
// ─────────────────────────────────────

import Phaser from 'phaser';
import { LARGURA_JOGO, ALTURA_JOGO } from '../constantes';

export class CenaMenu extends Phaser.Scene {
  private particulas: { x: number; y: number; vx: number; vy: number; alfa: number; tamanho: number }[] = [];
  private particulasGfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'CenaMenu' });
  }

  create(): void {
    // ── Fundo com a imagem inicial.png ────────────────────
    this.add.image(LARGURA_JOGO / 2, ALTURA_JOGO / 2, 'inicial')
      .setDisplaySize(LARGURA_JOGO, ALTURA_JOGO);

    // ── Botão Iniciar (Estilo PS1 - Bloco) ────────────────────────
    this._criarBotao(LARGURA_JOGO / 2, 460, 'INICIAR JOGO', 0x27ae60, () => {
      this.cameras.main.fade(400, 0, 0, 0, false, (_cam: Phaser.Cameras.Scene2D.Camera, progresso: number) => {
        if (progresso >= 1) {
          this.scene.start('CenaSelecaoUniforme');
        }
      });
    });

    // ── Créditos ───────────────────────
    this.add.text(LARGURA_JOGO / 2, ALTURA_JOGO - 40, '© 1998 DEEPMIND GAMES - LICENSED BY PS1', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private _desenharFundo(gfx: Phaser.GameObjects.Graphics): void {
    gfx.clear();
    // Gradiente seco entre verde grama e preto/marrom
    const passos = 10; // Menos passos para look mais posterizado/PS1
    for (let i = 0; i < passos; i++) {
      const t = i / passos;
      const r = Math.floor(Phaser.Math.Linear(10, 46, t));
      const g = Math.floor(Phaser.Math.Linear(60, 20, t));
      const b = Math.floor(Phaser.Math.Linear(20, 10, t));
      gfx.fillStyle((r << 16) | (g << 8) | b, 1);
      gfx.fillRect(0, (ALTURA_JOGO / passos) * i, LARGURA_JOGO, ALTURA_JOGO / passos + 1);
    }
  }

  private _atualizarParticulas(): void {
    this.particulasGfx.clear();
    for (const p of this.particulas) {
      p.y += p.vy;
      if (p.y > ALTURA_JOGO) p.y = -10;
      // Partículas quadradas (pixeladas)
      this.particulasGfx.fillStyle(0xffffff, p.alfa);
      this.particulasGfx.fillRect(p.x, p.y, p.tamanho, p.tamanho);
    }
  }

  private _criarBotao(x: number, y: number, rotulo: string, cor: number, aoClicar: () => void): void {
    const larg = 300;
    const alt = 60;
    const container = this.add.container(x, y);

    // Botão estilo PS1: Borda branca grossa, fundo preto/verde
    const fundo = this.add.graphics();
    fundo.fillStyle(0x000000, 1);
    fundo.fillRect(-larg/2, -alt/2, larg, alt);
    fundo.lineStyle(4, 0xffffff, 1);
    fundo.strokeRect(-larg/2, -alt/2, larg, alt);

    const texto = this.add.text(0, 0, rotulo, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([fundo, texto]);
    container.setSize(larg, alt);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      fundo.clear();
      fundo.fillStyle(0x27ae60, 1); // Verde ao passar o mouse
      fundo.fillRect(-larg/2, -alt/2, larg, alt);
      fundo.lineStyle(4, 0xffffff, 1);
      fundo.strokeRect(-larg/2, -alt/2, larg, alt);
    });

    container.on('pointerout', () => {
      fundo.clear();
      fundo.fillStyle(0x000000, 1);
      fundo.fillRect(-larg/2, -alt/2, larg, alt);
      fundo.lineStyle(4, 0xffffff, 1);
      fundo.strokeRect(-larg/2, -alt/2, larg, alt);
    });

    container.on('pointerdown', () => {
      aoClicar();
    });
  }
}
