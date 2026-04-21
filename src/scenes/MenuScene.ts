// ─────────────────────────────────────
// FutebolFight — Cena do Menu Principal
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
    // ── Fundo gradiente animado ──────────────
    const fundo = this.add.graphics();
    this._desenharFundo(fundo, 0);

    this.tweens.addCounter({
      from: 0,
      to: 360,
      duration: 20000,
      repeat: -1,
      onUpdate: (tween) => {
        this._desenharFundo(fundo, tween.getValue() as number);
      },
    });

    // ── Partículas flutuantes ────────────────
    this.particulasGfx = this.add.graphics();
    for (let i = 0; i < 50; i++) {
      this.particulas.push({
        x: Math.random() * LARGURA_JOGO,
        y: Math.random() * ALTURA_JOGO,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.4 - 0.3,
        alfa: Math.random() * 0.4 + 0.1,
        tamanho: Math.random() * 3 + 1,
      });
    }

    // ── Título ───────────────────────────────
    const tituloY = 180;

    // Brilho atrás do título
    const brilho = this.add.text(LARGURA_JOGO / 2, tituloY, 'FUTEBOL\nFIGHT', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#42a5f5',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5).setAlpha(0.3).setScale(1.05);

    this.tweens.add({
      targets: brilho,
      alpha: 0.15,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const titulo = this.add.text(LARGURA_JOGO / 2, tituloY, 'FUTEBOL\nFIGHT', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 8,
      stroke: '#1565c0',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Flutuação suave
    this.tweens.add({
      targets: titulo,
      y: tituloY - 6,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── Subtítulo ────────────────────────────
    this.add.text(LARGURA_JOGO / 2, tituloY + 90, 'ARENA DE COMBATE', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '18px',
      color: '#8899aa',
      letterSpacing: 12,
    }).setOrigin(0.5);

    // ── Linha decorativa ─────────────────────
    const linhaGfx = this.add.graphics();
    linhaGfx.lineStyle(2, 0x42a5f5, 0.4);
    linhaGfx.lineBetween(LARGURA_JOGO / 2 - 160, tituloY + 120, LARGURA_JOGO / 2 + 160, tituloY + 120);

    // ── Botão Iniciar ────────────────────────
    this._criarBotao(LARGURA_JOGO / 2, 440, 'INICIAR PARTIDA', 0x1565c0, () => {
      this.cameras.main.fade(400, 0, 0, 0, false, (_cam: Phaser.Cameras.Scene2D.Camera, progresso: number) => {
        if (progresso >= 1) {
          this.scene.start('CenaSelecaoUniforme');
        }
      });
    });

    // ── Versão/crédito ───────────────────────
    this.add.text(LARGURA_JOGO / 2, ALTURA_JOGO - 30, 'Sprint 1 — O Alicerce  •  v0.1.0', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#445566',
    }).setOrigin(0.5);

    // ── Fade in ──────────────────────────────
    this.cameras.main.fadeIn(600, 0, 0, 0);

    // ── Loop de atualização para partículas ──
    this.events.on('update', this._atualizarParticulas, this);
  }

  private _desenharFundo(gfx: Phaser.GameObjects.Graphics, mudancaCor: number): void {
    gfx.clear();
    const passos = 40;
    for (let i = 0; i < passos; i++) {
      const t = i / passos;
      const r = Math.floor(Phaser.Math.Linear(8, 14, t));
      const g = Math.floor(Phaser.Math.Linear(10, 18, t));
      const b = Math.floor(Phaser.Math.Linear(20, 40 + Math.sin(mudancaCor * 0.0174) * 10, t));
      const cor = (r << 16) | (g << 8) | b;
      gfx.fillStyle(cor, 1);
      gfx.fillRect(0, (ALTURA_JOGO / passos) * i, LARGURA_JOGO, ALTURA_JOGO / passos + 1);
    }
  }

  private _atualizarParticulas(): void {
    this.particulasGfx.clear();
    for (const p of this.particulas) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) p.y = ALTURA_JOGO + 10;
      if (p.x < -10) p.x = LARGURA_JOGO + 10;
      if (p.x > LARGURA_JOGO + 10) p.x = -10;
      this.particulasGfx.fillStyle(0x42a5f5, p.alfa);
      this.particulasGfx.fillCircle(p.x, p.y, p.tamanho);
    }
  }

  private _criarBotao(x: number, y: number, rotulo: string, cor: number, aoClicar: () => void): void {
    const larg = 320;
    const alt = 56;

    const container = this.add.container(x, y);

    // Fundo do botão
    const fundoGfx = this.add.graphics();
    fundoGfx.fillStyle(cor, 0.9);
    fundoGfx.fillRoundedRect(-larg / 2, -alt / 2, larg, alt, 12);
    fundoGfx.lineStyle(2, 0x42a5f5, 0.5);
    fundoGfx.strokeRoundedRect(-larg / 2, -alt / 2, larg, alt, 12);

    // Brilho no topo
    const brilhoGfx = this.add.graphics();
    brilhoGfx.fillStyle(0xffffff, 0.08);
    brilhoGfx.fillRoundedRect(-larg / 2 + 2, -alt / 2 + 2, larg - 4, alt / 2 - 2, { tl: 10, tr: 10, bl: 0, br: 0 });

    const texto = this.add.text(0, 0, rotulo, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([fundoGfx, brilhoGfx, texto]);
    container.setSize(larg, alt);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 150, ease: 'Back.easeOut' });
      texto.setColor('#e3f2fd');
    });
    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 150, ease: 'Back.easeOut' });
      texto.setColor('#ffffff');
    });
    container.on('pointerdown', () => {
      this.tweens.add({ targets: container, scaleX: 0.95, scaleY: 0.95, duration: 80 });
    });
    container.on('pointerup', () => {
      this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 80 });
      aoClicar();
    });

    // Animação de entrada
    container.setAlpha(0).setScale(0.8);
    this.tweens.add({
      targets: container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      delay: 400,
      ease: 'Back.easeOut',
    });
  }
}
