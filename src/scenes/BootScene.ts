import Phaser from 'phaser';
import { LARGURA_JOGO, ALTURA_JOGO, UNIFORMES } from '../constantes';
import paradoUrl from '../assets/sprites/parado.png';
import andandoUrl from '../assets/sprites/andando.png';
import correndoUrl from '../assets/sprites/correndo.png';
import chutandoUrl from '../assets/sprites/chutando.png';
import pulandoUrl from '../assets/sprites/pulando.png';
import socoUrl from '../assets/sprites/soco.png';
import fundoUrl from '../assets/sprites/imagem_fundo.png';
import bolaPoderUrl from '../assets/fx/bola_poder_parada.png';
import bolaChutadaUrl from '../assets/fx/bola_poder_chutada.png';
import placarUrl from '../assets/ui/placar.png';
import inicialUrl from '../assets/ui/inicial.png';
import estadioUrl from '../assets/ui/estadio.jpeg';
import garraUrl from '../assets/ui/garra.png';
import sangueUrl from '../assets/ui/sangue.png';
import { UniformPipeline } from '../pipelines/UniformPipeline';

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

    const fundo = this.add.rectangle(LARGURA_JOGO / 2, barraY, larguraBarra, alturaBarra, 0x000000, 1);
    fundo.setStrokeStyle(2, 0xffffff);
    const preenchimento = this.add.rectangle(barraX + 2, barraY, 0, alturaBarra - 4, 0x27ae60, 1); // Verde
    preenchimento.setOrigin(0, 0.5);

    const rotulo = this.add.text(LARGURA_JOGO / 2, barraY - 40, 'CARREGANDO SISTEMA...', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (valor: number) => {
      preenchimento.width = (larguraBarra - 4) * valor;
    });
    this.load.on('complete', () => {
      fundo.destroy();
      preenchimento.destroy();
      rotulo.destroy();
    });

    // Carregar Spritesheets do Jogador (Novas)
    // Cada sheet tem 2560x1440. O frameWidth depende do número de frames.
    this.load.spritesheet('p_parado', paradoUrl, { frameWidth: Math.floor(2560 / 4), frameHeight: 1440 });
    this.load.spritesheet('p_andando', andandoUrl, { frameWidth: Math.floor(2560 / 6), frameHeight: 1440 });
    this.load.spritesheet('p_correndo', correndoUrl, { frameWidth: Math.floor(2560 / 6), frameHeight: 1440 });
    this.load.spritesheet('p_chutando', chutandoUrl, { frameWidth: Math.floor(2560 / 4), frameHeight: 1440 });
    this.load.spritesheet('p_pulando', pulandoUrl, { frameWidth: Math.floor(2560 / 5), frameHeight: 1440 });
    this.load.spritesheet('p_soco', socoUrl, { frameWidth: Math.floor(2560 / 3), frameHeight: 1440 });

    this.load.spritesheet('bola_poder', bolaPoderUrl, { frameWidth: Math.floor(582 / 4), frameHeight: 429 });
    this.load.image('bola_chutada', bolaChutadaUrl);
    this.load.image('placar', placarUrl);
    this.load.image('inicial', inicialUrl);

    // Logos dos Times
    this.load.image('garra', garraUrl);
    this.load.image('sangue', sangueUrl);

    // Fundo do Estádio
    this.load.image('estadio', fundoUrl);
  }

  create(): void {
    if (this.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
      this.renderer.pipelines.addPostPipeline('UniformPipeline', UniformPipeline);
    }
    this._gerarTexturas();
    this._criarAnimacoes();
    this.scene.start('CenaMenu');
  }

  private _criarAnimacoes(): void {
    // Idle / Parado (Estabilizado usando apenas o primeiro frame)
    this.anims.create({
      key: 'player_idle',
      frames: this.anims.generateFrameNumbers('p_parado', { start: 0, end: 0 }),
      frameRate: 1,
      repeat: -1
    });

    // Walking / Andando (6 frames)
    this.anims.create({
      key: 'player_walk',
      frames: this.anims.generateFrameNumbers('p_andando', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });

    // Running / Correndo (6 frames)
    this.anims.create({
      key: 'player_run',
      frames: this.anims.generateFrameNumbers('p_correndo', { start: 0, end: 5 }),
      frameRate: 18,
      repeat: -1
    });

    // Kick / Chute (4 frames)
    this.anims.create({
      key: 'player_kick',
      frames: this.anims.generateFrameNumbers('p_chutando', { start: 0, end: 3 }),
      frameRate: 12,
      repeat: 0
    });

    // Punch / Soco (3 frames)
    this.anims.create({
      key: 'player_punch',
      frames: this.anims.generateFrameNumbers('p_soco', { start: 0, end: 2 }),
      frameRate: 12,
      repeat: 0
    });

    // Jump / Pulo (Frames 0-2 de pulando.png)
    this.anims.create({
      key: 'player_jump',
      frames: this.anims.generateFrameNumbers('p_pulando', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: 0
    });

    // Fall / Queda (Frames 3-4 de pulando.png)
    this.anims.create({
      key: 'player_fall',
      frames: this.anims.generateFrameNumbers('p_pulando', { start: 3, end: 4 }),
      frameRate: 10,
      repeat: -1
    });

    // Slide / Carrinho (Ainda não temos sprite específica, vamos usar um frame de soco ou queda por enquanto)
    this.anims.create({
      key: 'player_slide',
      frames: this.anims.generateFrameNumbers('p_soco', { start: 1, end: 1 }),
      frameRate: 10,
      repeat: 0
    });

    // Exhausted / Ofegante
    this.anims.create({
      key: 'player_exhausted',
      frames: this.anims.generateFrameNumbers('p_parado', { start: 0, end: 1 }),
      frameRate: 4,
      repeat: -1
    });

    // Bola de Poder — 4 frames animados
    this.anims.create({
      key: 'bola_poder_anim',
      frames: this.anims.generateFrameNumbers('bola_poder', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
  }

  // ─── Geração procedural de texturas (Bola e Partícula) ────────
  private _gerarTexturas(): void {
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

    // Mantemos as texturas procedurais dos jogadores por compatibilidade se necessário,
    // mas vamos usar a spritesheet na CenaJogo.
    for (const uniforme of UNIFORMES) {
      this._criarTexturaJogador(uniforme.id, uniforme.corPrimaria, uniforme.corSecundaria);
    }
  }

  private _criarTexturaJogador(chave: string, primaria: number, secundaria: number): void {
    const larg = 48;
    const alt = 72;
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(secundaria, 1);
    gfx.fillRect(12, 48, 10, 20);
    gfx.fillRect(26, 48, 10, 20);
    gfx.fillStyle(0x222222, 1);
    gfx.fillRect(12, 64, 10, 8);
    gfx.fillRect(26, 64, 10, 8);
    gfx.fillStyle(primaria, 1);
    gfx.fillRoundedRect(8, 20, 32, 30, 4);
    gfx.fillStyle(secundaria, 0.6);
    gfx.fillRect(8, 32, 32, 6);
    gfx.fillStyle(primaria, 1);
    gfx.fillRect(2, 22, 8, 18);
    gfx.fillRect(38, 22, 8, 18);
    gfx.fillStyle(0xe0a97a, 1);
    gfx.fillRect(3, 38, 6, 6);
    gfx.fillRect(39, 38, 6, 6);
    gfx.fillStyle(0xe0a97a, 1);
    gfx.fillCircle(24, 12, 12);
    gfx.fillStyle(0x3e2723, 1);
    gfx.fillEllipse(24, 6, 22, 12);
    gfx.fillStyle(0x111111, 1);
    gfx.fillCircle(19, 12, 2);
    gfx.fillCircle(29, 12, 2);
    gfx.fillStyle(secundaria, 1);
    gfx.fillRect(20, 26, 8, 10);
    gfx.generateTexture(`jogador_${chave}`, larg, alt);
    gfx.destroy();

    // Corrida 0 e 1 (simplificado)
    for (let i = 0; i < 2; i++) {
        const gfxC = this.make.graphics({x:0, y:0});
        gfxC.fillStyle(primaria, 1);
        gfxC.fillRect(0,0, larg, alt);
        gfxC.generateTexture(`jogador_${chave}_correndo${i}`, larg, alt);
        gfxC.destroy();
    }
    // Ofegante
    const gfxE = this.make.graphics({x:0, y:0});
    gfxE.fillStyle(primaria, 0.5);
    gfxE.fillRect(0,0, larg, alt);
    gfxE.generateTexture(`jogador_${chave}_ofegante`, larg, alt);
    gfxE.destroy();
  }
}