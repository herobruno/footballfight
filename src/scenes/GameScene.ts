import Phaser from 'phaser';
import {
  LARGURA_JOGO, ALTURA_JOGO, CHAO_Y,
  VELOCIDADE_ANDAR, VELOCIDADE_CORRER, FORCA_PULO,
  VIGOR_MAXIMO, GASTO_VIGOR_CORRER,
  REGEN_VIGOR_PARADO, REGEN_VIGOR_ANDANDO,
  LIMIAR_EXAUSTO,
  type PresetHorario,
} from '../constantes';
import { obterEstado } from '../estado';

// ─── Dados do Jogador ────────────────────────
interface DadosJogador {
  sprite: Phaser.GameObjects.Image;
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

  // HUD
  private barraVigorJ1!: Phaser.GameObjects.Graphics;
  private rotuloVigorJ1!: Phaser.GameObjects.Text;
  private barraVigorJ2!: Phaser.GameObjects.Graphics;
  private rotuloVigorJ2!: Phaser.GameObjects.Text;
  private iconeExaustoJ1!: Phaser.GameObjects.Text;
  private iconeExaustoJ2!: Phaser.GameObjects.Text;

  // Arena
  private cicloHorario!: PresetHorario;

  // Bola
  private bola!: Phaser.GameObjects.Image;
  private bolaVX = 0;
  private bolaVY = 0;

  constructor() {
    super({ key: 'CenaJogo' });
  }

  create(): void {
    const estado = obterEstado();
    this.cicloHorario = estado.cicloHorario;

    // ── Desenhar a Arena ─────────────────────
    this._desenharArena();

    // ── Criar a Bola ─────────────────────────
    this.bola = this.add.image(LARGURA_JOGO / 2, CHAO_Y - 12, 'bola');
    this.bola.setDepth(5);

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
      color: '#44556680',
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
    this._atualizarBola(dt);
    this._atualizarAnimacoes(this.jogador1, dt);
    this._atualizarAnimacoes(this.jogador2, dt);
    this._atualizarHUD();
  }

