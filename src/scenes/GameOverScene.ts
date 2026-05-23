import Phaser from "phaser";
import { LARGURA_JOGO, ALTURA_JOGO } from "../constantes";

export class CenaGameOver extends Phaser.Scene {
  constructor() {
    super({ key: "CenaGameOver" });
  }

  // O Phaser injeta os dados passados no "scene.start" direto aqui no create(data)
  create(data: any): void {
    // 1. Fundo Escuro Semi-Transparente para dar destaque ao menu
    this.add.rectangle(
      LARGURA_JOGO / 2,
      ALTURA_JOGO / 2,
      LARGURA_JOGO,
      ALTURA_JOGO,
      0x0a0a0c,
      0.9,
    );

    // 2. Título Dinâmico (VITÓRIA ou DERROTA)
    const ehVitoria = data.status === "VITÓRIA";
    const corTitulo = ehVitoria ? "#00ff88" : "#ff3355"; // Verde para vitória, vermelho para derrota

    this.add
      .text(LARGURA_JOGO / 2, 100, data.status, {
        fontFamily: "Orbitron, monospace",
        fontSize: "54px",
        color: corTitulo,
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // 3. Placar Final Grande
    this.add
      .text(LARGURA_JOGO / 2, 180, `${data.gols} X ${data.contra}`, {
        fontFamily: "Orbitron, monospace",
        fontSize: "42px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // ─── PAINEL DE ESTATÍSTICAS ───
    const xEsquerda = LARGURA_JOGO / 2 - 180;
    const xDireita = LARGURA_JOGO / 2 + 180;
    const yInicial = 280;
    const espacamento = 45;

    const estiloTextoChave = {
      fontFamily: "Orbitron, monospace",
      fontSize: "20px",
      color: "#aaaaaa",
    };
    const estiloTextoValor = {
      fontFamily: "Orbitron, monospace",
      fontSize: "20px",
      color: "#ffffff",
      align: "right",
    };

    // Linha 1: Super Chutes
    this.add.text(
      xEsquerda,
      yInicial,
      "SUPER CHUTES DISPARADOS:",
      estiloTextoChave,
    );
    this.add
      .text(xDireita, yInicial, data.superChutes.toString(), estiloTextoValor)
      .setOrigin(1, 0);

    // Linha 2: Socos Conectados
    this.add.text(
      xEsquerda,
      yInicial + espacamento,
      "SOCOS CONECTADOS:",
      estiloTextoChave,
    );
    this.add
      .text(
        xDireita,
        yInicial + espacamento,
        data.socos.toString(),
        estiloTextoValor,
      )
      .setOrigin(1, 0);

    // Linha 3: Tempo de Posse
    this.add.text(
      xEsquerda,
      yInicial + espacamento * 2,
      "TEMPO DE POSSE DE BOLA:",
      estiloTextoChave,
    );
    this.add
      .text(
        xDireita,
        yInicial + espacamento * 2,
        `${data.posse}s`,
        estiloTextoValor,
      )
      .setOrigin(1, 0);

    // ─── SEÇÃO DE RANKING DE ESTILO ───
    let corRanking = "#ffffff";
    if (data.ranking.includes("GLADIADOR")) corRanking = "#ff9900"; // Laranja agressivo
    if (data.ranking.includes("TÁTICO")) corRanking = "#00ffff"; // Ciano técnico

    this.add
      .text(LARGURA_JOGO / 2, 450, "ESTILO DE COMBATE", {
        fontFamily: "Orbitron, monospace",
        fontSize: "16px",
        color: "#888888",
      })
      .setOrigin(0.5);

    this.add
      .text(LARGURA_JOGO / 2, 490, data.ranking, {
        fontFamily: "Orbitron, monospace",
        fontSize: "32px",
        color: corRanking,
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // ─── BOTÃO PARA VOLTAR ───
    const txtReiniciar = this.add
      .text(
        LARGURA_JOGO / 2,
        ALTURA_JOGO - 100,
        "PRESSIONE ESPAÇO PARA RECOMEÇAR",
        {
          fontFamily: "Orbitron, monospace",
          fontSize: "18px",
          color: "#ffffff",
        },
      )
      .setOrigin(0.5);

    // Efeito visual piscante no botão de reiniciar
    this.tweens.add({
      targets: txtReiniciar,
      alpha: 0.4,
      duration: 1000,
      yoyo: true,
      loop: -1,
    });

    // Escuta a tecla ESPAÇO para resetar o loop do jogo
    this.input
      .keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
      .once("down", () => {
        this.scene.start("CenaInicializacao");
      });
  }
}
