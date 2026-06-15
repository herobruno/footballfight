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
import { hexToRgbNormalized } from '../pipelines/UniformPipeline';

export class CenaSelecaoUniforme extends Phaser.Scene {
  private uniformeSelecionado: OpcaoUniforme = UNIFORMES[0];
  private cicloSelecionado: PresetHorario = CICLOS_HORARIO[0];
  private spritePreview!: Phaser.GameObjects.Sprite;
  private spriteOponente!: Phaser.GameObjects.Sprite;
  private textoJ1!: Phaser.GameObjects.Text;
  private textoJ2!: Phaser.GameObjects.Text;
  private cartoesUniforme: Phaser.GameObjects.Container[] = [];
  private cartoesCiclo: Phaser.GameObjects.Container[] = [];
  private previewMapa!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'CenaSelecaoUniforme' });
  }

  private _obterChaveLogo(uniforme: OpcaoUniforme): string {
    return uniforme.id === 'azul' ? 'garra' : 'sangue';
  }

  private _aplicarPipelineUniforme(sprite: Phaser.GameObjects.Sprite, uniforme: OpcaoUniforme): void {
    if (this.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
      sprite.setPostPipeline('UniformPipeline');
      const pipeline = sprite.getPostPipeline('UniformPipeline') as any;
      if (pipeline) {
        pipeline.uPrimaryColor = hexToRgbNormalized(uniforme.corPrimaria);
        pipeline.uSecondaryColor = hexToRgbNormalized(uniforme.corSecundaria);
        pipeline.uDestaqueColor = hexToRgbNormalized(uniforme.corDestaque);
      }
    } else {
      sprite.setTint(uniforme.corPrimaria);
    }
  }

  create(): void {
    // ═══ LIMPAR CARTÕES DE RODADAS ANTERIORES ═══
    // Quando a cena é reiniciada, os arrays mantêm referências
    // de objetos já destruídos pelo shutdown do Phaser.
    this.cartoesUniforme = [];
    this.cartoesCiclo = [];

    const estado = obterEstado();
    this.uniformeSelecionado = estado.uniformeJogador1;
    this.cicloSelecionado = estado.cicloHorario;

    // ── Fundo ───────────────────────
    this.add.rectangle(0, 0, LARGURA_JOGO, ALTURA_JOGO, 0x080E17).setOrigin(0, 0);

    // ── Título Topo ───────────────────────────
    const headerH = 80;
    this.add.rectangle(LARGURA_JOGO / 2, headerH / 2, LARGURA_JOGO, headerH, 0x0C2857).setOrigin(0.5, 0.5);
    this.add.text(LARGURA_JOGO / 2, headerH / 2, 'SELEÇÃO DE ATLETAS', {
      fontFamily: "'Bangers', cursive",
      fontSize: '42px',
      color: '#F1F1F1',
      letterSpacing: 4,
    }).setOrigin(0.5, 0.5);

    // Linha divisória
    this.add.rectangle(LARGURA_JOGO / 2, headerH, LARGURA_JOGO, 3, 0x004DD6).setOrigin(0.5, 0.5);

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

    this.add.rectangle(previewCX, previewY, zonaC.larg - 40, alturaUtil - 20, 0x0C2857, 0.45)
      .setStrokeStyle(3, 0x374459);

    // Label VS
    this.add.text(previewCX, previewY - 20, 'VS', {
      fontFamily: "'Bangers', cursive",
      fontSize: '72px',
      color: '#F1F1F1',
      stroke: '#080E17',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Labels J1 / J2
    this.textoJ1 = this.add.text(previewCX - 110, previewY + 100, 'JOGADOR 1', {
      fontFamily: "'Bangers', cursive", fontSize: '16px', color: '#00ffff', letterSpacing: 2,
    }).setOrigin(0.5);
    this.textoJ2 = this.add.text(previewCX + 110, previewY + 100, 'CPU / J2', {
      fontFamily: "'Bangers', cursive", fontSize: '16px', color: '#0C439F', letterSpacing: 2,
    }).setOrigin(0.5);

    // Sprites dos jogadores no preview central (Estáticos)
    this.spritePreview = this.add.sprite(previewCX - 110, previewY - 20, 'p_parado').setScale(0.18).setDepth(10);
    this._aplicarPipelineUniforme(this.spritePreview, UNIFORMES[0]); // Garra sempre na esquerda
    this.spritePreview.play('player_idle');

    this.spriteOponente = this.add.sprite(previewCX + 110, previewY - 20, 'p_parado').setScale(0.18).setFlipX(true).setDepth(10);
    this._aplicarPipelineUniforme(this.spriteOponente, UNIFORMES[1]); // Sangue Futebol sempre na direita
    this.spriteOponente.play('player_idle');

    this._atualizarPreview();

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

    // ── Prévia do Mapa (clima) abaixo dos cards ──
    const previewMapaX = zonaDir.x + zonaDir.larg / 2;
    const previewMapaY = climaY + climaCardAlt + 150;
    this.previewMapa = this.add.container(previewMapaX, previewMapaY);
    this._desenharPreviewMapa(this.cicloSelecionado);

    // ── Rodapé: Botão Iniciar + Voltar ────────
    const rodapeY = ALTURA_JOGO - 55;

    this._criarBotaoIniciar(LARGURA_JOGO / 2, ALTURA_JOGO - 45);

    const voltar = this.add.text(80, ALTURA_JOGO - 45, '◄ VOLTAR', {
      fontFamily: "'Bangers', cursive", fontSize: '22px', color: '#55575C', letterSpacing: 2,
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    voltar.on('pointerover', () => voltar.setColor('#004DD6'));
    voltar.on('pointerout',  () => voltar.setColor('#55575C'));
    voltar.on('pointerup',   () => {
      this.cameras.main.fade(300, 0, 0, 0, false, (_c: Phaser.Cameras.Scene2D.Camera, p: number) => {
        if (p >= 1) this.scene.start('CenaMenu');
      });
    });

    // Separadores verticais
    this.add.rectangle(zonaC.x, ALTURA_JOGO / 2, 2, ALTURA_JOGO - headerH, 0x374459, 0.5).setOrigin(0.5);
    this.add.rectangle(zonaDir.x, ALTURA_JOGO / 2, 2, ALTURA_JOGO - headerH, 0x374459, 0.5).setOrigin(0.5);

    this.cameras.main.fadeIn(400, 0, 0, 0);
    this._destacarSelecionados();

    this.input.keyboard?.addKey('ESC').on('down', () => this.scene.start('CenaMenu'));
  }

  // ─── Helpers de UI ───────────────────────────

  private _desenharSeparador(x1: number, x2: number, label: string, y: number): void {
    const cx = (x1 + x2) / 2;
    this.add.text(cx, y + 28, label, {
      fontFamily: "'Bangers', cursive",
      fontSize: '20px',
      color: '#004DD6',
      letterSpacing: 3,
    }).setOrigin(0.5);
    this.add.rectangle(cx, y + 52, (x2 - x1) * 0.7, 2, 0x374459, 0.7).setOrigin(0.5);
  }

  private _criarCartaoUniforme(
    x: number, y: number, larg: number, alt: number, uniforme: OpcaoUniforme
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const fundo = this.add.graphics();
    fundo.fillStyle(0x080E17, 1);
    fundo.fillRect(0, 0, larg, alt);
    fundo.lineStyle(2, 0x374459, 1);
    fundo.strokeRect(0, 0, larg, alt);

    // Logo do time no lugar do sprite do jogador
    const logo = this.add.image(larg / 2, alt * 0.38, this._obterChaveLogo(uniforme)).setScale(0.12);
    // Sangue Futebol logo olhando para a direita
    if (uniforme.id === 'branco') {
      logo.setFlipX(true);
    }

    const nome = this.add.text(larg / 2, alt - 28, uniforme.rotuloPt.toUpperCase(), {
      fontFamily: "'Bangers', cursive",
      fontSize: '13px',
      color: '#F1F1F1',
      align: 'center',
      letterSpacing: 1,
      wordWrap: { width: larg - 16 },
    }).setOrigin(0.5);

    container.add([fundo, logo, nome]);
    container.setSize(larg, alt);
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, larg, alt), Phaser.Geom.Rectangle.Contains, true);
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
    fundo.fillStyle(0x080E17, 1);
    fundo.fillRect(0, 0, larg, alt);
    fundo.lineStyle(2, 0x374459, 1);
    fundo.strokeRect(0, 0, larg, alt);

    const letra = this.add.text(larg / 2, alt * 0.38, ciclo.rotuloPt.charAt(0).toUpperCase(), {
      fontFamily: "'Bangers', cursive",
      fontSize: '52px',
      color: '#004DD6',
    }).setOrigin(0.5);

    const nome = this.add.text(larg / 2, alt - 22, ciclo.rotuloPt.toUpperCase(), {
      fontFamily: "'Bangers', cursive",
      fontSize: '10px',
      color: '#F1F1F1',
      letterSpacing: 1,
    }).setOrigin(0.5);

    container.add([fundo, letra, nome]);
    container.setSize(larg, alt);
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, larg, alt), Phaser.Geom.Rectangle.Contains, true);
    container.setData('ciclo', ciclo);

    container.on('pointerup', () => {
      this.cicloSelecionado = ciclo;
      definirCicloHorario(ciclo);
      this._destacarSelecionados();
      this._desenharPreviewMapa(ciclo);
    });
    container.on('pointerover', () => this.tweens.add({ targets: container, scaleY: 1.05, scaleX: 1.05, duration: 100 }));
    container.on('pointerout',  () => this.tweens.add({ targets: container, scaleY: 1, scaleX: 1, duration: 100 }));

    return container;
  }

  private _atualizarPreview(): void {
    if (!this.textoJ1 || !this.textoJ2) return;

    const corGarra = `#${UNIFORMES[0].corPrimaria.toString(16).padStart(6, '0')}`;
    const corSangue = `#${UNIFORMES[1].corPrimaria.toString(16).padStart(6, '0')}`;

    if (this.uniformeSelecionado.id === UNIFORMES[0].id) {
      this.textoJ1.setX(this.spritePreview.x);
      this.textoJ1.setColor(corGarra);
      this.textoJ2.setX(this.spriteOponente.x);
      this.textoJ2.setColor(corSangue);
    } else {
      this.textoJ1.setX(this.spriteOponente.x);
      this.textoJ1.setColor(corSangue);
      this.textoJ2.setX(this.spritePreview.x);
      this.textoJ2.setColor(corGarra);
    }
  }

  private _desenharPreviewMapa(ciclo: PresetHorario): void {
    this.previewMapa.removeAll(true);

    const larg = 280;
    const alt = 160;

    // Imagem do estádio (imagem_fundo.png carregada como 'estadio')
    const estadioImg = this.add.image(0, 0, 'estadio');
    estadioImg.setDisplaySize(larg, alt);
    this.previewMapa.add(estadioImg);

    // Céu gradiente semi-transparente sobre a parte superior
    const ceu = this.add.graphics();
    ceu.fillGradientStyle(ciclo.ceuTopo, ciclo.ceuTopo, ciclo.ceuBase, ciclo.ceuBase, 0.55);
    ceu.fillRect(-larg / 2, -alt / 2, larg, alt * 0.65);
    this.previewMapa.add(ceu);

    // Overlay de ambiente (como na arena real da GameScene)
    const overlay = this.add.graphics();
    overlay.fillStyle(ciclo.corAmbiente, ciclo.alfaAmbiente);
    overlay.fillRect(-larg / 2, -alt / 2, larg, alt);
    overlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.previewMapa.add(overlay);

    // Astros
    if (ciclo.nome === 'noite') {
      const estrelas = this.add.graphics();
      for (let i = 0; i < 30; i++) {
        const ex = -larg / 2 + Math.random() * larg;
        const ey = -alt / 2 + Math.random() * (alt * 0.45);
        estrelas.fillStyle(0xffffff, Math.random() * 0.7 + 0.3);
        estrelas.fillCircle(ex, ey, Math.random() * 1.5 + 0.5);
      }
      // Lua
      estrelas.fillStyle(0xeeeedd, 0.9);
      estrelas.fillCircle(larg / 2 - 35, -alt / 2 + 25, 14);
      estrelas.fillStyle(0x000000, 0.25);
      estrelas.fillCircle(larg / 2 - 29, -alt / 2 + 19, 11);
      this.previewMapa.add(estrelas);
    }

    if (ciclo.nome === 'manha' || ciclo.nome === 'golden') {
      const sol = this.add.graphics();
      const solX = ciclo.nome === 'manha' ? -larg / 2 + 40 : larg / 2 - 40;
      const solY = -alt / 2 + 25;
      sol.fillStyle(0xffee58, 0.2);
      sol.fillCircle(solX, solY, 30);
      sol.fillStyle(0xffee58, 0.4);
      sol.fillCircle(solX, solY, 20);
      sol.fillStyle(0xffee58, 0.9);
      sol.fillCircle(solX, solY, 10);
      this.previewMapa.add(sol);
    }

    // Borda do preview
    const borda = this.add.graphics();
    borda.lineStyle(2, 0x004DD6, 1);
    borda.strokeRect(-larg / 2, -alt / 2, larg, alt);
    this.previewMapa.add(borda);

    // Label com nome do clima
    const label = this.add.text(0, alt / 2 - 14, ciclo.rotuloPt.toUpperCase(), {
      fontFamily: "'Bangers', cursive",
      fontSize: '14px',
      color: '#F1F1F1',
      letterSpacing: 2,
    }).setOrigin(0.5);
    this.previewMapa.add(label);
  }

  private _destacarSelecionados(): void {
    this.cartoesUniforme.forEach(cartao => {
      const u = cartao.getData('uniforme') as OpcaoUniforme;
      const gfx = cartao.list[0] as Phaser.GameObjects.Graphics;
      const sel = u.id === this.uniformeSelecionado.id;
      gfx.clear();
      if (sel) {
        gfx.fillGradientStyle(0x0C439F, 0x0C439F, 0x053991, 0x053991, 1);
      } else {
        gfx.fillStyle(0x080E17, 1);
      }
      gfx.fillRect(0, 0, 160, 220);
      gfx.lineStyle(sel ? 3 : 2, sel ? 0x004DD6 : 0x374459, 1);
      gfx.strokeRect(0, 0, 160, 220);
    });

    this.cartoesCiclo.forEach(cartao => {
      const c = cartao.getData('ciclo') as PresetHorario;
      const gfx = cartao.list[0] as Phaser.GameObjects.Graphics;
      const sel = c.nome === this.cicloSelecionado.nome;
      gfx.clear();
      if (sel) {
        gfx.fillGradientStyle(0x0C439F, 0x0C439F, 0x053991, 0x053991, 1);
      } else {
        gfx.fillStyle(0x080E17, 1);
      }
      gfx.fillRect(0, 0, 90, 140);
      gfx.lineStyle(sel ? 3 : 2, sel ? 0x004DD6 : 0x374459, 1);
      gfx.strokeRect(0, 0, 90, 140);
    });
  }

  private _criarBotaoIniciar(x: number, y: number): void {
    const larg = 400;
    const alt  = 64;
    const container = this.add.container(x, y);

    const fundo = this.add.graphics();
    const _desenharFundo = (hover: boolean) => {
      fundo.clear();
      if (hover) {
        fundo.fillGradientStyle(0x0C439F, 0x0C439F, 0x053991, 0x053991, 1);
        fundo.fillRect(-larg / 2, -alt / 2, larg, alt);
        fundo.lineStyle(2, 0x004DD6, 1);
        fundo.strokeRect(-larg / 2, -alt / 2, larg, alt);
      } else {
        fundo.fillGradientStyle(0x1A1D24, 0x1A1D24, 0x080E17, 0x080E17, 1);
        fundo.fillRect(-larg / 2, -alt / 2, larg, alt);
        fundo.lineStyle(2, 0x374459, 1);
        fundo.strokeRect(-larg / 2, -alt / 2, larg, alt);
      }
    };
    _desenharFundo(false);

    const texto = this.add.text(0, 0, 'INICIAR PARTIDA', {
      fontFamily: "'Bangers', cursive",
      fontSize: '30px',
      color: '#F1F1F1',
      letterSpacing: 2,
    }).setOrigin(0.5);

    container.add([fundo, texto]);
    container.setSize(larg, alt);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      _desenharFundo(true);
      this.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 120 });
    });
    container.on('pointerout',  () => {
      _desenharFundo(false);
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 120 });
    });
    container.on('pointerdown', () => this.tweens.add({ targets: container, scaleX: 0.96, scaleY: 0.96, duration: 80 }));
    container.on('pointerup',   () => {
      this.cameras.main.fade(500, 0, 0, 0, false, (_c: Phaser.Cameras.Scene2D.Camera, p: number) => {
        if (p >= 1) this.scene.start('CenaJogo');
      });
    });
  }
}