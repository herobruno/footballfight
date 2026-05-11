import Phaser from 'phaser';
import {
  LARGURA_JOGO, ALTURA_JOGO, CHAO_Y,
  VELOCIDADE_ANDAR, VELOCIDADE_CORRER, FORCA_PULO,
  VIGOR_MAXIMO, VIDA_MAXIMA, GASTO_VIGOR_CORRER,
  REGEN_VIGOR_PARADO, REGEN_VIGOR_ANDANDO,
  LIMIAR_EXAUSTO,
  UNIFORMES,
  type PresetHorario,
  type OpcaoUniforme,
} from '../constantes';
import { obterEstado } from '../estado';

// ─── Dados do Jogador ────────────────────────
interface DadosJogador {
  sprite: Phaser.GameObjects.Sprite;
  vida: number;
  vigor: number;
  estaCorrendo: boolean;
  estaExausto: boolean;
  olhandoDireita: boolean;
  velocidadeX: number;
  velocidadeY: number;
  noChao: boolean;
  idUniforme: string;
  quadroAnim: number;
  timerAnim: number;
  estaChutando: boolean;
}

export class CenaJogo extends Phaser.Scene {
  // Jogadores
  private jogador1!: DadosJogador;
  private jogador2!: DadosJogador;

  // Entrada (teclado)
  private teclas!: {
    esquerda: Phaser.Input.Keyboard.Key;
    direita: Phaser.Input.Keyboard.Key;
    cima: Phaser.Input.Keyboard.Key;
    correr: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
  };

  // Elementos do HUD (DOM)
  private domHud: {
    h1: HTMLElement | null; h1Label: HTMLElement | null;
    s1: HTMLElement | null; s1Label: HTMLElement | null;
    h2: HTMLElement | null; h2Label: HTMLElement | null;
    s2: HTMLElement | null; s2Label: HTMLElement | null;
  } = {
    h1: null, h1Label: null, s1: null, s1Label: null,
    h2: null, h2Label: null, s2: null, s2Label: null
  };

  private iconeExaustoJ1!: Phaser.GameObjects.Text;
  private iconeExaustoJ2!: Phaser.GameObjects.Text;

  // Arena
  private cicloHorario!: PresetHorario;

  constructor() {
    super({ key: 'CenaJogo' });
  }

  create(): void {
    const estado = obterEstado();
    this.cicloHorario = estado.cicloHorario;

    // ── Desenhar a Arena ─────────────────────
    this._desenharArena();

    // ── Criar Jogadores ──────────────────────
    this.jogador1 = this._criarJogador(300, CHAO_Y, estado.uniformeJogador1.id, true);
    this.jogador2 = this._criarJogador(LARGURA_JOGO - 300, CHAO_Y, estado.uniformeJogador2.id, false);
    this.jogador2.sprite.setFlipX(true);

    // ── HUD ──────────────────────────────────
    this._criarHUD();

    // ── Entrada do Teclado ───────────────────
    const teclado = this.input.keyboard!;
    this.teclas = {
      esquerda: teclado.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      direita: teclado.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      cima: teclado.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      correr: teclado.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      a: teclado.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      d: teclado.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      w: teclado.addKey(Phaser.Input.Keyboard.KeyCodes.W),
    };

    // ── Dica de pausa ────────────────────────
    this.add.text(LARGURA_JOGO / 2, 12, 'ESC para voltar ao menu', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#ffffff80',
    }).setOrigin(0.5).setDepth(30);

