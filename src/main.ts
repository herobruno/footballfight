import Phaser from "phaser";
import { CenaInicializacao } from "./scenes/BootScene.ts";
import { CenaMenu } from "./scenes/MenuScene.ts";
import { CenaSelecaoUniforme } from "./scenes/UniformSelectScene.ts";
import { CenaJogo } from "./scenes/GameScene.ts";
import { CenaGameOver } from "./scenes/GameOverScene.ts";

const configuracao: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: "game-container",
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 980 },
      debug: false,
    },
  },
  scene: [
    CenaInicializacao,
    CenaMenu,
    CenaSelecaoUniforme,
    CenaJogo,
    CenaGameOver,
  ],
  render: {
    pixelArt: true,
    antialias: false,
  },
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(configuracao);
