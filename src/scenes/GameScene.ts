import Phaser from "phaser";
import {
  LARGURA_JOGO,
  ALTURA_JOGO,
  CHAO_Y,
  VELOCIDADE_ANDAR,
  VELOCIDADE_CORRER,
  FORCA_PULO,
  VIGOR_MAXIMO,
  VIDA_MAXIMA,
  GASTO_VIGOR_CORRER,
  REGEN_VIGOR_PARADO,
  REGEN_VIGOR_ANDANDO,
  LIMIAR_EXAUSTO,
  UNIFORMES,
  type PresetHorario,
  type OpcaoUniforme,
} from "../constantes";
import { obterEstado } from "../estado";
import { hexToRgbNormalized } from "../pipelines/UniformPipeline";

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
  // Timer para evitar tremor da IA
  timerDecisaoIA: number;
  decisaoIA: "atacar" | "fugir" | "bola" | "recuar" | "parado" | "nenhuma";
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
    h1: HTMLElement | null;
    h1Label: HTMLElement | null;
    s1: HTMLElement | null;
    s1Label: HTMLElement | null;
    h2: HTMLElement | null;
    h2Label: HTMLElement | null;
    s2: HTMLElement | null;
    s2Label: HTMLElement | null;
    scoreboard: HTMLElement | null;
    score1: HTMLElement | null;
    score2: HTMLElement | null;
    timer: HTMLElement | null;
  } = {
    h1: null,
    h1Label: null,
    s1: null,
    s1Label: null,
    h2: null,
    h2Label: null,
    s2: null,
    s2Label: null,
    scoreboard: null,
    score1: null,
    score2: null,
    timer: null,
  };

  private promptInteracao!: Phaser.GameObjects.Text;
  private estaBrilhandoJ1: boolean = false;
  private estaBrilhandoJ2: boolean = false;
  private emissorBrilhoJ1?: Phaser.GameObjects.Particles.ParticleEmitter;
  private emissorBrilhoJ2?: Phaser.GameObjects.Particles.ParticleEmitter;

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
  private eventoSpawnBolas?: Phaser.Time.TimerEvent;

  // Flag exclusiva para travar super chute e evitar múltiplos disparos
  private superChuteEmAndamento: boolean = false;

  private estatisticas = {
    roundsVencidos: 0,
    roundsPerdidos: 0,
    socosConectados: 0,
    superChutesDisparados: 0,
    tempoComPoder: 0,
    pontosGladiador: 0,
    pontosTatico: 0,
  };

  private emitirRastroJ1: boolean = false;

  // Bolas de poder
  private bolasDePoder: {
    sprite: Phaser.GameObjects.Sprite;
    velocidadeY: number;
    emissor: Phaser.GameObjects.Particles.ParticleEmitter;
  }[] = [];

  private projeteis: {
    sprite: Phaser.GameObjects.Sprite;
    velocidadeX: number;
    emissor: Phaser.GameObjects.Particles.ParticleEmitter;
    atacante: DadosJogador; // quem disparou
  }[] = [];

  constructor() {
    super({ key: "CenaJogo" });
  }

  create(): void {
    const estado = obterEstado();
    this.cicloHorario = estado.cicloHorario;

    // ── Desenhar a Arena ─────────────────────
    this._desenharArena();

    // ── Criar Jogadores ──────────────────────
    this.jogador1 = this._criarJogador(
      300,
      CHAO_Y,
      estado.uniformeJogador1.id,
      true,
    );
    this.jogador2 = this._criarJogador(
      LARGURA_JOGO - 300,
      CHAO_Y,
      estado.uniformeJogador2.id,
      false,
    );
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

    // ── O NOVO CLIQUE DO MOUSE ENTRA AQUI ───────────────────
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.fimDeJogo) return;
      if (pointer.leftButtonDown()) {
        const j = this.jogador1;
        if (j && !j.estaChutando) {
          const animKey = j.sprite.anims.currentAnim?.key;

          if (this.estaBrilhandoJ1) {
            // ── SUPER CHUTE (bola de poder) ──
            // Flag exclusiva para impedir múltiplos disparos com cliques rápidos
            if (!this.superChuteEmAndamento) {
              this.superChuteEmAndamento = true;
              j.estaChutando = true;
              j.sprite.play("player_kick");

              // ATIVAÇÃO IMEDIATA: O impacto visual começa junto com a animação
              this.emitirRastroJ1 = true;
              this._ativarSlowMotion(600);

              // CONTABILIZA ESTATÍSTICA DO SUPER CHUTE
              this.estatisticas.superChutesDisparados++;
              this.estatisticas.pontosTatico += 15;

              // Disparar o projétil IMEDIATAMENTE (sem delayedCall que seria
              // afetado pelo slow motion, causando delay de ~1s)
              this._dispararProjetil(j);

              // Quando o chute terminar, desliga os estados
              j.sprite.once("animationcomplete", () => {
                j.estaChutando = false;
                this.emitirRastroJ1 = false;
                this.superChuteEmAndamento = false;
              });
            }
          } else {
            // Senão, é o SOCO normal
            if (!j.sprite.anims.isPlaying || animKey !== "player_punch") {
              j.sprite.play("player_punch");
              this._verificarAtaque(j, this.jogador2, 10);
            }
          }
        }
      }
    });
    // ────────────────────────────────────────────────────────

    // Prompt de interação (E com seta apontando para bola)
    this.promptInteracao = this.add
      .text(0, 0, "[ E ]\n↓", {
        fontFamily: "Orbitron, monospace",
        fontSize: "20px",
        fontStyle: "bold",
        color: "#00ffff",
        stroke: "#000000",
        strokeThickness: 5,
        align: "center",
      })
      .setOrigin(0.5, 1)
      .setDepth(20)
      .setVisible(false);

    teclado.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on("down", () => {
      this.cameras.main.fade(
        400,
        0,
        0,
        0,
        false,
        (_c: Phaser.Cameras.Scene2D.Camera, p: number) => {
          if (p >= 1) this.scene.start("CenaMenu");
        },
      );
    });

    // ── Timer para Bolas de Poder ────────────────
    this.eventoSpawnBolas = this.time.addEvent({
      delay: 5000, // a cada 5 segundos
      loop: true,
      callback: this._spawnBolaDePoder,
      callbackScope: this,
    });

    // ── Fade in ──────────────────────────────
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private _spawnBolaDePoder(): void {
    const alvo =
      Math.random() > 0.5 ? this.jogador1.sprite : this.jogador2.sprite;
    const x = alvo.x;

    const sprite = this.add
      .sprite(x, -50, "bola_poder")
      .setOrigin(0.5, 1)
      .setDepth(8)
      .setScale(0.35);
    sprite.play("bola_poder_anim");

    // Partículas de raio ao redor da bola
    const emissor = this.add.particles(0, 0, "particula", {
      speed: { min: 50, max: 150 },
      scale: { start: 0.4, end: 0 },
      tint: [0x00ffff, 0xffffff, 0x00aaff],
      lifespan: 200,
      blendMode: "ADD",
      frequency: 50,
      follow: sprite,
      followOffset: { x: 0, y: -20 },
    });

    const bolaData = { sprite, velocidadeY: 0, emissor };
    this.bolasDePoder.push(bolaData);
  }

  private _coletarBola(bola: any, jogador: DadosJogador): void {
    // Remover bola
    bola.emissor.destroy();
    bola.sprite.destroy();
    this.bolasDePoder = this.bolasDePoder.filter((b) => b !== bola);
    this.promptInteracao.setVisible(false);

    // Efeito de brilho no jogador que coletou
    this._ativarBrilhoJogador(jogador);
  }

  private _ativarBrilhoJogador(jogador: DadosJogador): void {
    const ehJ1 = jogador === this.jogador1;
    if (ehJ1 && this.estaBrilhandoJ1) return;
    if (!ehJ1 && this.estaBrilhandoJ2) return;

    if (ehJ1) {
      this.estaBrilhandoJ1 = true;
      this.emissorBrilhoJ1 = this.add.particles(0, 0, "particula", {
        speed: { min: 20, max: 100 },
        scale: { start: 0.5, end: 0 },
        tint: [0x00ffff, 0xffffff],
        lifespan: 600,
        blendMode: "ADD",
        frequency: 20,
        follow: this.jogador1.sprite,
        followOffset: { x: 0, y: -40 },
      });
    } else {
      this.estaBrilhandoJ2 = true;
      this.emissorBrilhoJ2 = this.add.particles(0, 0, "particula", {
        speed: { min: 20, max: 100 },
        scale: { start: 0.5, end: 0 },
        tint: [0xff4444, 0xffffff],
        lifespan: 600,
        blendMode: "ADD",
        frequency: 20,
        follow: this.jogador2.sprite,
        followOffset: { x: 0, y: -40 },
      });
    }
  }

  private _removerBrilhoJogador(jogador?: DadosJogador): void {
    if (!jogador || jogador === this.jogador1) {
      if (this.emissorBrilhoJ1) {
        this.emissorBrilhoJ1.destroy();
        this.emissorBrilhoJ1 = undefined;
      }
      this.estaBrilhandoJ1 = false;
    }
    if (!jogador || jogador === this.jogador2) {
      if (this.emissorBrilhoJ2) {
        this.emissorBrilhoJ2.destroy();
        this.emissorBrilhoJ2 = undefined;
      }
      this.estaBrilhandoJ2 = false;
    }
  }

  private _dispararProjetil(atacante: DadosJogador): void {
    const direcao = atacante.olhandoDireita ? 1 : -1;
    const x = atacante.sprite.x + 50 * direcao;
    const y = atacante.sprite.y - 60;

    const sprite = this.add.sprite(x, y, "bola_chutada").setDepth(9);
    sprite.setScale(0.12);
    if (direcao === -1) sprite.setFlipX(true);

    const emissor = this.add.particles(0, 0, "particula", {
      speed: { min: 20, max: 50 },
      scale: { start: 0.5, end: 0 },
      tint: [0x00ffff, 0xffffff],
      lifespan: 300,
      blendMode: "ADD",
      frequency: 30,
      follow: sprite,
    });

    this.projeteis.push({ sprite, velocidadeX: 1200 * direcao, emissor, atacante });

    // Consumir o poder do atacante
    this._removerBrilhoJogador(atacante);
  }

  update(_tempo: number, delta: number): void {
    const dt = delta / 1000;

    if (this.emitirRastroJ1 && Math.random() < 0.4) {
      this._criarEfeitoRastro(this.jogador1);
    }

    // CONTADOR DE PODER: Se o J1 estiver brilhando, soma o tempo frame a frame
    if (this.estaBrilhandoJ1) {
      this.estatisticas.tempoComPoder += dt;
    }

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
    let zoomAlvo = 1.2 - dist / 1200;
    zoomAlvo = Phaser.Math.Clamp(zoomAlvo, 0.85, 1.2);

    // 3. Aplicar suavização (Lerp)
    const suavizacao = 0.05; // Ajuste para mais ou menos fluidez

    // Seguir o ponto médio
    this.cameras.main.scrollX = Phaser.Math.Linear(
      this.cameras.main.scrollX,
      midX - LARGURA_JOGO / 2 / this.cameras.main.zoom,
      suavizacao,
    );
    this.cameras.main.scrollY = Phaser.Math.Linear(
      this.cameras.main.scrollY,
      midY - ALTURA_JOGO / 2 / this.cameras.main.zoom,
      suavizacao,
    );

    // Aplicar zoom suave
    this.cameras.main.zoom = Phaser.Math.Linear(
      this.cameras.main.zoom,
      zoomAlvo,
      suavizacao,
    );
  }

  private _verificarFimDeRound(): void {
    if (this.fimDeJogo) return;

    if (this.jogador1.vida <= 0 || this.jogador2.vida <= 0) {
      const vencedor = this.jogador1.vida > 0 ? 1 : 2;

      // ─── ATUALIZA AS ESTATÍSTICAS DO ROUND AQUI ───
      if (vencedor === 1) {
        this.vitoriasJ1++;
        this.estatisticas.roundsVencidos++; // Jogador 1 ganhou o round
      } else {
        this.vitoriasJ2++;
        this.estatisticas.roundsPerdidos++; // Jogador 1 perdeu o round
      }
      // ──────────────────────────────────────────────

      if (this.domHud.score1)
        this.domHud.score1.innerText = `${this.vitoriasJ1}`;
      if (this.domHud.score2)
        this.domHud.score2.innerText = `${this.vitoriasJ2}`;

      if (this.vitoriasJ1 >= 2 || this.vitoriasJ2 >= 2) {
        this._finalizarJogo(
          vencedor === 1 ? "VOCÊ VENCEU A PARTIDA!" : "CPU VENCEU A PARTIDA!",
        );
      } else {
        this._proximoRound();
      }
    }
  }

  private _proximoRound(): void {
    this.fimDeJogo = true; // Pausa temporária
    this.numeroRound++;

    const overlay = this.add
      .text(LARGURA_JOGO / 2, ALTURA_JOGO / 2, `ROUND ${this.numeroRound}`, {
        fontFamily: "Orbitron, monospace",
        fontSize: "64px",
        fontStyle: "bold",
        color: "#00ffff",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(100)
      .setAlpha(0);

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
      },
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
    this.projeteis.forEach((p) => {
      p.sprite.destroy();
      p.emissor.destroy();
    });
    this.projeteis = [];
    this._removerBrilhoJogador();
  }

  private _finalizarJogo(mensagem: string): void {
    this.fimDeJogo = true;

    // Parar spawn de bolas de poder
    if (this.eventoSpawnBolas) {
      this.eventoSpawnBolas.destroy();
      this.eventoSpawnBolas = undefined;
    }

    // Parar movimentos
    this.jogador1.velocidadeX = 0;
    this.jogador2.velocidadeX = 0;

    // Esconder HUD de HP/Stamina
    const containers = document.querySelectorAll(".hud-container");
    containers.forEach((c) => ((c as HTMLElement).style.display = "none"));

    // Fundo semi-transparente para melhor legibilidade dos textos
    const bgFiltro = this.add
      .rectangle(LARGURA_JOGO / 2, ALTURA_JOGO / 2, LARGURA_JOGO, ALTURA_JOGO, 0x000000, 0.55)
      .setDepth(90)
      .setScrollFactor(0)
      .setAlpha(0);

    this.tweens.add({
      targets: bgFiltro,
      alpha: 1,
      duration: 500,
    });

    // Mostrar Placar Final CSS
    if (this.domHud.scoreboard) {
      this.domHud.scoreboard.style.transition =
        "all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
      this.domHud.scoreboard.style.top = "30%"; // Subimos um pouco de 50% para dar espaço para as estatísticas
      this.domHud.scoreboard.style.transform =
        "translateX(-50%) translateY(-100%) scale(2)";
    }

    // ── CALCULAR ALGORITMO DE RANKING DE ESTILO ──
    const totalPontos =
      this.estatisticas.pontosGladiador + this.estatisticas.pontosTatico;
    let estiloFinal = "EQUILIBRADO";
    let corRanking = "#ffffff";

    if (totalPontos > 0) {
      const percentualGladiador =
        this.estatisticas.pontosGladiador / totalPontos;
      if (percentualGladiador > 0.65) {
        estiloFinal = "GLADIADOR";
        corRanking = "#ff3333"; // Vermelho agressivo
      } else if (percentualGladiador < 0.35) {
        estiloFinal = "TÁTICO";
        corRanking = "#00ffff"; // Ciano calculista
      }
    }

    // Título do resultado (Mensagem)
    const texto = this.add
      .text(LARGURA_JOGO / 2, ALTURA_JOGO / 2 - 20, mensagem, {
        fontFamily: "Orbitron, monospace",
        fontSize: "32px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setAlpha(0)
      .setScrollFactor(0);

    // ── BLOCO DE EXIBIÇÃO DAS ESTATÍSTICAS NA TELA ──
    const textoEstatisticas = `
      ESTILO DE COMBATE: ${estiloFinal}
      SOCOS CONECTADOS: ${this.estatisticas.socosConectados}
      SUPER CHUTES: ${this.estatisticas.superChutesDisparados}
      TEMPO COM PODER: ${Math.round(this.estatisticas.tempoComPoder)}s
    `.trim();

    const painelStats = this.add
      .text(LARGURA_JOGO / 2, ALTURA_JOGO / 2 + 80, textoEstatisticas, {
        fontFamily: "Orbitron, monospace",
        fontSize: "18px",
        color: "#aaaaaa",
        align: "center",
        lineSpacing: 8,
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setAlpha(0)
      .setScrollFactor(0);

    // Subtexto de comando modificado de ESC para ESPAÇO, já que adicionamos o reset
    const subtexto = this.add
      .text(
        LARGURA_JOGO / 2,
        ALTURA_JOGO / 2 + 190,
        "Pressione ESPAÇO para reiniciar ou ESC para sair",
        {
          fontFamily: "Outfit, sans-serif",
          fontSize: "16px",
          color: "#00ffff",
        },
      )
      .setOrigin(0.5)
      .setDepth(101)
      .setAlpha(0)
      .setScrollFactor(0);

    // Animação de fade in em todos os elementos de texto juntos
    this.tweens.add({
      targets: [texto, painelStats, subtexto],
      alpha: 1,
      delay: 500,
      duration: 500,
    });

    // Listener para o ESPAÇO (Reiniciar partida limpando o estado)
    this.input
      .keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
      .once("down", () => {
        // Se tiver elementos HTML do placar travados na tela, a gente reseta o CSS deles antes de sair
        if (this.domHud.scoreboard) {
          this.domHud.scoreboard.style.top = "";
          this.domHud.scoreboard.style.transform = "";
        }
        this.scene.start("CenaMenu");
      });
  }

  private _atualizarProjeteis(dt: number): void {
    for (let i = this.projeteis.length - 1; i >= 0; i--) {
      const p = this.projeteis[i];
      p.sprite.x += p.velocidadeX * dt;

      // Determinar o alvo baseado em quem atirou
      const alvo = p.atacante === this.jogador1 ? this.jogador2 : this.jogador1;

      const dist = Phaser.Math.Distance.Between(
        p.sprite.x,
        p.sprite.y,
        alvo.sprite.x,
        alvo.sprite.y - 80,
      );
      if (dist < 80) {
        // Causar dano massivo
        alvo.vida -= 40;
        alvo.vida = Math.max(0, alvo.vida);
        alvo.sprite.setTint(0xff0000);
        this.time.delayedCall(150, () => {
          alvo.sprite.clearTint();
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
    }

    // Prompt sempre visível na primeira bola que existir
    if (this.bolasDePoder.length > 0) {
      const primeiraBola = this.bolasDePoder[0];
      this.promptInteracao.setPosition(primeiraBola.sprite.x, primeiraBola.sprite.y - 160);
      this.promptInteracao.setVisible(true);
    } else {
      this.promptInteracao.setVisible(false);
    }
  }

  private _criarEfeitoRastro(jogador: DadosJogador): void {
    // Cria um sprite estático idêntico ao frame atual do jogador
    const rastro = this.add.sprite(
      jogador.sprite.x,
      jogador.sprite.y,
      jogador.sprite.texture.key,
    );
    rastro.setFrame(jogador.sprite.anims.currentFrame!.frame.name);
    rastro.setFlipX(jogador.sprite.flipX);
    rastro.setOrigin(jogador.sprite.originX, jogador.sprite.originY);
    rastro.setScale(jogador.sprite.scaleX, jogador.sprite.scaleY);
    rastro.setTint(0x00ffff); // Tom neon/cyberpunk pro rastro
    rastro.setAlpha(0.6);
    rastro.setDepth(jogador.sprite.depth - 1);

    // Desvanece e destrói o rastro
    this.tweens.add({
      targets: rastro,
      alpha: 0,
      duration: 300,
      onComplete: () => rastro.destroy(),
    });
  }

  private _ativarSlowMotion(duracao: number = 2000): void {
    this.time.timeScale = 0.1; // Deixa o motor lógico em 30% da velocidade
    this.physics.world.timeScale = 10;

    this.time.delayedCall(duracao, () => {
      this.time.timeScale = 1;
      this.physics.world.timeScale = 1;
    });
  }

  // ═══════════════════════════════════════════
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

  //  CRIAÇÃO DO JOGADOR
  // ═══════════════════════════════════════════
  private _criarJogador(
    x: number,
    y: number,
    idUniforme: string,
    olhandoDireita: boolean,
  ): DadosJogador {
    const sprite = this.add
      .sprite(x, y, "p_parado")
      .setOrigin(0.5, 1)
      .setDepth(10)
      .setScale(0.13);

    const uniforme = UNIFORMES.find((u: OpcaoUniforme) => u.id === idUniforme);
    if (uniforme) {
      this._aplicarPipelineUniforme(sprite, uniforme);
    }

    sprite.play("player_idle");

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
      timerDecisaoIA: 0,
      decisaoIA: "nenhuma" as const,
    };
  }

  // ═══════════════════════════════════════════
  //  ENTRADA (Jogador 1)
  // ═══════════════════════════════════════════
  private _processarEntrada(jogador: DadosJogador, _dt: number): void {
    if (this.fimDeJogo) return;

    const moverEsquerda = this.teclas.esquerda.isDown || this.teclas.a.isDown;
    const moverDireita = this.teclas.direita.isDown || this.teclas.d.isDown;
    const querCorrer =
      this.teclas.correr.isDown && jogador.vigor > LIMIAR_EXAUSTO;
    const querPular =
      Phaser.Input.Keyboard.JustDown(this.teclas.cima) ||
      Phaser.Input.Keyboard.JustDown(this.teclas.w) ||
      Phaser.Input.Keyboard.JustDown(this.teclas.espaco);
    const querSocar = Phaser.Input.Keyboard.JustDown(this.teclas.soco);
    const querChutar = Phaser.Input.Keyboard.JustDown(this.teclas.chute);
    const querPegar = Phaser.Input.Keyboard.JustDown(this.teclas.pegar);

    const velocidade = jogador.estaExausto
      ? VELOCIDADE_ANDAR * 0.45
      : querCorrer
        ? VELOCIDADE_CORRER
        : VELOCIDADE_ANDAR;

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

    if (
      querSocar &&
      !jogador.estaChutando &&
      (!jogador.sprite.anims.isPlaying ||
        jogador.sprite.anims.currentAnim?.key !== "player_punch")
    ) {
      jogador.sprite.play("player_punch");
    }

    if (querChutar && !jogador.estaChutando) {
      jogador.estaChutando = true;
      jogador.sprite.play("player_kick");
      this._verificarAtaque(jogador, this.jogador2, 15); // Chute tira 15
      jogador.sprite.once("animationcomplete", () => {
        jogador.estaChutando = false;
      });
    }

    if (querPegar && jogador === this.jogador1) {
      // Tentar pegar a bola mais próxima
      for (const bola of this.bolasDePoder) {
        const dist = Phaser.Math.Distance.Between(
          jogador.sprite.x,
          jogador.sprite.y,
          bola.sprite.x,
          bola.sprite.y,
        );
        if (dist < 100) {
          this._coletarBola(bola, jogador);
          break;
        }
      }
    }
  }

  // ═══════════════════════════════════════════
  //  IA (Jogador 2 - CPU) com timer anti-tremor
  // ═══════════════════════════════════════════
  private _atualizarIA(jogador: DadosJogador, dt: number): void {
    if (this.fimDeJogo) {
      jogador.velocidadeX = 0;
      return;
    }

    const alvo = this.jogador1.sprite;
    const distancia = alvo.x - jogador.sprite.x;
    const distanciaAbs = Math.abs(distancia);
    const yDiff = alvo.y - jogador.sprite.y;
    const alcanceAtaque = 100;
    const vidaBaixa = jogador.vida < 30;

    // ── Verificar bola de poder no chão ──
    let bolaAlvo: typeof this.bolasDePoder[0] | null = null;
    let distBolaMenor = Infinity;
    for (const bola of this.bolasDePoder) {
      if (bola.sprite.y >= CHAO_Y) {
        const db = Phaser.Math.Distance.Between(
          jogador.sprite.x, jogador.sprite.y,
          bola.sprite.x, bola.sprite.y,
        );
        if (db < distBolaMenor) { distBolaMenor = db; bolaAlvo = bola; }
      }
    }

    // ── TIMER DE DECISÃO: só reavalia depois de 0.5s ──
    const duracaoDecisao = 0.5; // segundos
    jogador.timerDecisaoIA -= dt;

    if (jogador.timerDecisaoIA <= 0) {
      jogador.timerDecisaoIA = duracaoDecisao;

      // Escolher nova decisão
      const querPegarBola = bolaAlvo !== null && distBolaMenor < 400;

      if (querPegarBola) {
        jogador.decisaoIA = "bola";
      } else if (distanciaAbs > alcanceAtaque) {
        jogador.decisaoIA = vidaBaixa
          ? (Math.random() < 0.15 ? "atacar" : "fugir")
          : (Math.random() < 0.60 ? "atacar" : "fugir");
      } else {
        if (vidaBaixa) {
          jogador.decisaoIA = "recuar";
        } else {
          const r = Math.random();
          jogador.decisaoIA = r < 0.50 ? "recuar" : r < 0.70 ? "atacar" : "parado";
        }
      }
    }

    jogador.olhandoDireita = distancia > 0;
    jogador.sprite.setFlipX(!jogador.olhandoDireita);

    // ── SUPER CHUTE DA IA ──────────────────────────────
    // Se a IA estiver brilhando, dispara o super chute independente da distância
    if (this.estaBrilhandoJ2 && !jogador.estaChutando && !this.superChuteEmAndamento) {
      if (Math.random() < 0.08) {
        this.superChuteEmAndamento = true;
        jogador.estaChutando = true;
        jogador.sprite.play("player_kick");

        // A IA "clica" automaticamente - dispara o projétil na direção do jogador1
        jogador.olhandoDireita = distancia > 0;
        jogador.sprite.setFlipX(!jogador.olhandoDireita);
        this._dispararProjetil(jogador);

        jogador.sprite.once("animationcomplete", () => {
          jogador.estaChutando = false;
          this.superChuteEmAndamento = false;
        });
        return;
      }
    }
    // ───────────────────────────────────────────────────

    switch (jogador.decisaoIA) {
      case "bola": {
        if (!bolaAlvo) {
          jogador.velocidadeX = 0;
          jogador.estaCorrendo = false;
          break;
        }
        const difBola = bolaAlvo.sprite.x - jogador.sprite.x;
        jogador.olhandoDireita = difBola > 0;
        jogador.sprite.setFlipX(!jogador.olhandoDireita);
        jogador.velocidadeX = difBola > 0 ? VELOCIDADE_CORRER : -VELOCIDADE_CORRER;
        jogador.estaCorrendo = jogador.vigor > 20;
        if (distBolaMenor < 80) { this._coletarBola(bolaAlvo, jogador); }
        break;
      }
      case "atacar": {
        const vel = distanciaAbs > 300 ? VELOCIDADE_CORRER * 0.8 : VELOCIDADE_ANDAR;
        jogador.velocidadeX = distancia > 0 ? vel : -vel;
        jogador.estaCorrendo = distanciaAbs > 300 && jogador.vigor > 20;
        break;
      }
      case "fugir": {
        const vel = distanciaAbs > 300 ? VELOCIDADE_CORRER * 0.7 : VELOCIDADE_ANDAR * 0.8;
        jogador.velocidadeX = distancia > 0 ? -vel : vel;
        jogador.estaCorrendo = distanciaAbs > 300 && jogador.vigor > 20;
        break;
      }
      case "recuar": {
        jogador.velocidadeX = distancia > 0 ? -VELOCIDADE_ANDAR * 0.8 : VELOCIDADE_ANDAR * 0.8;
        jogador.estaCorrendo = false;
        break;
      }
      case "parado":
      default: {
        jogador.velocidadeX = 0;
        jogador.estaCorrendo = false;
        break;
      }
    }

    // ── PULOS ──
    if ((jogador.decisaoIA === "bola" || jogador.decisaoIA === "atacar" || jogador.decisaoIA === "fugir")
        && jogador.noChao && Math.random() < 0.015) {
      jogador.velocidadeY = FORCA_PULO;
      jogador.noChao = false;
    }
    if ((jogador.decisaoIA === "recuar" || jogador.decisaoIA === "parado")
        && jogador.noChao && Math.random() < 0.03) {
      jogador.velocidadeY = FORCA_PULO;
      jogador.noChao = false;
    }
    if (jogador.noChao && ((yDiff < -100 && Math.random() < 0.08) || Math.random() < 0.008)) {
      jogador.velocidadeY = FORCA_PULO;
      jogador.noChao = false;
    }

    // ── COMBATE ──
    if (
      !jogador.sprite.anims.isPlaying ||
      (jogador.sprite.anims.currentAnim?.key !== "player_punch" &&
        jogador.sprite.anims.currentAnim?.key !== "player_kick")
    ) {
      if (distanciaAbs < alcanceAtaque + 20) {
        if (Math.random() < 0.03 && jogador.vigor > 10) {
          jogador.sprite.play("player_punch");
          this.jogador1.vida -= 5;
          this.jogador1.vida = Math.max(0, this.jogador1.vida);
          this._criarParticulasImpacto(this.jogador1.sprite.x, this.jogador1.sprite.y - 80);
          this.jogador1.sprite.setTint(0xff0000);
          this.time.delayedCall(100, () => {
            this.jogador1.sprite.clearTint();
          });
          jogador.vigor -= 5;
        } else if (Math.random() < 0.015 && jogador.vigor > 20) {
          jogador.sprite.play("player_kick");
          this.jogador1.vida -= 10;
          this.jogador1.vida = Math.max(0, this.jogador1.vida);
          this._criarParticulasImpacto(this.jogador1.sprite.x, this.jogador1.sprite.y - 80);
          this.jogador1.sprite.setTint(0xff0000);
          this.time.delayedCall(100, () => {
            this.jogador1.sprite.clearTint();
          });
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
    if (jogador.sprite.x > LARGURA_JOGO - margem)
      jogador.sprite.x = LARGURA_JOGO - margem;
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
  private _verificarAtaque(
    atacante: DadosJogador,
    defensor: DadosJogador,
    dano: number,
  ): void {
    this.time.delayedCall(150, () => {
      const dist = Math.abs(atacante.sprite.x - defensor.sprite.x);
      const alturaOk = Math.abs(atacante.sprite.y - defensor.sprite.y) < 100;

      const direcaoOk = atacante.olhandoDireita
        ? defensor.sprite.x > atacante.sprite.x
        : defensor.sprite.x < atacante.sprite.x;

      if (dist < 130 && alturaOk && direcaoOk) {
        defensor.vida -= dano;
        defensor.vida = Math.max(0, defensor.vida);

        if (atacante === this.jogador1) {
          this.estatisticas.socosConectados++;
          this.estatisticas.pontosGladiador += 10;
        }

        defensor.sprite.setTint(0xff0000);
        this.time.delayedCall(100, () => {
          defensor.sprite.clearTint();
        });

        this._criarParticulasImpacto(defensor.sprite.x, defensor.sprite.y - 80);
      }
    });
  }

  private _criarParticulasImpacto(x: number, y: number): void {
    const particles = this.add.particles(x, y, "particula", {
      speed: { min: 100, max: 200 },
      scale: { start: 1, end: 0 },
      blendMode: "ADD",
      lifespan: 300,
      gravityY: 400,
      maxParticles: 8,
    });
    this.time.delayedCall(400, () => particles.destroy());
  }

  // ═══════════════════════════════════════════
  //  ANIMAÇÕES
  // ═══════════════════════════════════════════
  private _atualizarAnimacoes(jogador: DadosJogador, _dt: number): void {
    if (
      jogador.estaChutando ||
      (jogador.sprite.anims.isPlaying &&
        jogador.sprite.anims.currentAnim?.key === "player_punch")
    )
      return;

    if (jogador.estaExausto) {
      if (jogador.sprite.anims.currentAnim?.key !== "player_exhausted") {
        jogador.sprite.play("player_exhausted");
      }
      return;
    }

    if (!jogador.noChao) {
      if (jogador.velocidadeY < 0) {
        if (jogador.sprite.anims.currentAnim?.key !== "player_jump") {
          jogador.sprite.play("player_jump");
        }
      } else {
        if (jogador.sprite.anims.currentAnim?.key !== "player_fall") {
          jogador.sprite.play("player_fall");
        }
      }
      return;
    }

    if (Math.abs(jogador.velocidadeX) > 10) {
      const animKey = jogador.estaCorrendo ? "player_run" : "player_walk";
      if (jogador.sprite.anims.currentAnim?.key !== animKey) {
        jogador.sprite.play(animKey);
      }
    } else {
      if (jogador.sprite.anims.currentAnim?.key !== "player_idle") {
        jogador.sprite.play("player_idle");
      }
    }
  }

  // ═══════════════════════════════════════════
  //  DESENHAR A ARENA
  // ═══════════════════════════════════════════
  private _desenharArena(): void {
    const ciclo = this.cicloHorario;

    // Fundo do Céu (Atrás do estádio)
    const skyGfx = this.add.graphics().setDepth(-2);
    skyGfx.fillGradientStyle(ciclo.ceuTopo, ciclo.ceuTopo, ciclo.ceuBase, ciclo.ceuBase, 1);
    skyGfx.fillRect((LARGURA_JOGO - 1536) / 2, (ALTURA_JOGO - 1024) / 2, 1536, 1024);

    const fundoEstadio = this.add.image(
      LARGURA_JOGO / 2,
      ALTURA_JOGO / 2,
      "estadio",
    );
    fundoEstadio.setDisplaySize(1536, 1024); // Tamanho real do asset
    fundoEstadio.setDepth(0);

    // Configurar limites da câmera baseados no tamanho do estádio
    this.cameras.main.setBounds(
      (1280 - 1536) / 2,
      (720 - 1024) / 2,
      1536,
      1024,
    );

    // Astros Dinâmicos (Estrelas, Lua, Sol) atrás do estádio, mas na frente do céu
    if (ciclo.nome === "noite") {
      const estrelasGfx = this.add.graphics().setDepth(-1);
      for (let i = 0; i < 80; i++) {
        const ex = -128 + Math.random() * 1536;
        const ey = -152 + Math.random() * 500;
        const tamanho = Math.random() * 2 + 0.5;
        estrelasGfx.fillStyle(0xffffff, Math.random() * 0.7 + 0.3);
        estrelasGfx.fillCircle(ex, ey, tamanho);
      }
      estrelasGfx.fillStyle(0xeeeedd, 0.9);
      estrelasGfx.fillCircle(LARGURA_JOGO - 50, -20, 35);
      estrelasGfx.fillStyle(0x000000, 0.2);
      estrelasGfx.fillCircle(LARGURA_JOGO - 40, -28, 30);
    }

    if (ciclo.nome === "manha" || ciclo.nome === "golden") {
      const solGfx = this.add.graphics().setDepth(-1);
      const solX = ciclo.nome === "manha" ? 100 : LARGURA_JOGO - 100;
      const solY = ciclo.nome === "manha" ? -20 : 0;
      solGfx.fillStyle(0xffee58, 0.15);
      solGfx.fillCircle(solX, solY, 80);
      solGfx.fillStyle(0xffee58, 0.25);
      solGfx.fillCircle(solX, solY, 50);
      solGfx.fillStyle(0xffee58, 0.9);
      solGfx.fillCircle(solX, solY, 28);
    }

    this.add
      .rectangle(
        LARGURA_JOGO / 2,
        ALTURA_JOGO / 2,
        1536,
        1024,
        ciclo.corAmbiente,
        ciclo.alfaAmbiente,
      )
      .setDepth(15)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  // ═══════════════════════════════════════════
  //  HUD (CSS/DOM)
  // ═══════════════════════════════════════════
  private _criarHUD(): void {
    const profundidade = 25;

    this.events.once("shutdown", () => {
      const containers = document.querySelectorAll(".hud-container");
      containers.forEach((el) => ((el as HTMLElement).style.display = "none"));
      if (this.domHud.scoreboard) this.domHud.scoreboard.style.display = "none";
    });

    this.domHud.h1 = document.getElementById("health-p1");
    this.domHud.h1Label = document.getElementById("health-label-p1");
    this.domHud.s1 = document.getElementById("stamina-p1");
    this.domHud.s1Label = document.getElementById("stamina-label-p1");
    this.domHud.h2 = document.getElementById("health-p2");
    this.domHud.h2Label = document.getElementById("health-label-p2");
    this.domHud.s2 = document.getElementById("stamina-p2");
    this.domHud.s2Label = document.getElementById("stamina-label-p2");
    this.domHud.scoreboard = document.getElementById("match-scoreboard");
    this.domHud.score1 = document.getElementById("score-p1");
    this.domHud.score2 = document.getElementById("score-p2");
    this.domHud.timer = document.getElementById("game-timer");

    const containers = document.querySelectorAll(".hud-container");
    containers.forEach((c) => ((c as HTMLElement).style.display = "flex"));
    if (this.domHud.scoreboard) {
      this.domHud.scoreboard.style.display = "flex";
      this.domHud.scoreboard.style.transition = "none";
      this.domHud.scoreboard.style.top = "20px";
      this.domHud.scoreboard.style.transform = "translateX(-50%) scale(1)";
    }

    this.iconeExaustoJ1 = this.add
      .text(0, 0, "😤", {
        fontSize: "20px",
      })
      .setOrigin(0.5)
      .setDepth(profundidade)
      .setVisible(false);

    this.iconeExaustoJ2 = this.add
      .text(0, 0, "😤", {
        fontSize: "20px",
      })
      .setOrigin(0.5)
      .setDepth(profundidade)
      .setVisible(false);

    this._iniciarCronometro();
  }

  private _iniciarCronometro(): void {
    if (this.eventoCronometro) this.eventoCronometro.destroy();

    this.tempoRestante = 120;
    this.eventoCronometro = this.time.addEvent({
      delay: 1000,
      callback: this._atualizarCronometro,
      callbackScope: this,
      loop: true,
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
      this.domHud.timer.innerText = `${min.toString().padStart(2, "0")}:${seg.toString().padStart(2, "0")}`;
    }
  }

  private _verificarVencedorPorTempo(): void {
    if (this.vitoriasJ1 > this.vitoriasJ2) {
      this._finalizarJogo("VOCÊ VENCEU POR PONTOS!");
    } else if (this.vitoriasJ2 > this.vitoriasJ1) {
      this._finalizarJogo("CPU VENCEU POR PONTOS!");
    } else {
      if (this.jogador1.vida > this.jogador2.vida) {
        this._finalizarJogo("EMPATE! VITÓRIA POR VIDA (J1)");
      } else {
        this._finalizarJogo("EMPATE! VITÓRIA POR VIDA (CPU)");
      }
    }
  }

  private _atualizarHUD(): void {
    const updateBar = (
      bar: HTMLElement | null,
      label: HTMLElement | null,
      current: number,
      max: number,
    ) => {
      if (bar && label) {
        const percent = Math.floor((current / max) * 100);
        bar.style.width = `${percent}%`;
        label.innerText = `${percent}%`;
      }
    };

    updateBar(
      this.domHud.h1,
      this.domHud.h1Label,
      this.jogador1.vida,
      VIDA_MAXIMA,
    );
    updateBar(
      this.domHud.s1,
      this.domHud.s1Label,
      this.jogador1.vigor,
      VIGOR_MAXIMO,
    );

    updateBar(
      this.domHud.h2,
      this.domHud.h2Label,
      this.jogador2.vida,
      VIDA_MAXIMA,
    );
    updateBar(
      this.domHud.s2,
      this.domHud.s2Label,
      this.jogador2.vigor,
      VIGOR_MAXIMO,
    );

    this.iconeExaustoJ1.setVisible(this.jogador1.estaExausto);
    this.iconeExaustoJ1.setPosition(
      this.jogador1.sprite.x,
      this.jogador1.sprite.y - 200,
    );
    this.iconeExaustoJ2.setVisible(this.jogador2.estaExausto);
    this.iconeExaustoJ2.setPosition(
      this.jogador2.sprite.x,
      this.jogador2.sprite.y - 200,
    );
  }
}