  // ═══════════════════════════════════════════
  //  CRIAÇÃO DO JOGADOR
  // ═══════════════════════════════════════════
  private _criarJogador(x: number, y: number, idUniforme: string, olhandoDireita: boolean): DadosJogador {
    const sprite = this.add.image(x, y, `jogador_${idUniforme}`).setOrigin(0.5, 1).setDepth(10);
    return {
      sprite,
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

    // Velocidade base — se exausto, reduz drasticamente
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

    // Pulo
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

    // Comportamento simples de perseguição
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

    // Pulo aleatório
    if (jogador.noChao && Math.random() < 0.004) {
      jogador.velocidadeY = FORCA_PULO;
      jogador.noChao = false;
    }
  }

  // ═══════════════════════════════════════════
  //  FÍSICA
  // ═══════════════════════════════════════════
  private _aplicarFisica(jogador: DadosJogador, dt: number): void {
    // Movimento horizontal
    jogador.sprite.x += jogador.velocidadeX * dt;

    // Gravidade
    if (!jogador.noChao) {
      jogador.velocidadeY += 980 * dt;
    }
    jogador.sprite.y += jogador.velocidadeY * dt;

    // Colisão com o chão
    if (jogador.sprite.y >= CHAO_Y) {
      jogador.sprite.y = CHAO_Y;
      jogador.velocidadeY = 0;
      jogador.noChao = true;
    }

    // Limites da arena
    const margem = 40;
    if (jogador.sprite.x < margem) jogador.sprite.x = margem;
    if (jogador.sprite.x > LARGURA_JOGO - margem) jogador.sprite.x = LARGURA_JOGO - margem;
  }

  // ═══════════════════════════════════════════
  //  GERENCIAMENTO DE VIGOR (ESTAMINA)
  // ═══════════════════════════════════════════
  private _atualizarVigor(jogador: DadosJogador, dt: number): void {
    if (jogador.estaCorrendo) {
      // Correndo gasta vigor
      jogador.vigor -= GASTO_VIGOR_CORRER * dt;
    } else if (Math.abs(jogador.velocidadeX) > 10) {
      // Andando regenera devagar
      jogador.vigor += REGEN_VIGOR_ANDANDO * dt;
    } else {
      // Parado regenera mais rápido
      jogador.vigor += REGEN_VIGOR_PARADO * dt;
    }

    // Clampar entre 0 e máximo
    jogador.vigor = Phaser.Math.Clamp(jogador.vigor, 0, VIGOR_MAXIMO);

    // Verificar se está exausto
    jogador.estaExausto = jogador.vigor <= LIMIAR_EXAUSTO;
  }

  // ═══════════════════════════════════════════
  //  FÍSICA DA BOLA
  // ═══════════════════════════════════════════
  private _atualizarBola(dt: number): void {
    // Gravidade
    this.bolaVY += 600 * dt;

    // Mover
    this.bola.x += this.bolaVX * dt;
    this.bola.y += this.bolaVY * dt;

    // Quicar no chão
    if (this.bola.y >= CHAO_Y - 12) {
      this.bola.y = CHAO_Y - 12;
      this.bolaVY = -this.bolaVY * 0.5;
      this.bolaVX *= 0.85;
      if (Math.abs(this.bolaVY) < 20) this.bolaVY = 0;
    }

    // Quicar nas paredes
    if (this.bola.x < 30 || this.bola.x > LARGURA_JOGO - 30) {
      this.bolaVX = -this.bolaVX * 0.7;
      this.bola.x = Phaser.Math.Clamp(this.bola.x, 30, LARGURA_JOGO - 30);
    }

    // Teto
    if (this.bola.y < 40) {
      this.bola.y = 40;
      this.bolaVY = Math.abs(this.bolaVY) * 0.4;
    }

    // Colisão jogador-bola
    this._colisaoJogadorBola(this.jogador1);
    this._colisaoJogadorBola(this.jogador2);

    // Rotação visual
    this.bola.rotation += this.bolaVX * dt * 0.01;
  }

  private _colisaoJogadorBola(jogador: DadosJogador): void {
    const dx = this.bola.x - jogador.sprite.x;
    const dy = this.bola.y - (jogador.sprite.y - 36);
    const distancia = Math.sqrt(dx * dx + dy * dy);

    if (distancia < 40) {
      const nx = dx / (distancia || 1);
      const ny = dy / (distancia || 1);
      const forcaChute = jogador.estaCorrendo ? 500 : 300;
      this.bolaVX = nx * forcaChute;
      this.bolaVY = ny * forcaChute - 200;

      // Separar a bola do jogador
      this.bola.x = jogador.sprite.x + nx * 42;
      this.bola.y = (jogador.sprite.y - 36) + ny * 42;
    }
  }

  // ═══════════════════════════════════════════
  //  ANIMAÇÕES (Troca de Textura)
  // ═══════════════════════════════════════════
  private _atualizarAnimacoes(jogador: DadosJogador, dt: number): void {
    const id = jogador.idUniforme;

    jogador.sprite.clearTint();

    // Se está exausto → mostrar frame ofegante
    if (jogador.estaExausto) {
      jogador.sprite.setTexture(`jogador_${id}_ofegante`);
      return;
    }

    // Se está se movendo no chão → animação de corrida
    if (Math.abs(jogador.velocidadeX) > 10 && jogador.noChao) {
      jogador.timerAnim += dt;
      const intervalo = jogador.estaCorrendo ? 0.12 : 0.2;
      if (jogador.timerAnim >= intervalo) {
        jogador.timerAnim = 0;
        jogador.quadroAnim = (jogador.quadroAnim + 1) % 2;
      }
      jogador.sprite.setTexture(`jogador_${id}_correndo${jogador.quadroAnim}`);
    } else {
      // Parado
      jogador.sprite.setTexture(`jogador_${id}`);
      jogador.quadroAnim = 0;
      jogador.timerAnim = 0;
    }
  }

  // ═══════════════════════════════════════════
  //  DESENHAR A ARENA
  // ═══════════════════════════════════════════
  private _desenharArena(): void {
    const ciclo = this.cicloHorario;

    // ── Gradiente do céu ─────────────────────
    const ceuGfx = this.add.graphics().setDepth(0);
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
      ceuGfx.fillRect(0, (CHAO_Y / passos) * i, LARGURA_JOGO, CHAO_Y / passos + 1);
    }

    // ── Estrelas para noite ──────────────────
    if (ciclo.nome === 'noite') {
      const estrelasGfx = this.add.graphics().setDepth(0);
      for (let i = 0; i < 80; i++) {
        const ex = Math.random() * LARGURA_JOGO;
        const ey = Math.random() * (CHAO_Y - 60);
        const tamanho = Math.random() * 2 + 0.5;
        estrelasGfx.fillStyle(0xffffff, Math.random() * 0.7 + 0.3);
        estrelasGfx.fillCircle(ex, ey, tamanho);
      }

      // Lua
      estrelasGfx.fillStyle(0xeeeedd, 0.9);
      estrelasGfx.fillCircle(LARGURA_JOGO - 150, 80, 35);
      estrelasGfx.fillStyle(ciclo.ceuTopo, 1);
      estrelasGfx.fillCircle(LARGURA_JOGO - 140, 72, 30);
    }

    // ── Sol para manhã / golden ──────────────
    if (ciclo.nome === 'manha' || ciclo.nome === 'golden') {
      const solGfx = this.add.graphics().setDepth(0);
      const solX = ciclo.nome === 'manha' ? 200 : LARGURA_JOGO - 200;
      const solY = ciclo.nome === 'manha' ? 100 : 60;

      // Brilho do sol
      solGfx.fillStyle(0xffee58, 0.15);
      solGfx.fillCircle(solX, solY, 80);
      solGfx.fillStyle(0xffee58, 0.25);
      solGfx.fillCircle(solX, solY, 50);
      solGfx.fillStyle(0xffee58, 0.9);
      solGfx.fillCircle(solX, solY, 28);
    }

    // ── Campo / Chão ─────────────────────────
    const campoGfx = this.add.graphics().setDepth(1);

    // Grama
    campoGfx.fillStyle(ciclo.corGrama, 1);
    campoGfx.fillRect(0, CHAO_Y, LARGURA_JOGO, ALTURA_JOGO - CHAO_Y);

    // Faixas de grama (alternadas mais escuras)
    const larguraFaixa = 80;
    for (let x = 0; x < LARGURA_JOGO; x += larguraFaixa * 2) {
      campoGfx.fillStyle(ciclo.corGrama, 0.7);
      campoGfx.fillRect(x, CHAO_Y, larguraFaixa, ALTURA_JOGO - CHAO_Y);
    }

    // Linhas do campo
    campoGfx.lineStyle(2, 0xffffff, 0.3);
    // Linha central
    campoGfx.lineBetween(LARGURA_JOGO / 2, CHAO_Y, LARGURA_JOGO / 2, ALTURA_JOGO);
    // Círculo central
    campoGfx.strokeCircle(LARGURA_JOGO / 2, CHAO_Y + 70, 60);
    // Linhas de contorno
    campoGfx.strokeRect(30, CHAO_Y, LARGURA_JOGO - 60, ALTURA_JOGO - CHAO_Y - 10);

    // Áreas dos gols
    campoGfx.strokeRect(30, CHAO_Y + 20, 100, 90);
    campoGfx.strokeRect(LARGURA_JOGO - 130, CHAO_Y + 20, 100, 90);

    // Traves dos gols
    campoGfx.lineStyle(4, 0xdddddd, 0.8);
    // Gol esquerdo
    campoGfx.lineBetween(50, CHAO_Y - 60, 50, CHAO_Y);
    campoGfx.lineBetween(50, CHAO_Y - 60, 110, CHAO_Y - 60);
    campoGfx.lineBetween(110, CHAO_Y - 60, 110, CHAO_Y);
    // Gol direito
    campoGfx.lineBetween(LARGURA_JOGO - 50, CHAO_Y - 60, LARGURA_JOGO - 50, CHAO_Y);
    campoGfx.lineBetween(LARGURA_JOGO - 50, CHAO_Y - 60, LARGURA_JOGO - 110, CHAO_Y - 60);
    campoGfx.lineBetween(LARGURA_JOGO - 110, CHAO_Y - 60, LARGURA_JOGO - 110, CHAO_Y);

    // ── Muros / cercas da arena ──────────────
    const muroGfx = this.add.graphics().setDepth(2);
    muroGfx.lineStyle(3, 0x556677, 0.6);
    muroGfx.lineBetween(30, CHAO_Y - 80, 30, CHAO_Y);
    muroGfx.lineBetween(LARGURA_JOGO - 30, CHAO_Y - 80, LARGURA_JOGO - 30, CHAO_Y);

    // Postes da cerca
    for (let i = 0; i <= 16; i++) {
      const fx = 30 + (LARGURA_JOGO - 60) * (i / 16);
      muroGfx.lineStyle(1, 0x445566, 0.4);
      muroGfx.lineBetween(fx, CHAO_Y - 80, fx, CHAO_Y - 65);
    }
    muroGfx.lineStyle(1, 0x445566, 0.3);
    muroGfx.lineBetween(30, CHAO_Y - 80, LARGURA_JOGO - 30, CHAO_Y - 80);

    // ── Sobreposição de ambiente ─────────────
    this.add.rectangle(
      LARGURA_JOGO / 2, ALTURA_JOGO / 2,
      LARGURA_JOGO, ALTURA_JOGO,
      ciclo.corAmbiente, ciclo.alfaAmbiente
    ).setDepth(15).setBlendMode(Phaser.BlendModes.ADD);

    // ── Torcida no fundo ─────────────────────
    if (ciclo.nome !== 'noite') {
      const torcidaGfx = this.add.graphics().setDepth(0);
      for (let i = 0; i < 40; i++) {
        const tx = 40 + Math.random() * (LARGURA_JOGO - 80);
        const ty = CHAO_Y - 85 - Math.random() * 30;
        const cor = [0x334455, 0x445566, 0x223344, 0x2a3a4a][Math.floor(Math.random() * 4)];
        torcidaGfx.fillStyle(cor, 0.5 + Math.random() * 0.3);
        torcidaGfx.fillCircle(tx, ty, 4 + Math.random() * 3);
      }
    }
  }

