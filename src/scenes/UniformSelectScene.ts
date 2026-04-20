// ─────────────────────────────────────────────
// FutebolFight — Cena de Seleção de Uniforme
// Sprint 1: Seleção de Uniforme + Ciclo de Horário
// ─────────────────────────────────────────────

import Phaser from 'phaser';
import {
  LARGURA_JOGO, ALTURA_JOGO,
  UNIFORMES, CICLOS_HORARIO,
  type OpcaoUniforme, type PresetHorario,
} from '../constantes';
import { obterEstado, definirUniformeJogador1, definirCicloHorario } from '../estado';

export class CenaSelecaoUniforme extends Phaser.Scene {
  private uniformeSelecionado: OpcaoUniforme = UNIFORMES[0];
  private cicloSelecionado: PresetHorario = CICLOS_HORARIO[0];
  private spritePreview!: Phaser.GameObjects.Image;
  private fundoPreview!: Phaser.GameObjects.Graphics;
  private cartoesUniforme: Phaser.GameObjects.Container[] = [];
  private cartoesCiclo: Phaser.GameObjects.Container[] = [];
  private spriteOponente!: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'CenaSelecaoUniforme' });
  }

  create(): void {
    const estado = obterEstado();
    this.uniformeSelecionado = estado.uniformeJogador1;
    this.cicloSelecionado = estado.cicloHorario;

    // ── Fundo ────────────────────────────────
    this._desenharFundo();

    // ── Título ───────────────────────────────
    this.add.text(LARGURA_JOGO / 2, 40, 'SELEÇÃO DE UNIFORME', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#1565c0',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Linha decorativa
    const linhaGfx = this.add.graphics();
    linhaGfx.lineStyle(2, 0x42a5f5, 0.3);
    linhaGfx.lineBetween(LARGURA_JOGO / 2 - 200, 65, LARGURA_JOGO / 2 + 200, 65);

    // ── Cartões de Uniforme ──────────────────
    this.add.text(200, 100, 'ESCOLHA SEU TIME', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '16px',
      color: '#8899aa',
      letterSpacing: 4,
    }).setOrigin(0.5);

    UNIFORMES.forEach((u, i) => {
      const cartao = this._criarCartaoUniforme(80 + i * 240, 200, u);
      this.cartoesUniforme.push(cartao);
    });

    // ── Preview dos Jogadores ────────────────
    this.add.text(LARGURA_JOGO / 2, 100, 'PREVIEW', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '16px',
      color: '#8899aa',
      letterSpacing: 4,
    }).setOrigin(0.5);

    // Área de preview com fundo
    this.fundoPreview = this.add.graphics();
    this._desenharFundoPreview();

    // Rótulo VS
    this.add.text(LARGURA_JOGO / 2, 280, 'VS', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ff6f00',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0.8);

    // Preview Jogador 1
    this.spritePreview = this.add.image(LARGURA_JOGO / 2 - 80, 280, `jogador_${this.uniformeSelecionado.id}`)
      .setScale(2.5)
      .setOrigin(0.5);

    // Preview Oponente
    const oponente = UNIFORMES.find(u => u.id !== this.uniformeSelecionado.id) || UNIFORMES[1];
    this.spriteOponente = this.add.image(LARGURA_JOGO / 2 + 80, 280, `jogador_${oponente.id}`)
      .setScale(2.5)
      .setOrigin(0.5)
      .setFlipX(true);

    // Rótulos dos jogadores
    this.add.text(LARGURA_JOGO / 2 - 80, 360, 'JOGADOR 1', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#66aadd',
    }).setOrigin(0.5);

    this.add.text(LARGURA_JOGO / 2 + 80, 360, 'CPU / J2', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#aa6666',
    }).setOrigin(0.5);

    // Animação de flutuação
    this.tweens.add({
      targets: [this.spritePreview, this.spriteOponente],
      y: '-=6',
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── Seleção de Ciclo de Horário ──────────
    this.add.text(LARGURA_JOGO - 200, 100, 'HORÁRIO', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '16px',
      color: '#8899aa',
      letterSpacing: 4,
    }).setOrigin(0.5);

    CICLOS_HORARIO.forEach((ciclo, i) => {
      const cartao = this._criarCartaoCiclo(LARGURA_JOGO - 320 + i * 120, 200, ciclo);
      this.cartoesCiclo.push(cartao);
    });

    // ── Dicas de controles ───────────────────
    const controlesY = 440;
    this.add.text(LARGURA_JOGO / 2, controlesY, '─── CONTROLES ───', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      color: '#556677',
      letterSpacing: 6,
    }).setOrigin(0.5);

    const controles = [
      ['A / D  ou  ← / →', 'Mover'],
      ['W  ou  ↑', 'Pular'],
      ['SHIFT', 'Correr'],
    ];

    controles.forEach(([tecla, descricao], i) => {
      const linha = controlesY + 30 + i * 28;
      this.add.text(LARGURA_JOGO / 2 - 120, linha, tecla, {
        fontFamily: 'Orbitron, monospace',
        fontSize: '13px',
        color: '#42a5f5',
      }).setOrigin(0, 0.5);
      this.add.text(LARGURA_JOGO / 2 + 120, linha, descricao, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '13px',
        color: '#778899',
      }).setOrigin(1, 0.5);
    });

    // ── Botão Entrar na Arena ─────────────────
    this._criarBotaoIniciar(LARGURA_JOGO / 2, ALTURA_JOGO - 60);

    // ── Botão Voltar ─────────────────────────
    const botaoVoltar = this.add.text(60, ALTURA_JOGO - 30, '← VOLTAR', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      color: '#556677',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    botaoVoltar.on('pointerover', () => botaoVoltar.setColor('#aabbcc'));
    botaoVoltar.on('pointerout', () => botaoVoltar.setColor('#556677'));
    botaoVoltar.on('pointerup', () => {
      this.cameras.main.fade(300, 0, 0, 0, false, (_c: Phaser.Cameras.Scene2D.Camera, p: number) => {
        if (p >= 1) this.scene.start('CenaMenu');
      });
    });

    // ── Fade in ──────────────────────────────
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this._destacarSelecionados();
  }

  // ─── Cartão de Uniforme ──────────────────
  private _criarCartaoUniforme(x: number, y: number, uniforme: OpcaoUniforme): Phaser.GameObjects.Container {
    const larg = 200;
    const alt = 200;
    const container = this.add.container(x, y);

    // Fundo do cartão
    const fundoCartao = this.add.graphics();
    fundoCartao.fillStyle(0x111122, 0.9);
    fundoCartao.fillRoundedRect(0, 0, larg, alt, 12);
    fundoCartao.lineStyle(2, 0x222244, 0.6);
    fundoCartao.strokeRoundedRect(0, 0, larg, alt, 12);

    // Amostra de cor
    const amostra = this.add.graphics();
    amostra.fillStyle(uniforme.corPrimaria, 1);
    amostra.fillRoundedRect(20, 20, larg - 40, 60, 8);
    amostra.fillStyle(uniforme.corSecundaria, 0.3);
    amostra.fillRect(20, 50, larg - 40, 10);

    // Sprite no cartão
    const sprite = this.add.image(larg / 2, 120, `jogador_${uniforme.id}`).setScale(1.5);

    // Nome do time
    const nome = this.add.text(larg / 2, alt - 25, uniforme.rotuloPt, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      color: '#ccddee',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([fundoCartao, amostra, sprite, nome]);
    container.setSize(larg, alt);
    container.setInteractive({ useHandCursor: true });
    container.setData('uniforme', uniforme);

    container.on('pointerup', () => {
      this.uniformeSelecionado = uniforme;
      definirUniformeJogador1(uniforme);
      this._atualizarPreview();
      this._destacarSelecionados();
    });

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 150, ease: 'Back.easeOut' });
    });
    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 150 });
    });

    return container;
  }

  // ─── Cartão de Ciclo Horário ─────────────
  private _criarCartaoCiclo(x: number, y: number, ciclo: PresetHorario): Phaser.GameObjects.Container {
    const larg = 100;
    const alt = 130;
    const container = this.add.container(x, y);

    const fundo = this.add.graphics();
    fundo.fillStyle(0x111122, 0.9);
    fundo.fillRoundedRect(0, 0, larg, alt, 10);
    fundo.lineStyle(2, 0x222244, 0.6);
    fundo.strokeRoundedRect(0, 0, larg, alt, 10);

    // Preview do gradiente do céu
    const ceuGfx = this.add.graphics();
    const passos = 8;
    for (let i = 0; i < passos; i++) {
      const t = i / passos;
      const topoR = (ciclo.ceuTopo >> 16) & 0xff;
      const topoG = (ciclo.ceuTopo >> 8) & 0xff;
      const topoB = ciclo.ceuTopo & 0xff;
      const baseR = (ciclo.ceuBase >> 16) & 0xff;
      const baseG = (ciclo.ceuBase >> 8) & 0xff;
      const baseB = ciclo.ceuBase & 0xff;
      const r = Math.floor(Phaser.Math.Linear(topoR, baseR, t));
      const g = Math.floor(Phaser.Math.Linear(topoG, baseG, t));
      const b = Math.floor(Phaser.Math.Linear(topoB, baseB, t));
      ceuGfx.fillStyle((r << 16) | (g << 8) | b, 1);
      ceuGfx.fillRect(12, 12 + (56 / passos) * i, larg - 24, 56 / passos + 1);
    }

    // Faixa de grama
    ceuGfx.fillStyle(ciclo.corGrama, 1);
    ceuGfx.fillRect(12, 68, larg - 24, 12);

    // Rótulo
    const rotulo = this.add.text(larg / 2, alt - 22, ciclo.rotuloPt, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#aabbcc',
    }).setOrigin(0.5);

    container.add([fundo, ceuGfx, rotulo]);
    container.setSize(larg, alt);
    container.setInteractive({ useHandCursor: true });
    container.setData('ciclo', ciclo);

    container.on('pointerup', () => {
      this.cicloSelecionado = ciclo;
      definirCicloHorario(ciclo);
      this._desenharFundoPreview();
      this._destacarSelecionados();
    });

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scaleX: 1.06, scaleY: 1.06, duration: 150, ease: 'Back.easeOut' });
    });
    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 150 });
    });

    return container;
  }

  // ─── Métodos auxiliares ────────────────────
  private _desenharFundo(): void {
    const fundo = this.add.graphics();
    const passos = 30;
    for (let i = 0; i < passos; i++) {
      const t = i / passos;
      const r = Math.floor(Phaser.Math.Linear(8, 12, t));
      const g = Math.floor(Phaser.Math.Linear(10, 15, t));
      const b = Math.floor(Phaser.Math.Linear(20, 30, t));
      fundo.fillStyle((r << 16) | (g << 8) | b, 1);
      fundo.fillRect(0, (ALTURA_JOGO / passos) * i, LARGURA_JOGO, ALTURA_JOGO / passos + 1);
    }
  }

  private _desenharFundoPreview(): void {
    this.fundoPreview.clear();
    const cx = LARGURA_JOGO / 2;
    const cy = 280;
    const larg = 260;
    const alt = 200;

    // Mini arena com cores do ciclo horário
    const ciclo = this.cicloSelecionado;
    const passos = 10;
    for (let i = 0; i < passos; i++) {
      const t = i / passos;
      const topoR = (ciclo.ceuTopo >> 16) & 0xff;
      const topoG = (ciclo.ceuTopo >> 8) & 0xff;
      const topoB = ciclo.ceuTopo & 0xff;
      const baseR = (ciclo.ceuBase >> 16) & 0xff;
      const baseG = (ciclo.ceuBase >> 8) & 0xff;
      const baseB = ciclo.ceuBase & 0xff;
      const r = Math.floor(Phaser.Math.Linear(topoR, baseR, t));
      const g = Math.floor(Phaser.Math.Linear(topoG, baseG, t));
      const b = Math.floor(Phaser.Math.Linear(topoB, baseB, t));
      this.fundoPreview.fillStyle((r << 16) | (g << 8) | b, 0.5);
      this.fundoPreview.fillRect(cx - larg / 2, cy - alt / 2 + (alt / passos) * i, larg, alt / passos + 1);
    }

    // Borda
    this.fundoPreview.lineStyle(2, 0x334455, 0.5);
    this.fundoPreview.strokeRoundedRect(cx - larg / 2, cy - alt / 2, larg, alt, 10);
  }

  private _atualizarPreview(): void {
    this.spritePreview.setTexture(`jogador_${this.uniformeSelecionado.id}`);
    const oponente = UNIFORMES.find(u => u.id !== this.uniformeSelecionado.id) || UNIFORMES[1];
    this.spriteOponente.setTexture(`jogador_${oponente.id}`);
  }

  private _destacarSelecionados(): void {
    // Destacar cartões de uniforme
    this.cartoesUniforme.forEach(cartao => {
      const u = cartao.getData('uniforme') as OpcaoUniforme;
      const selecionado = u.id === this.uniformeSelecionado.id;
      const fundo = cartao.list[0] as Phaser.GameObjects.Graphics;
      fundo.clear();
      fundo.fillStyle(selecionado ? 0x1a2244 : 0x111122, 0.9);
      fundo.fillRoundedRect(0, 0, 200, 200, 12);
      fundo.lineStyle(2, selecionado ? 0x42a5f5 : 0x222244, selecionado ? 1 : 0.6);
      fundo.strokeRoundedRect(0, 0, 200, 200, 12);
    });

    // Destacar cartões de ciclo
    this.cartoesCiclo.forEach(cartao => {
      const c = cartao.getData('ciclo') as PresetHorario;
      const selecionado = c.nome === this.cicloSelecionado.nome;
      const fundo = cartao.list[0] as Phaser.GameObjects.Graphics;
      fundo.clear();
      fundo.fillStyle(selecionado ? 0x1a2244 : 0x111122, 0.9);
      fundo.fillRoundedRect(0, 0, 100, 130, 10);
      fundo.lineStyle(2, selecionado ? 0x42a5f5 : 0x222244, selecionado ? 1 : 0.6);
      fundo.strokeRoundedRect(0, 0, 100, 130, 10);
    });
  }

  private _criarBotaoIniciar(x: number, y: number): void {
    const larg = 280;
    const alt = 50;
    const container = this.add.container(x, y);

    const fundo = this.add.graphics();
    fundo.fillGradientStyle(0x1565c0, 0x1565c0, 0x0d47a1, 0x0d47a1, 1);
    fundo.fillRoundedRect(-larg / 2, -alt / 2, larg, alt, 10);
    fundo.lineStyle(2, 0x42a5f5, 0.6);
    fundo.strokeRoundedRect(-larg / 2, -alt / 2, larg, alt, 10);

    // Brilho
    const brilho = this.add.graphics();
    brilho.fillStyle(0xffffff, 0.06);
    brilho.fillRoundedRect(-larg / 2 + 2, -alt / 2 + 2, larg - 4, alt / 2 - 4, { tl: 8, tr: 8, bl: 0, br: 0 });

    const texto = this.add.text(0, 0, '⚡  ENTRAR NA ARENA  ⚡', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([fundo, brilho, texto]);
    container.setSize(larg, alt);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scaleX: 1.06, scaleY: 1.06, duration: 150, ease: 'Back.easeOut' });
    });
    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 150 });
    });
    container.on('pointerdown', () => {
      this.tweens.add({ targets: container, scaleX: 0.94, scaleY: 0.94, duration: 80 });
    });
    container.on('pointerup', () => {
      this.cameras.main.fade(500, 0, 0, 0, false, (_c: Phaser.Cameras.Scene2D.Camera, p: number) => {
        if (p >= 1) this.scene.start('CenaJogo');
      });
    });
  }
}
