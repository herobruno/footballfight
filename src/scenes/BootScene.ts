import Phaser from 'phaser';
import { LARGURA_JOGO, ALTURA_JOGO, UNIFORMES } from '../constantes';
import playerSheetUrl from '../assets/sprites/player_sheet.png';
import estadioUrl from '../assets/ui/estadio.jpeg';

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

    // Carregar Spritesheet do Jogador
    this.load.spritesheet('player_sheet', playerSheetUrl, {
      frameWidth: 56,
      frameHeight: 61,
    });

    // Carregar Fundo do Estádio
    this.load.image('estadio', estadioUrl);
  }

  create(): void {
    this._gerarTexturas();
    this._criarAnimacoes();
    this.scene.start('CenaMenu');
  }

  private _criarAnimacoes(): void {
    // Idle / Parado
    this.anims.create({
      key: 'player_idle',
      frames: this.anims.generateFrameNumbers('player_sheet', { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1
    });

    // Walking / Andando
    this.anims.create({
      key: 'player_walk',
      frames: this.anims.generateFrameNumbers('player_sheet', { start: 0, end: 11 }),
      frameRate: 12,
      repeat: -1
    });

    // Running / Correndo
    this.anims.create({
      key: 'player_run',
      frames: this.anims.generateFrameNumbers('player_sheet', { start: 12, end: 23 }),
      frameRate: 16,
      repeat: -1
    });

    // Kick / Chute
    this.anims.create({
      key: 'player_kick',
      frames: this.anims.generateFrameNumbers('player_sheet', { start: 36, end: 47 }),
      frameRate: 20,
      repeat: 0
    });

    // Jump / Pulo
    this.anims.create({
      key: 'player_jump',
      frames: this.anims.generateFrameNumbers('player_sheet', { start: 60, end: 62 }),
      frameRate: 10,
      repeat: 0
    });

    // Fall / Queda
    this.anims.create({
      key: 'player_fall',
      frames: this.anims.generateFrameNumbers('player_sheet', { start: 63, end: 64 }),
      frameRate: 10,
      repeat: -1
    });

    // Slide / Carrinho
    this.anims.create({
      key: 'player_slide',
      frames: this.anims.generateFrameNumbers('player_sheet', { start: 67, end: 69 }),
      frameRate: 10,
      repeat: 0
    });

    // Exhausted / Ofegante
    this.anims.create({
      key: 'player_exhausted',
      frames: [{ key: 'player_sheet', frame: 71 }],
      frameRate: 1,
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