  // ═══════════════════════════════════════════
  //  HUD (Interface do Jogador)
  // ═══════════════════════════════════════════
  private _criarHUD(): void {
    const profundidade = 25;

    // ── Barra de Vigor J1 ────────────────────
    this.add.text(30, 35, 'VIGOR — JOGADOR 1', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '10px',
      color: '#aabbcc',
    }).setDepth(profundidade);

    this.barraVigorJ1 = this.add.graphics().setDepth(profundidade);
    this.rotuloVigorJ1 = this.add.text(30 + 250, 55, '100%', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '11px',
      color: '#88ccff',
    }).setOrigin(1, 0.5).setDepth(profundidade);

    // ── Barra de Vigor J2 ────────────────────
    this.add.text(LARGURA_JOGO - 280, 35, 'VIGOR — CPU', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '10px',
      color: '#ccbbaa',
    }).setDepth(profundidade);

    this.barraVigorJ2 = this.add.graphics().setDepth(profundidade);
    this.rotuloVigorJ2 = this.add.text(LARGURA_JOGO - 30, 55, '100%', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '11px',
      color: '#ffcc88',
    }).setOrigin(1, 0.5).setDepth(profundidade);

    // ── Ícones de Exausto ────────────────────
    this.iconeExaustoJ1 = this.add.text(0, 0, '😤', {
      fontSize: '20px',
    }).setOrigin(0.5).setDepth(profundidade).setVisible(false);

    this.iconeExaustoJ2 = this.add.text(0, 0, '😤', {
      fontSize: '20px',
    }).setOrigin(0.5).setDepth(profundidade).setVisible(false);

    // ── Rótulo do Ciclo Horário ──────────────
    this.add.text(LARGURA_JOGO / 2, ALTURA_JOGO - 15, `🕐 ${this.cicloHorario.rotuloPt}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#66778880',
    }).setOrigin(0.5).setDepth(profundidade);
  }

  private _atualizarHUD(): void {
    const larguraBarra = 220;
    const alturaBarra = 14;

    // ── Barra J1 ─────────────────────────────
    this.barraVigorJ1.clear();
    const razaoJ1 = this.jogador1.vigor / VIGOR_MAXIMO;

    // Fundo
    this.barraVigorJ1.fillStyle(0x111122, 0.8);
    this.barraVigorJ1.fillRoundedRect(30, 48, larguraBarra, alturaBarra, 4);
    // Preenchimento (muda de cor conforme o vigor)
    const corJ1 = razaoJ1 > 0.5 ? 0x42a5f5 : razaoJ1 > 0.2 ? 0xff9800 : 0xf44336;
    this.barraVigorJ1.fillStyle(corJ1, 0.9);
    this.barraVigorJ1.fillRoundedRect(30, 48, larguraBarra * razaoJ1, alturaBarra, 4);
    // Borda
    this.barraVigorJ1.lineStyle(1, 0x334455, 0.6);
    this.barraVigorJ1.strokeRoundedRect(30, 48, larguraBarra, alturaBarra, 4);
    // Brilho pulsante quando baixo
    if (razaoJ1 < 0.2) {
      this.barraVigorJ1.fillStyle(0xf44336, 0.2 + Math.sin(Date.now() * 0.01) * 0.1);
      this.barraVigorJ1.fillRoundedRect(28, 46, larguraBarra + 4, alturaBarra + 4, 6);
    }
    this.rotuloVigorJ1.setText(`${Math.floor(this.jogador1.vigor)}%`);

    // ── Barra J2 ─────────────────────────────
    this.barraVigorJ2.clear();
    const razaoJ2 = this.jogador2.vigor / VIGOR_MAXIMO;
    const j2X = LARGURA_JOGO - 30 - larguraBarra;

    this.barraVigorJ2.fillStyle(0x111122, 0.8);
    this.barraVigorJ2.fillRoundedRect(j2X, 48, larguraBarra, alturaBarra, 4);
    const corJ2 = razaoJ2 > 0.5 ? 0xffa726 : razaoJ2 > 0.2 ? 0xff9800 : 0xf44336;
    this.barraVigorJ2.fillStyle(corJ2, 0.9);
    this.barraVigorJ2.fillRoundedRect(j2X, 48, larguraBarra * razaoJ2, alturaBarra, 4);
    this.barraVigorJ2.lineStyle(1, 0x443322, 0.6);
    this.barraVigorJ2.strokeRoundedRect(j2X, 48, larguraBarra, alturaBarra, 4);
    this.rotuloVigorJ2.setText(`${Math.floor(this.jogador2.vigor)}%`);

    // ── Ícones de Exausto ────────────────────
    this.iconeExaustoJ1.setVisible(this.jogador1.estaExausto);
    this.iconeExaustoJ1.setPosition(this.jogador1.sprite.x, this.jogador1.sprite.y - 85);

    this.iconeExaustoJ2.setVisible(this.jogador2.estaExausto);
    this.iconeExaustoJ2.setPosition(this.jogador2.sprite.x, this.jogador2.sprite.y - 85);
  }
}