    teclado.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => {
      this.cameras.main.fade(400, 0, 0, 0, false, (_c: Phaser.Cameras.Scene2D.Camera, p: number) => {
        if (p >= 1) this.scene.start('CenaMenu');
      });
    });

    // ── Fade in ──────────────────────────────
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  update(_tempo: number, delta: number): void {
    const dt = delta / 1000;

    this._processarEntrada(this.jogador1, dt);
    this._atualizarIA(this.jogador2, dt);
    this._aplicarFisica(this.jogador1, dt);
    this._aplicarFisica(this.jogador2, dt);
    this._atualizarVigor(this.jogador1, dt);
    this._atualizarVigor(this.jogador2, dt);
    this._atualizarAnimacoes(this.jogador1, dt);
    this._atualizarAnimacoes(this.jogador2, dt);
    this._atualizarHUD();
  }

  // ═══════════════════════════════════════════
  //  CRIAÇÃO DO JOGADOR
  // ═══════════════════════════════════════════
  private _criarJogador(x: number, y: number, idUniforme: string, olhandoDireita: boolean): DadosJogador {
    const sprite = this.add.sprite(x, y, 'player_sheet').setOrigin(0.5, 1).setDepth(10).setScale(2.2);
    
    const uniforme = UNIFORMES.find((u: OpcaoUniforme) => u.id === idUniforme);
    if (uniforme) {
      sprite.setTint(uniforme.corPrimaria);
    }

    sprite.play('player_idle');

    return {
      sprite,
      vida: VIDA_MAXIMA,
      vigor: VIGOR_MAXIMO,
      estaCorrendo: false,
      estaExausto: false,
      olhandoDireita,
      velocidadeX: 0,
      velocidadeY: 0,
      noChao: true,
      idUniforme,
      quadroAnim: 0,
      timerAnim: 0,
      estaChutando: false,
    };
  }

  // ═══════════════════════════════════════════
  //  ENTRADA (Jogador 1)
  // ═══════════════════════════════════════════
  private _processarEntrada(jogador: DadosJogador, _dt: number): void {
    const moverEsquerda = this.teclas.esquerda.isDown || this.teclas.a.isDown;
    const moverDireita = this.teclas.direita.isDown || this.teclas.d.isDown;
    const querCorrer = this.teclas.correr.isDown && jogador.vigor > LIMIAR_EXAUSTO;
    const querPular = Phaser.Input.Keyboard.JustDown(this.teclas.cima) || Phaser.Input.Keyboard.JustDown(this.teclas.w);

    const velocidade = jogador.estaExausto
      ? VELOCIDADE_ANDAR * 0.45
      : (querCorrer ? VELOCIDADE_CORRER : VELOCIDADE_ANDAR);

    jogador.estaCorrendo = querCorrer && (moverEsquerda || moverDireita);

    if (moverEsquerda) {
      jogador.velocidadeX = -velocidade;
      jogador.olhandoDireita = false;
      jogador.sprite.setFlipX(true);
    } else if (moverDireita) {
      jogador.velocidadeX = velocidade;
      jogador.olhandoDireita = true;
      jogador.sprite.setFlipX(false);
    } else {
      jogador.velocidadeX = 0;
    }

    if (querPular && jogador.noChao) {
      jogador.velocidadeY = FORCA_PULO;
      jogador.noChao = false;
    }
  }

  // ═══════════════════════════════════════════
  //  IA SIMPLES (Jogador 2 - CPU)
  // ═══════════════════════════════════════════
  private _atualizarIA(jogador: DadosJogador, _dt: number): void {
    const alvo = this.jogador1.sprite;
    const distancia = alvo.x - jogador.sprite.x;
    const distanciaAbs = Math.abs(distancia);

    jogador.olhandoDireita = distancia > 0;
    jogador.sprite.setFlipX(!jogador.olhandoDireita);

    if (distanciaAbs > 100) {
      const velocidade = distanciaAbs > 250 && jogador.vigor > 30
        ? VELOCIDADE_CORRER * 0.6
        : VELOCIDADE_ANDAR * 0.5;

      jogador.velocidadeX = distancia > 0 ? velocidade : -velocidade;
      jogador.estaCorrendo = distanciaAbs > 250 && jogador.vigor > 30;
    } else {
      jogador.velocidadeX = 0;
      jogador.estaCorrendo = false;
    }

    if (jogador.noChao && Math.random() < 0.004) {
      jogador.velocidadeY = FORCA_PULO;
      jogador.noChao = false;
    }
  }

  // ═══════════════════════════════════════════
  //  FÍSICA
  // ═══════════════════════════════════════════
  private _aplicarFisica(jogador: DadosJogador, dt: number): void {
    jogador.sprite.x += jogador.velocidadeX * dt;

    if (!jogador.noChao) {
      jogador.velocidadeY += 980 * dt;
    }
    jogador.sprite.y += jogador.velocidadeY * dt;

    if (jogador.sprite.y >= CHAO_Y) {
      jogador.sprite.y = CHAO_Y;
      jogador.velocidadeY = 0;
      jogador.noChao = true;
    }

    const margem = 40;
    if (jogador.sprite.x < margem) jogador.sprite.x = margem;
    if (jogador.sprite.x > LARGURA_JOGO - margem) jogador.sprite.x = LARGURA_JOGO - margem;
  }

  // ═══════════════════════════════════════════
  //  GERENCIAMENTO DE VIGOR
  // ═══════════════════════════════════════════
  private _atualizarVigor(jogador: DadosJogador, dt: number): void {
    if (jogador.estaCorrendo) {
      jogador.vigor -= GASTO_VIGOR_CORRER * dt;
    } else if (Math.abs(jogador.velocidadeX) > 10) {
      jogador.vigor += REGEN_VIGOR_ANDANDO * dt;
    } else {
      jogador.vigor += REGEN_VIGOR_PARADO * dt;
    }

    jogador.vigor = Phaser.Math.Clamp(jogador.vigor, 0, VIGOR_MAXIMO);
    jogador.estaExausto = jogador.vigor <= LIMIAR_EXAUSTO;
  }
  
  // ═══════════════════════════════════════════
  //  ANIMAÇÕES
  // ═══════════════════════════════════════════
  private _atualizarAnimacoes(jogador: DadosJogador, _dt: number): void {
    if (jogador.estaChutando) return;

    if (jogador.estaExausto) {
      if (jogador.sprite.anims.currentAnim?.key !== 'player_exhausted') {
        jogador.sprite.play('player_exhausted');
      }
      return;
    }

    if (!jogador.noChao) {
      if (jogador.velocidadeY < 0) {
        if (jogador.sprite.anims.currentAnim?.key !== 'player_jump') {
          jogador.sprite.play('player_jump');
        }
      } else {
        if (jogador.sprite.anims.currentAnim?.key !== 'player_fall') {
          jogador.sprite.play('player_fall');
        }
      }
      return;
    }

    if (Math.abs(jogador.velocidadeX) > 10) {
      const animKey = jogador.estaCorrendo ? 'player_run' : 'player_walk';
      if (jogador.sprite.anims.currentAnim?.key !== animKey) {
        jogador.sprite.play(animKey);
      }
    } else {
      if (jogador.sprite.anims.currentAnim?.key !== 'player_idle') {
        jogador.sprite.play('player_idle');
      }
    }
  }

  // ═══════════════════════════════════════════
  //  DESENHAR A ARENA
  // ═══════════════════════════════════════════
  private _desenharArena(): void {
    const ciclo = this.cicloHorario;

    const fundoEstadio = this.add.image(LARGURA_JOGO / 2, ALTURA_JOGO / 2, 'estadio');
    fundoEstadio.setDisplaySize(LARGURA_JOGO, ALTURA_JOGO);
    fundoEstadio.setDepth(0);

    const ALTURA_CEU = 250; 
    const ceuGfx = this.add.graphics().setDepth(1);
    const passos = 30;
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
      ceuGfx.fillRect(0, (ALTURA_CEU / passos) * i, LARGURA_JOGO, ALTURA_CEU / passos + 1);
    }

    if (ciclo.nome === 'noite') {
      const estrelasGfx = this.add.graphics().setDepth(1);
      for (let i = 0; i < 60; i++) {
        const ex = Math.random() * LARGURA_JOGO;
        const ey = Math.random() * (ALTURA_CEU - 20);
        const tamanho = Math.random() * 2 + 0.5;
        estrelasGfx.fillStyle(0xffffff, Math.random() * 0.7 + 0.3);
        estrelasGfx.fillCircle(ex, ey, tamanho);
      }
      estrelasGfx.fillStyle(0xeeeedd, 0.9);
      estrelasGfx.fillCircle(LARGURA_JOGO - 150, 80, 35);
      estrelasGfx.fillStyle(ciclo.ceuTopo, 1);
      estrelasGfx.fillCircle(LARGURA_JOGO - 140, 72, 30);
    }

    if (ciclo.nome === 'manha' || ciclo.nome === 'golden') {
      const solGfx = this.add.graphics().setDepth(1);
      const solX = ciclo.nome === 'manha' ? 200 : LARGURA_JOGO - 200;
      const solY = ciclo.nome === 'manha' ? 100 : 120;
      solGfx.fillStyle(0xffee58, 0.15);
      solGfx.fillCircle(solX, solY, 80);
      solGfx.fillStyle(0xffee58, 0.25);
      solGfx.fillCircle(solX, solY, 50);
      solGfx.fillStyle(0xffee58, 0.9);
      solGfx.fillCircle(solX, solY, 28);
    }

    this.add.rectangle(
      LARGURA_JOGO / 2, ALTURA_JOGO / 2,
      LARGURA_JOGO, ALTURA_JOGO,
      ciclo.corAmbiente, ciclo.alfaAmbiente
    ).setDepth(15).setBlendMode(Phaser.BlendModes.ADD);
  }


  // ═══════════════════════════════════════════
  //  HUD (CSS/DOM)
  // ═══════════════════════════════════════════
  private _criarHUD(): void {
    const profundidade = 25;

    // Mostrar os containers do HUD
    const containers = document.querySelectorAll('.hud-container');
    containers.forEach(el => (el as HTMLElement).style.display = 'flex');

    // Esconder ao sair da cena
    this.events.once('shutdown', () => {
      containers.forEach(el => (el as HTMLElement).style.display = 'none');
    });

    // Referências do DOM
    this.domHud = {
      h1: document.getElementById('health-p1'),
      h1Label: document.getElementById('health-label-p1'),
      s1: document.getElementById('stamina-p1'),
      s1Label: document.getElementById('stamina-label-p1'),
      h2: document.getElementById('health-p2'),
      h2Label: document.getElementById('health-label-p2'),
      s2: document.getElementById('stamina-p2'),
      s2Label: document.getElementById('stamina-label-p2'),
    };

    this.iconeExaustoJ1 = this.add.text(0, 0, '😤', {
      fontSize: '20px',
    }).setOrigin(0.5).setDepth(profundidade).setVisible(false);

    this.iconeExaustoJ2 = this.add.text(0, 0, '😤', {
      fontSize: '20px',
    }).setOrigin(0.5).setDepth(profundidade).setVisible(false);

    this.add.text(LARGURA_JOGO / 2, ALTURA_JOGO - 15, `🕐 ${this.cicloHorario.rotuloPt}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#ffffff80',
    }).setOrigin(0.5).setDepth(profundidade);
  }

  private _atualizarHUD(): void {
    const updateBar = (bar: HTMLElement | null, label: HTMLElement | null, current: number, max: number) => {
      if (bar && label) {
        const percent = Math.floor((current / max) * 100);
        bar.style.width = `${percent}%`;
        label.innerText = `${percent}%`;
      }
    };

    // Atualizar Player 1
    updateBar(this.domHud.h1, this.domHud.h1Label, this.jogador1.vida, VIDA_MAXIMA);
    updateBar(this.domHud.s1, this.domHud.s1Label, this.jogador1.vigor, VIGOR_MAXIMO);

    // Atualizar Player 2
    updateBar(this.domHud.h2, this.domHud.h2Label, this.jogador2.vida, VIDA_MAXIMA);
    updateBar(this.domHud.s2, this.domHud.s2Label, this.jogador2.vigor, VIGOR_MAXIMO);

    // Ícones de exaustão sobre a cabeça
    this.iconeExaustoJ1.setVisible(this.jogador1.estaExausto);
    this.iconeExaustoJ1.setPosition(this.jogador1.sprite.x, this.jogador1.sprite.y - 150);
    this.iconeExaustoJ2.setVisible(this.jogador2.estaExausto);
    this.iconeExaustoJ2.setPosition(this.jogador2.sprite.x, this.jogador2.sprite.y - 150);
  }
}
