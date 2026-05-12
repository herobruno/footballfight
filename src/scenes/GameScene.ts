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
    soco: Phaser.Input.Keyboard.Key;
    chute: Phaser.Input.Keyboard.Key;
    espaco: Phaser.Input.Keyboard.Key;
    pegar: Phaser.Input.Keyboard.Key;
  };

  // Elementos do HUD (DOM)
  private domHud: {
    h1: HTMLElement | null; h1Label: HTMLElement | null;
    s1: HTMLElement | null; s1Label: HTMLElement | null;
    h2: HTMLElement | null; h2Label: HTMLElement | null;
    s2: HTMLElement | null; s2Label: HTMLElement | null;
    scoreboard: HTMLElement | null;
    score1: HTMLElement | null;
    score2: HTMLElement | null;
    timer: HTMLElement | null;
  } = {
    h1: null, h1Label: null, s1: null, s1Label: null,
    h2: null, h2Label: null, s2: null, s2Label: null,
    scoreboard: null, score1: null, score2: null,
    timer: null
  };

  private promptInteracao!: Phaser.GameObjects.Text;
  private estaBrilhando: boolean = false;
  private emissorBrilho?: Phaser.GameObjects.Particles.ParticleEmitter;

  private iconeExaustoJ1!: Phaser.GameObjects.Text;
  private iconeExaustoJ2!: Phaser.GameObjects.Text;

  // Arena
  private cicloHorario!: PresetHorario;
  private fimDeJogo: boolean = false;
  private vitoriasJ1: number = 0;
  private vitoriasJ2: number = 0;
  private numeroRound: number = 1;
  private tempoRestante: number = 120; // 2 minutos
  private eventoCronometro?: Phaser.Time.TimerEvent;

  // Bolas de poder
  private bolasDePoder: { 
    sprite: Phaser.GameObjects.Sprite, 
    velocidadeY: number,
    emissor: Phaser.GameObjects.Particles.ParticleEmitter 
  }[] = [];

  private projeteis: {
    sprite: Phaser.GameObjects.Sprite,
    velocidadeX: number,
    emissor: Phaser.GameObjects.Particles.ParticleEmitter
  }[] = [];

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

    // Inicializar câmera na posição correta
    this._atualizarCamera(0);

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
      soco: teclado.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      chute: teclado.addKey(Phaser.Input.Keyboard.KeyCodes.X),
      espaco: teclado.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      pegar: teclado.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    };

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
          const j = this.jogador1;
          if (j && !j.estaChutando) {
              const animKey = j.sprite.anims.currentAnim?.key;
              
              if (this.estaBrilhando) {
                  // Se estiver com a bola de poder, o clique vira DISPARO de projetil
                  if (!j.sprite.anims.isPlaying || animKey !== 'player_kick') {
                      j.estaChutando = true;
                      j.sprite.play('player_kick');
                      
                      // Disparar o projetil apos um pequeno delay para sincronizar com o pe
                      this.time.delayedCall(100, () => {
                          this._dispararProjetil(j);
                      });

                      j.sprite.once('animationcomplete', () => { j.estaChutando = false; });
                  }
              } else {
                  // Senão, é o SOCO normal
                  if (!j.sprite.anims.isPlaying || animKey !== 'player_punch') {
                      j.sprite.play('player_punch');
                      this._verificarAtaque(j, this.jogador2, 10);
                  }
              }
          }
      }
    });

    // ── Dica de pausa ────────────────────────
    // Removido o texto fixo de ESC conforme solicitado

    // Prompt de interação (E com seta para baixo)
    this.promptInteracao = this.add.text(0, 0, 'E\n↓', {
        fontFamily: 'Orbitron, monospace',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#00ffff',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center'
    }).setOrigin(0.5, 1).setDepth(20).setVisible(false);

    teclado.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => {
      this.cameras.main.fade(400, 0, 0, 0, false, (_c: Phaser.Cameras.Scene2D.Camera, p: number) => {
        if (p >= 1) this.scene.start('CenaMenu');
      });
    });

    // ── Timer para Bolas de Poder ────────────────
    this.time.addEvent({
      delay: 5000, // a cada 5 segundos
      loop: true,
      callback: this._spawnBolaDePoder,
      callbackScope: this
    });

    // ── Fade in ──────────────────────────────
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private _spawnBolaDePoder(): void {
    const alvo = Math.random() > 0.5 ? this.jogador1.sprite : this.jogador2.sprite;
    const x = alvo.x;

    const sprite = this.add.sprite(x, -50, 'bola_poder').setOrigin(0.5, 1).setDepth(8);
    sprite.setScale(0.08); 
    
    // Partículas de raio ao redor da bola
    const emissor = this.add.particles(0, 0, 'particula', {
        speed: { min: 50, max: 150 },
        scale: { start: 0.4, end: 0 },
        tint: [0x00ffff, 0xffffff, 0x00aaff],
        lifespan: 200,
        blendMode: 'ADD',
        frequency: 50,
        follow: sprite,
        followOffset: { x: 0, y: -20 }
    });

    const bolaData = { sprite, velocidadeY: 0, emissor };
    this.bolasDePoder.push(bolaData);
  }

  private _coletarBola(bola: any): void {
    // Remover bola
    bola.emissor.destroy();
    bola.sprite.destroy();
    this.bolasDePoder = this.bolasDePoder.filter(b => b !== bola);
    this.promptInteracao.setVisible(false);

    // Efeito de brilho no jogador
    this._ativarBrilhoJogador();
  }

  private _ativarBrilhoJogador(): void {
    if (this.estaBrilhando) return;
    this.estaBrilhando = true;

    this.emissorBrilho = this.add.particles(0, 0, 'particula', {
        speed: { min: 20, max: 100 },
        scale: { start: 0.5, end: 0 },
        tint: [0x00ffff, 0xffffff],
        lifespan: 600,
        blendMode: 'ADD',
        frequency: 20,
        follow: this.jogador1.sprite,
        followOffset: { x: 0, y: -40 }
    });
  }

  private _removerBrilho(): void {
    if (this.emissorBrilho) {
        this.emissorBrilho.destroy();
        this.emissorBrilho = undefined;
    }
    this.estaBrilhando = false;
  }

  private _dispararProjetil(atacante: DadosJogador): void {
    const direcao = atacante.olhandoDireita ? 1 : -1;
    const x = atacante.sprite.x + (50 * direcao);
    const y = atacante.sprite.y - 60;

    const sprite = this.add.sprite(x, y, 'bola_chutada').setDepth(9);
    sprite.setScale(0.12);
    if (direcao === -1) sprite.setFlipX(true);

    const emissor = this.add.particles(0, 0, 'particula', {
        speed: { min: 20, max: 50 },
        scale: { start: 0.5, end: 0 },
        tint: [0x00ffff, 0xffffff],
        lifespan: 300,
        blendMode: 'ADD',
        frequency: 30,
        follow: sprite
    });

    this.projeteis.push({ sprite, velocidadeX: 1200 * direcao, emissor });

    // Consumir o poder
    this._removerBrilho();
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
    this._atualizarBolasDePoder(dt);
    this._atualizarProjeteis(dt);
    this._atualizarHUD();
    this._atualizarCamera(dt);

    this._verificarFimDeRound();
  }

  private _atualizarCamera(dt: number): void {
    const p1 = this.jogador1.sprite;
    const p2 = this.jogador2.sprite;

    // 1. Calcular ponto médio entre os jogadores
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2 - 100; // Olhar um pouco acima do chão

    // 2. Calcular distância para determinar o zoom
    const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
    
    // Zoom varia entre 0.85 (longe) e 1.2 (perto)
    let zoomAlvo = 1.2 - (dist / 1200);
    zoomAlvo = Phaser.Math.Clamp(zoomAlvo, 0.85, 1.2);

    // 3. Aplicar suavização (Lerp)
    const suavizacao = 0.05; // Ajuste para mais ou menos fluidez
    
    // Seguir o ponto médio
    this.cameras.main.scrollX = Phaser.Math.Linear(this.cameras.main.scrollX, midX - (LARGURA_JOGO / 2) / this.cameras.main.zoom, suavizacao);
    this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, midY - (ALTURA_JOGO / 2) / this.cameras.main.zoom, suavizacao);
    
    // Aplicar zoom suave
    this.cameras.main.zoom = Phaser.Math.Linear(this.cameras.main.zoom, zoomAlvo, suavizacao);
  }

  private _verificarFimDeRound(): void {
    if (this.fimDeJogo) return;

    if (this.jogador1.vida <= 0 || this.jogador2.vida <= 0) {
        const vencedor = this.jogador1.vida > 0 ? 1 : 2;
        if (vencedor === 1) this.vitoriasJ1++;
        else this.vitoriasJ2++;

        if (this.domHud.score1) this.domHud.score1.innerText = `${this.vitoriasJ1}`;
        if (this.domHud.score2) this.domHud.score2.innerText = `${this.vitoriasJ2}`;

        if (this.vitoriasJ1 >= 2 || this.vitoriasJ2 >= 2) {
            this._finalizarJogo(vencedor === 1 ? 'VOCÊ VENCEU A PARTIDA!' : 'CPU VENCEU A PARTIDA!');
        } else {
            this._proximoRound();
        }
    }
  }

  private _proximoRound(): void {
    this.fimDeJogo = true; // Pausa temporária
    this.numeroRound++;

    const overlay = this.add.text(LARGURA_JOGO / 2, ALTURA_JOGO / 2, `ROUND ${this.numeroRound}`, {
        fontFamily: 'Orbitron, monospace',
        fontSize: '64px',
        fontStyle: 'bold',
        color: '#00ffff',
        stroke: '#000000',
        strokeThickness: 8
    }).setOrigin(0.5).setDepth(100).setAlpha(0);

    this.tweens.add({
        targets: overlay,
        alpha: 1,
        duration: 500,
        yoyo: true,
        hold: 1000,
        onComplete: () => {
            overlay.destroy();
            this._resetarPosicoesERound();
            this.fimDeJogo = false;
        }
    });
  }

  private _resetarPosicoesERound(): void {
    // Resetar tempo (opcional: o tempo reseta a cada round ou é continuo?)
    // Vou assumir que o tempo é continuo para a partida toda, 
    // mas se quiser resetar a cada round, descomente a linha abaixo:
    // this._iniciarCronometro();

    // Resetar vida e vigor
    this.jogador1.vida = 100;
    this.jogador1.vigor = 100;
    this.jogador2.vida = 100;
    this.jogador2.vigor = 100;

    // Reposicionar
    this.jogador1.sprite.setPosition(LARGURA_JOGO * 0.25, CHAO_Y);
    this.jogador2.sprite.setPosition(LARGURA_JOGO * 0.75, CHAO_Y);
    
    this.jogador1.velocidadeX = 0;
    this.jogador1.velocidadeY = 0;
    this.jogador2.velocidadeX = 0;
    this.jogador2.velocidadeY = 0;

    // Limpar projeteis e bolas
    this.projeteis.forEach(p => { p.sprite.destroy(); p.emissor.destroy(); });
    this.projeteis = [];
    this._removerBrilho();
  }

  private _finalizarJogo(mensagem: string): void {
    this.fimDeJogo = true;
    
    // Parar movimentos
    this.jogador1.velocidadeX = 0;
    this.jogador2.velocidadeX = 0;

    // Esconder HUD de HP/Stamina
    const containers = document.querySelectorAll('.hud-container');
    containers.forEach(c => (c as HTMLElement).style.display = 'none');

    // Tela preta total atras (fixa na camera)
    const bgPreto = this.add.rectangle(0, 0, LARGURA_JOGO, ALTURA_JOGO, 0x000000)
        .setOrigin(0)
        .setDepth(90)
        .setAlpha(0)
        .setInteractive()
        .setScrollFactor(0); // FIXO NA TELA

    this.tweens.add({
        targets: bgPreto,
        alpha: 1,
        duration: 500
    });

    // Mostrar Placar Final CSS
    if (this.domHud.scoreboard) {
        this.domHud.scoreboard.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        this.domHud.scoreboard.style.top = '50%';
        this.domHud.scoreboard.style.transform = 'translateX(-50%) translateY(-100%) scale(2)';
    }

    const texto = this.add.text(LARGURA_JOGO / 2, ALTURA_JOGO / 2 + 50, mensagem, {
        fontFamily: 'Orbitron, monospace',
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6
    }).setOrigin(0.5).setDepth(101).setAlpha(0).setScrollFactor(0);

    const subtexto = this.add.text(LARGURA_JOGO / 2, ALTURA_JOGO / 2 + 110, 'Pressione ESC para sair', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '18px',
        color: '#00ffff'
    }).setOrigin(0.5).setDepth(101).setAlpha(0).setScrollFactor(0);

    this.tweens.add({
        targets: [texto, subtexto],
        alpha: 1,
        delay: 500,
        duration: 500
    });
  }

  private _atualizarProjeteis(dt: number): void {
    for (let i = this.projeteis.length - 1; i >= 0; i--) {
        const p = this.projeteis[i];
        p.sprite.x += p.velocidadeX * dt;

        // Colisao com Jogador 2 (se o J1 disparou)
        const dist = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, this.jogador2.sprite.x, this.jogador2.sprite.y - 80);
        if (dist < 80) {
            // Causar dano massivo
            this.jogador2.vida -= 40;
            this.jogador2.vida = Math.max(0, this.jogador2.vida);
            this.jogador2.sprite.setTint(0xff0000);
            this.time.delayedCall(150, () => {
                const uniforme = UNIFORMES.find(u => u.id === this.jogador2.idUniforme);
                this.jogador2.sprite.setTint(uniforme ? uniforme.corPrimaria : 0xffffff);
            });
            this._criarParticulasImpacto(p.sprite.x, p.sprite.y);

            // Remover projetil
            p.emissor.destroy();
            p.sprite.destroy();
            this.projeteis.splice(i, 1);
            continue;
        }

        // Remover se sair da tela
        if (p.sprite.x < -100 || p.sprite.x > LARGURA_JOGO + 100) {
            p.emissor.destroy();
            p.sprite.destroy();
            this.projeteis.splice(i, 1);
        }
    }
  }

  private _atualizarBolasDePoder(dt: number): void {
    let alguemPerto = false;

    for (let i = this.bolasDePoder.length - 1; i >= 0; i--) {
      const bola = this.bolasDePoder[i];
      if (bola.sprite.y < CHAO_Y) {
        bola.velocidadeY += 980 * dt; // gravidade
        bola.sprite.y += bola.velocidadeY * dt;
        if (bola.sprite.y >= CHAO_Y) {
          bola.sprite.y = CHAO_Y;
          bola.velocidadeY = 0;
        }
      }

      // Checar proximidade com jogador 1
      const dist = Phaser.Math.Distance.Between(this.jogador1.sprite.x, this.jogador1.sprite.y, bola.sprite.x, bola.sprite.y);
      if (dist < 100) {
          this.promptInteracao.setPosition(bola.sprite.x, bola.sprite.y - 60);
          this.promptInteracao.setVisible(true);
          alguemPerto = true;
      }
    }

    if (!alguemPerto) {
        this.promptInteracao.setVisible(false);
    }
  }

  // ═══════════════════════════════════════════
  //  CRIAÇÃO DO JOGADOR
  // ═══════════════════════════════════════════
  private _criarJogador(x: number, y: number, idUniforme: string, olhandoDireita: boolean): DadosJogador {
    const sprite = this.add.sprite(x, y, 'p_parado').setOrigin(0.5, 1).setDepth(10).setScale(0.13);
    
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
    if (this.fimDeJogo) return;

    const moverEsquerda = this.teclas.esquerda.isDown || this.teclas.a.isDown;
    const moverDireita = this.teclas.direita.isDown || this.teclas.d.isDown;
    const querCorrer = this.teclas.correr.isDown && jogador.vigor > LIMIAR_EXAUSTO;
    const querPular = Phaser.Input.Keyboard.JustDown(this.teclas.cima) || 
                      Phaser.Input.Keyboard.JustDown(this.teclas.w) ||
                      Phaser.Input.Keyboard.JustDown(this.teclas.espaco);
    const querSocar = Phaser.Input.Keyboard.JustDown(this.teclas.soco);
    const querChutar = Phaser.Input.Keyboard.JustDown(this.teclas.chute);
    const querPegar = Phaser.Input.Keyboard.JustDown(this.teclas.pegar);

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

    if (querSocar && !jogador.estaChutando && (!jogador.sprite.anims.isPlaying || jogador.sprite.anims.currentAnim?.key !== 'player_punch')) {
        jogador.sprite.play('player_punch');
    }

    if (querChutar && !jogador.estaChutando) {
        jogador.estaChutando = true;
        jogador.sprite.play('player_kick');
        this._verificarAtaque(jogador, this.jogador2, 15); // Chute tira 15
        jogador.sprite.once('animationcomplete', () => {
            jogador.estaChutando = false;
        });
    }

    if (querPegar && jogador === this.jogador1) {
        // Tentar pegar a bola mais próxima
        for (const bola of this.bolasDePoder) {
            const dist = Phaser.Math.Distance.Between(jogador.sprite.x, jogador.sprite.y, bola.sprite.x, bola.sprite.y);
            if (dist < 100) {
                this._coletarBola(bola);
                break;
            }
        }
    }
  }

  // ═══════════════════════════════════════════
  //  IA SIMPLES (Jogador 2 - CPU)
  // ═══════════════════════════════════════════
  private _atualizarIA(jogador: DadosJogador, _dt: number): void {
    if (this.fimDeJogo) {
        jogador.velocidadeX = 0;
        return;
    }

    const alvo = this.jogador1.sprite;
    const distancia = alvo.x - jogador.sprite.x;
    const distanciaAbs = Math.abs(distancia);
    const yDiff = alvo.y - jogador.sprite.y;

    // Decisão de Direção
    jogador.olhandoDireita = distancia > 0;
    jogador.sprite.setFlipX(!jogador.olhandoDireita);

    // Movimentação
    const alcanceAtaque = 100;
    
    if (distanciaAbs > alcanceAtaque) {
      // Se estiver longe, corre em direção ao jogador
      const velocidade = (distanciaAbs > 300) ? VELOCIDADE_CORRER * 0.9 : VELOCIDADE_ANDAR;
      jogador.velocidadeX = distancia > 0 ? velocidade : -velocidade;
      jogador.estaCorrendo = (distanciaAbs > 300 && jogador.vigor > 20);
    } else {
      // Se estiver muito perto, para para bater
      jogador.velocidadeX = 0;
      jogador.estaCorrendo = false;
    }

    // Pulo reativo (se o jogador pular ou ocasionalmente)
    if (jogador.noChao) {
        if ((yDiff < -100 && Math.random() < 0.05) || Math.random() < 0.005) {
            jogador.velocidadeY = FORCA_PULO;
            jogador.noChao = false;
        }
    }

    // Combate agressivo
    if (!jogador.sprite.anims.isPlaying || (jogador.sprite.anims.currentAnim?.key !== 'player_punch' && jogador.sprite.anims.currentAnim?.key !== 'player_kick')) {
        if (distanciaAbs < alcanceAtaque + 20) {
            // Chance de soco (6% a cada frame de update)
            if (Math.random() < 0.06 && jogador.vigor > 10) {
                jogador.sprite.play('player_punch');
                this._verificarAtaque(jogador, this.jogador1, 8);
                jogador.vigor -= 5;
            } 
            // Chance de chute (2% se tiver vigor)
            else if (Math.random() < 0.02 && jogador.vigor > 20) {
                jogador.sprite.play('player_kick');
                this._verificarAtaque(jogador, this.jogador1, 15);
                jogador.vigor -= 10;
            }
        }
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
  //  LOGICA DE COMBATE
  // ═══════════════════════════════════════════
  private _verificarAtaque(atacante: DadosJogador, defensor: DadosJogador, dano: number): void {
    // Atraso curto para o dano coincidir com o meio da animação
    this.time.delayedCall(150, () => {
      const dist = Math.abs(atacante.sprite.x - defensor.sprite.x);
      const alturaOk = Math.abs(atacante.sprite.y - defensor.sprite.y) < 100;
      
      const direcaoOk = atacante.olhandoDireita 
        ? (defensor.sprite.x > atacante.sprite.x)
        : (defensor.sprite.x < atacante.sprite.x);

      if (dist < 130 && alturaOk && direcaoOk) {
        defensor.vida -= dano;
        defensor.vida = Math.max(0, defensor.vida);
        
        // Efeito visual de impacto
        defensor.sprite.setTint(0xff0000);
        this.time.delayedCall(100, () => {
          const uniforme = UNIFORMES.find(u => u.id === defensor.idUniforme);
          defensor.sprite.setTint(uniforme ? uniforme.corPrimaria : 0xffffff);
        });

        // Partículas de impacto
        this._criarParticulasImpacto(defensor.sprite.x, defensor.sprite.y - 80);
      }
    });
  }

  private _criarParticulasImpacto(x: number, y: number): void {
    const particles = this.add.particles(x, y, 'particula', {
        speed: { min: 100, max: 200 },
        scale: { start: 1, end: 0 },
        blendMode: 'ADD',
        lifespan: 300,
        gravityY: 400,
        maxParticles: 8
    });
    this.time.delayedCall(400, () => particles.destroy());
  }
  
  // ═══════════════════════════════════════════
  //  ANIMAÇÕES
  // ═══════════════════════════════════════════
  private _atualizarAnimacoes(jogador: DadosJogador, _dt: number): void {
    if (jogador.estaChutando || (jogador.sprite.anims.isPlaying && jogador.sprite.anims.currentAnim?.key === 'player_punch')) return;

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
    fundoEstadio.setDisplaySize(1536, 1024); // Tamanho real do asset
    fundoEstadio.setDepth(0);

    // Configurar limites da câmera baseados no tamanho do estádio
    this.cameras.main.setBounds((1280 - 1536) / 2, (720 - 1024) / 2, 1536, 1024);

    // Astros Dinâmicos (Estrelas, Lua, Sol) sobre o fundo
    if (ciclo.nome === 'noite') {
      const estrelasGfx = this.add.graphics().setDepth(1);
      for (let i = 0; i < 60; i++) {
        const ex = Math.random() * LARGURA_JOGO;
        const ey = Math.random() * 300; // Limitar ao topo
        const tamanho = Math.random() * 2 + 0.5;
        estrelasGfx.fillStyle(0xffffff, Math.random() * 0.7 + 0.3);
        estrelasGfx.fillCircle(ex, ey, tamanho);
      }
      estrelasGfx.fillStyle(0xeeeedd, 0.9);
      estrelasGfx.fillCircle(LARGURA_JOGO - 150, 80, 35);
      estrelasGfx.fillStyle(0x000000, 0.2); // Sombra suave da lua
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
    ).setDepth(15).setBlendMode(Phaser.BlendModes.MULTIPLY);
  }


  // ═══════════════════════════════════════════
  //  HUD (CSS/DOM)
  // ═══════════════════════════════════════════
  private _criarHUD(): void {
    const profundidade = 25;

    // Esconder ao sair da cena
    this.events.once('shutdown', () => {
      const containers = document.querySelectorAll('.hud-container');
      containers.forEach(el => (el as HTMLElement).style.display = 'none');
      if (this.domHud.scoreboard) this.domHud.scoreboard.style.display = 'none';
    });

    // Referências do DOM
    this.domHud.h1 = document.getElementById('health-p1');
    this.domHud.h1Label = document.getElementById('health-label-p1');
    this.domHud.s1 = document.getElementById('stamina-p1');
    this.domHud.s1Label = document.getElementById('stamina-label-p1');
    this.domHud.h2 = document.getElementById('health-p2');
    this.domHud.h2Label = document.getElementById('health-label-p2');
    this.domHud.s2 = document.getElementById('stamina-p2');
    this.domHud.s2Label = document.getElementById('stamina-label-p2');
    this.domHud.scoreboard = document.getElementById('match-scoreboard');
    this.domHud.score1 = document.getElementById('score-p1');
    this.domHud.score2 = document.getElementById('score-p2');
    this.domHud.timer = document.getElementById('game-timer');

    const containers = document.querySelectorAll('.hud-container');
    containers.forEach(c => (c as HTMLElement).style.display = 'flex');
    if (this.domHud.scoreboard) {
        this.domHud.scoreboard.style.display = 'flex';
        // Resetar estilos de vitoria (caso venha de um fim de jogo anterior)
        this.domHud.scoreboard.style.transition = 'none';
        this.domHud.scoreboard.style.top = '20px';
        this.domHud.scoreboard.style.transform = 'translateX(-50%) scale(1)';
    }

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

    this._iniciarCronometro();
  }

  private _iniciarCronometro(): void {
    if (this.eventoCronometro) this.eventoCronometro.destroy();
    
    this.tempoRestante = 120;
    this.eventoCronometro = this.time.addEvent({
        delay: 1000,
        callback: this._atualizarCronometro,
        callbackScope: this,
        loop: true
    });
  }

  private _atualizarCronometro(): void {
    if (this.fimDeJogo) return;

    this.tempoRestante--;
    if (this.tempoRestante <= 0) {
        this.tempoRestante = 0;
        this.eventoCronometro?.destroy();
        this._verificarVencedorPorTempo();
    }

    if (this.domHud.timer) {
        const min = Math.floor(this.tempoRestante / 60);
        const seg = this.tempoRestante % 60;
        this.domHud.timer.innerText = `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
    }
  }

  private _verificarVencedorPorTempo(): void {
    if (this.vitoriasJ1 > this.vitoriasJ2) {
        this._finalizarJogo('VOCÊ VENCEU POR PONTOS!');
    } else if (this.vitoriasJ2 > this.vitoriasJ1) {
        this._finalizarJogo('CPU VENCEU POR PONTOS!');
    } else {
        // Empate ou critério de desempate por vida
        if (this.jogador1.vida > this.jogador2.vida) {
            this._finalizarJogo('EMPATE! VITÓRIA POR VIDA (J1)');
        } else {
            this._finalizarJogo('EMPATE! VITÓRIA POR VIDA (CPU)');
        }
    }
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
    this.iconeExaustoJ1.setPosition(this.jogador1.sprite.x, this.jogador1.sprite.y - 200);
    this.iconeExaustoJ2.setVisible(this.jogador2.estaExausto);
    this.iconeExaustoJ2.setPosition(this.jogador2.sprite.x, this.jogador2.sprite.y - 200);
  }
}
