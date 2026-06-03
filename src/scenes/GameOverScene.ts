import Phaser from "phaser";
import { LARGURA_JOGO, ALTURA_JOGO } from "../constantes";

export class CenaGameOver extends Phaser.Scene {
  constructor() {
    super({ key: "CenaGameOver" });
  }

  create(data: any): void {
    // 1. Fundo semi-transparente (Revela o mapa e os jogadores estáticos atrás)
    this.add.rectangle(
      LARGURA_JOGO / 2,
      ALTURA_JOGO / 2,
      LARGURA_JOGO,
      ALTURA_JOGO,
      0x000000,
      0.78
    );

    // 2. Título Dinâmico com a cor do uniforme do vencedor (repassada no payload)
    const corTitulo = data.corVencedor || "#ffffff";
    
    this.add.text(LARGURA_JOGO / 2, ALTURA_JOGO / 2 - 120, data.mensagem || data.status, {
      fontFamily: "Orbitron, monospace",
      fontSize: "42px",
      fontStyle: "bold",
      color: corTitulo,
      stroke: "#000000",
      strokeThickness: 6,
    }).setOrigin(0.5);

    // 3. Placar Final Grande (Rounds/Gols)
    this.add.text(LARGURA_JOGO / 2, ALTURA_JOGO / 2 - 50, `${data.gols} X ${data.contra}`, {
      fontFamily: "Orbitron, monospace",
      fontSize: "36px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    // 4. Painel de Estatísticas Centralizado
    const textoEstatisticas = `
      SOCOS CONECTADOS: ${data.socos}
      SUPER CHUTES: ${data.superChutes}
      TEMPO COM PODER: ${data.tempoPoder}s
    `.trim();

    this.add.text(LARGURA_JOGO / 2, ALTURA_JOGO / 2 + 30, textoEstatisticas, {
      fontFamily: "Orbitron, monospace",
      fontSize: "18px",
      color: "#aaaaaa",
      align: "center",
      lineSpacing: 8,
    }).setOrigin(0.5);

    // 5. Seção de Destaque do Ranking de Estilo com as Cores Originais do seu Padrão
    let corRanking = "#ffffff";
    if (data.ranking === "GLADIADOR") corRanking = "#ff3333"; // Vermelho agressivo
    if (data.ranking === "TÁTICO") corRanking = "#00ffff";    // Ciano calculista
    if (data.ranking.includes("ARTILHEIRO")) corRanking = "#27ae60"; // Verde futebol

    this.add.text(LARGURA_JOGO / 2, ALTURA_JOGO / 2 + 110, `ESTILO DE COMBATE: ${data.ranking}`, {
      fontFamily: "Orbitron, monospace",
      fontSize: "20px",
      fontStyle: "bold",
      color: corRanking,
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    // 6. Subtexto de Comando para Reiniciar
    const txtReiniciar = this.add.text(
      LARGURA_JOGO / 2,
      ALTURA_JOGO / 2 + 190,
      "Pressione ESPAÇO para reiniciar",
      {
        fontFamily: "Outfit, sans-serif",
        fontSize: "16px",
        color: "#00ffff",
      }
    ).setOrigin(0.5);

    // Efeito pulsar no texto de reiniciar
    this.tweens.add({
      targets: txtReiniciar,
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      loop: -1
    });

    // Evento de Teclado para reiniciar e limpar as cenas consecutivas
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).once("down", () => {
      this.scene.stop("CenaJogo");
      this.scene.start("CenaMenu");
    });
  }
}