// ─────────────────────────────────────────────
// FutebolFight — Cena de Seleção de Uniforme
// Layout em 3 colunas — PS1 Style
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
  private spritePreview!: Phaser.GameObjects.Sprite;
  private spriteOponente!: Phaser.GameObjects.Sprite;
  private cartoesUniforme: Phaser.GameObjects.Container[] = [];
  private cartoesCiclo: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'CenaSelecaoUniforme' });
  }

  create(): void {
    const estado = obterEstado();
    this.uniformeSelecionado = estado.uniformeJogador1;
    this.cicloSelecionado = estado.cicloHorario;

    // ── Fundo ─────────────────────────────────
    this.add.rectangle(0, 0, LARGURA_JOGO, ALTURA_JOGO, 0x0a2a0a).setOrigin(0, 0);

    // ── Título Topo ───────────────────────────
    const headerH = 80;
    this.add.rectangle(LARGURA_JOGO / 2, headerH / 2, LARGURA_JOGO, headerH, 0x000000).setOrigin(0.5, 0.5);
    this.add.text(LARGURA_JOGO / 2, headerH / 2, 'SELEÇÃO DE ATLETAS', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '36px',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);

    // Linha divisória
    this.add.rectangle(LARGURA_JOGO / 2, headerH, LARGURA_JOGO, 4, 0xffffff).setOrigin(0.5, 0.5);

    // ─────────────────────────────────────────
    // Layout em 3 zonas horizontais:
    // [  TIMES  ] [   VS PREVIEW   ] [ CLIMA ]
    // X: 0-380    X: 380-900         X: 900-1280
    // ─────────────────────────────────────────

    const zonaEsq  = { x: 0,   larg: 380 };
    const zonaC    = { x: 380, larg: 520 };
    const zonaDir  = { x: 900, larg: 380 };
    const conteudoY = headerH + 20;
    const alturaUtil = ALTURA_JOGO - headerH - 100; // desconta header e rodapé

    // ── COLUNA ESQUERDA — Times ───────────────
    this._desenharSeparador(zonaEsq.x, zonaEsq.x + zonaEsq.larg, 'ESCOLHER TIME', conteudoY);

    const cartaoLarg = 160;
    const cartaoAlt  = 220;
    const gap = 20;
    const totalTimesLarg = UNIFORMES.length * cartaoLarg + (UNIFORMES.length - 1) * gap;
    const timesStartX = zonaEsq.x + (zonaEsq.larg - totalTimesLarg) / 2;
    const timesY = conteudoY + 60;

    UNIFORMES.forEach((u, i) => {
      const cx = timesStartX + i * (cartaoLarg + gap);
      const cartao = this._criarCartaoUniforme(cx, timesY, cartaoLarg, cartaoAlt, u);
      this.cartoesUniforme.push(cartao);
    });

    // ── COLUNA CENTRAL — Preview VS ───────────
    const previewCX = zonaC.x + zonaC.larg / 2;
    const previewY  = conteudoY + alturaUtil / 2 - 20;

    this.add.rectangle(previewCX, previewY, zonaC.larg - 40, alturaUtil - 20, 0x000000, 0.5)
      .setStrokeStyle(4, 0xffffff);

    // Label VS
    this.add.text(previewCX, previewY - 20, 'VS', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '64px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5);

    // Labels J1 / J2
    this.add.text(previewCX - 110, previewY + 100, 'JOGADOR 1', {
      fontFamily: 'Orbitron, monospace', fontSize: '14px', color: '#2ecc71',
    }).setOrigin(0.5);
    this.add.text(previewCX + 110, previewY + 100, 'CPU / J2', {
      fontFamily: 'Orbitron, monospace', fontSize: '14px', color: '#8d6e63',
    }).setOrigin(0.5);

    // Sprites dos jogadores
    this.spritePreview = this.add.sprite(previewCX - 110, previewY - 20, 'p_parado').setScale(0.18);
    this.spritePreview.setTint(this.uniformeSelecionado.corPrimaria);
    this.spritePreview.play('player_idle');

    const oponente = UNIFORMES.find(u => u.id !== this.uniformeSelecionado.id) || UNIFORMES[1];
    this.spriteOponente = this.add.sprite(previewCX + 110, previewY - 20, 'p_parado').setScale(0.18).setFlipX(true);
    this.spriteOponente.setTint(oponente.corPrimaria);
    this.spriteOponente.play('player_idle');

    // ── COLUNA DIREITA — Clima ────────────────
    this._desenharSeparador(zonaDir.x, zonaDir.x + zonaDir.larg, 'CONDIÇÃO DO CLIMA', conteudoY);

    const climaCardLarg = 90;
    const climaCardAlt  = 140;
    const climaGap = 15;
    const totalClimaLarg = CICLOS_HORARIO.length * climaCardLarg + (CICLOS_HORARIO.length - 1) * climaGap;
    const climaStartX = zonaDir.x + (zonaDir.larg - totalClimaLarg) / 2;
    const climaY = conteudoY + 60;

    CICLOS_HORARIO.forEach((ciclo, i) => {
      const cx = climaStartX + i * (climaCardLarg + climaGap);
      const cartao = this._criarCartaoCiclo(cx, climaY, climaCardLarg, climaCardAlt, ciclo);
      this.cartoesCiclo.push(cartao);
    });

    // ── Rodapé: Botão Iniciar + Voltar ────────
    const rodapeY = ALTURA_JOGO - 55;

    this.add.rectangle(LARGURA_JOGO / 2, ALTURA_JOGO - rodapeY / 2, LARGURA_JOGO, 4, 0xffffff)
      .setOrigin(0.5, 0.5);

    this._criarBotaoIniciar(LARGURA_JOGO / 2, ALTURA_JOGO - 45);

    const voltar = this.add.text(80, ALTURA_JOGO - 45, '◄ VOLTAR', {
      fontFamily: 'Orbitron, monospace', fontSize: '18px', color: '#ffffff',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    voltar.on('pointerover', () => voltar.setColor('#27ae60'));
    voltar.on('pointerout',  () => voltar.setColor('#ffffff'));
    voltar.on('pointerup',   () => {
      this.cameras.main.fade(300, 0, 0, 0, false, (_c: Phaser.Cameras.Scene2D.Camera, p: number) => {
        if (p >= 1) this.scene.start('CenaMenu');
      });
    });

    // Separadores verticais
    this.add.rectangle(zonaC.x, ALTURA_JOGO / 2, 3, ALTURA_JOGO - headerH, 0xffffff, 0.2).setOrigin(0.5);
    this.add.rectangle(zonaDir.x, ALTURA_JOGO / 2, 3, ALTURA_JOGO - headerH, 0xffffff, 0.2).setOrigin(0.5);

    this.cameras.main.fadeIn(400, 0, 0, 0);
    this._destacarSelecionados();

    this.input.keyboard?.addKey('ESC').on('down', () => this.scene.start('CenaMenu'));
  }

  // ─── Helpers de UI ───────────────────────────

  private _desenharSeparador(x1: number, x2: number, label: string, y: number): void {
    const cx = (x1 + x2) / 2;
    this.add.text(cx, y + 28, label, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.add.rectangle(cx, y + 52, (x2 - x1) * 0.7, 3, 0xffffff, 0.4).setOrigin(0.5);
  }

  private _criarCartaoUniforme(
    x: number, y: number, larg: number, alt: number, uniforme: OpcaoUniforme
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const fundo = this.add.graphics();
    fundo.fillStyle(0x000000, 1);
    fundo.fillRect(0, 0, larg, alt);
    fundo.lineStyle(4, 0xffffff, 1);
    fundo.strokeRect(0, 0, larg, alt);

    const sprite = this.add.sprite(larg / 2, alt * 0.42, 'p_parado').setScale(0.12);
    sprite.setTint(uniforme.corPrimaria);
    sprite.play('player_idle');

    const nome = this.add.text(larg / 2, alt - 28, uniforme.rotuloPt.toUpperCase(), {
      fontFamily: 'Orbitron, monospace',
      fontSize: '12px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: larg - 16 },
    }).setOrigin(0.5);

    container.add([fundo, sprite, nome]);
    container.setSize(larg, alt);
    container.setInteractive({ useHandCursor: true });
    container.setData('uniforme', uniforme);

    container.on('pointerup', () => {
      this.uniformeSelecionado = uniforme;
      definirUniformeJogador1(uniforme);
      this._atualizarPreview();
      this._destacarSelecionados();
    });
    container.on('pointerover', () => this.tweens.add({ targets: container, scaleY: 1.03, scaleX: 1.03, duration: 100 }));
    container.on('pointerout',  () => this.tweens.add({ targets: container, scaleY: 1, scaleX: 1, duration: 100 }));

    return container;
  }

  private _criarCartaoCiclo(
    x: number, y: number, larg: number, alt: number, ciclo: PresetHorario
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const fundo = this.add.graphics();
    fundo.fillStyle(0x000000, 1);
    fundo.fillRect(0, 0, larg, alt);
    fundo.lineStyle(3, 0xffffff, 1);
    fundo.strokeRect(0, 0, larg, alt);

    const letra = this.add.text(larg / 2, alt * 0.38, ciclo.rotuloPt.charAt(0).toUpperCase(), {
      fontFamily: 'Orbitron, monospace',
      fontSize: '48px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const nome = this.add.text(larg / 2, alt - 22, ciclo.rotuloPt.toUpperCase(), {
      fontFamily: 'Orbitron, monospace',
      fontSize: '9px',
      color: '#ffffff',
    }).setOrigin(0.5);

    container.add([fundo, letra, nome]);
    container.setSize(larg, alt);
    container.setInteractive({ useHandCursor: true });
    container.setData('ciclo', ciclo);

    container.on('pointerup', () => {
      this.cicloSelecionado = ciclo;
      definirCicloHorario(ciclo);
      this._destacarSelecionados();
    });
    container.on('pointerover', () => this.tweens.add({ targets: container, scaleY: 1.05, scaleX: 1.05, duration: 100 }));
    container.on('pointerout',  () => this.tweens.add({ targets: container, scaleY: 1, scaleX: 1, duration: 100 }));

    return container;
  }

  private _atualizarPreview(): void {
    this.spritePreview.setTint(this.uniformeSelecionado.corPrimaria);
    const oponente = UNIFORMES.find(u => u.id !== this.uniformeSelecionado.id) || UNIFORMES[1];
    this.spriteOponente.setTint(oponente.corPrimaria);
  }

  private _destacarSelecionados(): void {
    this.cartoesUniforme.forEach(cartao => {
      const u = cartao.getData('uniforme') as OpcaoUniforme;
      const gfx = cartao.list[0] as Phaser.GameObjects.Graphics;
      const sel = u.id === this.uniformeSelecionado.id;
      gfx.clear();
      gfx.fillStyle(sel ? 0x27ae60 : 0x000000, 1);
      gfx.fillRect(0, 0, 160, 220);
      gfx.lineStyle(sel ? 6 : 4, 0xffffff, 1);
      gfx.strokeRect(0, 0, 160, 220);
    });

    this.cartoesCiclo.forEach(cartao => {
      const c = cartao.getData('ciclo') as PresetHorario;
      const gfx = cartao.list[0] as Phaser.GameObjects.Graphics;
      const sel = c.nome === this.cicloSelecionado.nome;
      gfx.clear();
      gfx.fillStyle(sel ? 0x27ae60 : 0x000000, 1);
      gfx.fillRect(0, 0, 90, 140);
      gfx.lineStyle(sel ? 5 : 3, 0xffffff, 1);
      gfx.strokeRect(0, 0, 90, 140);
    });
  }

  private _criarBotaoIniciar(x: number, y: number): void {
    const larg = 400;
    const alt  = 64;
    const container = this.add.container(x, y);

    const fundo = this.add.graphics();
    const _desenharFundo = (verde: boolean) => {
      fundo.clear();
      fundo.fillStyle(verde ? 0x27ae60 : 0x000000, 1);
      fundo.fillRect(-larg / 2, -alt / 2, larg, alt);
      fundo.lineStyle(5, 0xffffff, 1);
      fundo.strokeRect(-larg / 2, -alt / 2, larg, alt);
    };
    _desenharFundo(false);

    const texto = this.add.text(0, 0, '⚽  INICIAR PARTIDA  ⚽', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([fundo, texto]);
    container.setSize(larg, alt);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => _desenharFundo(true));
    container.on('pointerout',  () => _desenharFundo(false));
    container.on('pointerdown', () => this.tweens.add({ targets: container, scaleX: 0.96, scaleY: 0.96, duration: 80 }));
    container.on('pointerup',   () => {
      this.cameras.main.fade(500, 0, 0, 0, false, (_c: Phaser.Cameras.Scene2D.Camera, p: number) => {
        if (p >= 1) this.scene.start('CenaJogo');
      });
    });
  }
}
