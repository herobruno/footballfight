// ─────────────────────────────────────
// FutebolFight — Cena do Menu Principal
// Estilo PS1: Verde, Branco, Marrom, Preto
// ─────────────────────────────────────

import Phaser from 'phaser';
import { LARGURA_JOGO, ALTURA_JOGO } from '../constantes';

export class CenaMenu extends Phaser.Scene {
  private particulas: { x: number; y: number; vx: number; vy: number; alfa: number; tamanho: number }[] = [];
  private particulasGfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'CenaMenu' });
  }

  create(): void {
    // ── Fundo com a imagem inicial.png ────────────────────
    this.add.image(LARGURA_JOGO / 2, ALTURA_JOGO / 2, 'inicial')
      .setDisplaySize(LARGURA_JOGO, ALTURA_JOGO);

    // ─── TOCAR OU ASSEGURAR MÚSICA GLOBAL ───
    if (!(window as any).musicaGlobal) {
      // Link do beat instrumental
      (window as any).musicaGlobal = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
      (window as any).musicaGlobal.loop = true;
      (window as any).musicaGlobal.volume = 0.4;
      
      // Tenta dar play (pode ser bloqueado pelo navegador até o primeiro clique)
      (window as any).musicaGlobal.play().catch((err: any) => console.log("Aguardando interação para áudio:", err));
    }

    // ─── ÍCONE DE ÁUDIO INTERATIVO NO CANTO SUPERIOR ESQUERDO ───
    this._criarBotaoVolumeSuperiorEsquerdo();

    // ── Botão Iniciar (Estilo PS1 - Bloco) ────────────────────────
    this._criarBotao(LARGURA_JOGO / 2, 460, 'INICIAR JOGO', 0x27ae60, () => {
      this.scene.start('CenaSelecaoUniforme');
    });

    // ── Gráficos de partículas em segundo plano ───────────
    this.particulasGfx = this.add.graphics();
    this._inicializarPartulas();
  }

  /**
   * Cria e gerencia o ícone vetorial puro no canto superior esquerdo para baixar o volume
   */
  private _criarBotaoVolumeSuperiorEsquerdo(): void {
    const margemX = 35;
    const margemY = 35;
    const tamanho = 32;

    const containerIcone = this.add.container(margemX, margemY);
    const gfx = this.add.graphics();
    
    // Texto indicador com a porcentagem real do volume global
    const obterTextoVolume = () => {
      const audio = (window as any).musicaGlobal;
      if (!audio || audio.paused || audio.volume === 0) return 'MUTADO';
      return `VOL: ${Math.round(audio.volume * 100)}%`;
    };

    const txtVolume = this.add.text(tamanho / 2 + 8, 0, obterTextoVolume(), {
      fontFamily: "monospace",
      fontSize: '12px',
      color: '#aaaaaa',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // Renderiza o ícone com estética retro baseada no volume atual (Sem bordas ou fundos coloridos)
    const desenharIcone = (isHover: boolean) => {
      gfx.clear();
      const audio = (window as any).musicaGlobal;
      const estaMutado = !audio || audio.paused || audio.volume === 0;

      // Altera a opacidade do ícone levemente no Hover para dar feedback visual limpo
      const opacidadeDesenho = isHover ? 1.0 : 0.75;

      // Desenho minimalista em pixel do alto-falante
      gfx.fillStyle(0xffffff, opacidadeDesenho);
      gfx.fillRect(-6, -4, 4, 8); // Base
      
      // Cone frontal
      gfx.beginPath();
      gfx.moveTo(-2, -4);
      gfx.lineTo(3, -9);
      gfx.lineTo(3, 9);
      gfx.lineTo(-2, 4);
      gfx.closePath();
      gfx.fill();

      // Ondas de som baseadas na intensidade do volume
      if (!estaMutado) {
        gfx.lineStyle(2, 0xffffff, opacidadeDesenho);
        gfx.beginPath();
        gfx.arc(2, 0, 6, -Math.PI / 3, Math.PI / 3, false);
        gfx.stroke();
        
        if (audio && audio.volume > 0.2) {
          gfx.beginPath();
          gfx.arc(2, 0, 10, -Math.PI / 3, Math.PI / 3, false);
          gfx.stroke();
        }
      } else {
        // "X" indicador de mudo discreto em vermelho fosco
        gfx.lineStyle(2, 0xcc3333, opacidadeDesenho);
        gfx.lineBetween(6, -4, 12, 4);
        gfx.lineBetween(12, -4, 6, 4);
      }
    };

    desenharIcone(false);
    containerIcone.add([gfx, txtVolume]);
    containerIcone.setSize(tamanho + 80, tamanho);
    containerIcone.setInteractive({ useHandCursor: true });

    containerIcone.on('pointerover', () => {
      desenharIcone(true);
      txtVolume.setColor('#ffffff');
    });
    
    containerIcone.on('pointerout', () => {
      desenharIcone(false);
      txtVolume.setColor('#aaaaaa');
    });
    
    containerIcone.on('pointerdown', () => {
      const audio = (window as any).musicaGlobal;
      if (audio) {
        // Diminui o áudio em frações de 10%
        let novoVolume = Math.round((audio.volume - 0.1) * 10) / 10;
        
        if (novoVolume < 0) {
          // Se passar do mudo, dá a volta completa e retorna ao volume de 50%
          novoVolume = 0.5;
          if (audio.paused) audio.play().catch(() => {});
        }
        
        audio.volume = novoVolume;
        
        // Atualiza a UI imediatamente
        txtVolume.setText(obterTextoVolume());
        desenharIcone(true);
      }
    });
  }

  private _criarBotao(x: number, y: number, rotulo: string, cor: number, acao: () => void): void {
    const larg = 240;
    const alt = 45;

    const container = this.add.container(x, y);
    const fundo = this.add.graphics();

    const _desenharNormal = () => {
      fundo.clear();
      fundo.fillGradientStyle(0x1A1D24, 0x1A1D24, 0x080E17, 0x080E17, 1);
      fundo.fillRect(-larg / 2, -alt / 2, larg, alt);
      fundo.lineStyle(2, 0x374459, 1);
      fundo.strokeRect(-larg / 2, -alt / 2, larg, alt);
    };

    const _desenharHover = () => {
      fundo.clear();
      fundo.fillGradientStyle(0x0C439F, 0x0C439F, 0x053991, 0x053991, 1);
      fundo.fillRect(-larg / 2, -alt / 2, larg, alt);
      fundo.lineStyle(2, 0x004DD6, 1);
      fundo.strokeRect(-larg / 2, -alt / 2, larg, alt);
    };

    _desenharNormal();

    const texto = this.add.text(0, 0, rotulo, {
      fontFamily: "Silence Onyx, 'Bangers', cursive",
      fontSize: '26px',
      color: '#ffffff',
    }).setOrigin(0.5);

    container.add([fundo, texto]);
    container.setSize(larg, alt);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', _desenharHover);
    container.on('pointerout', _desenharNormal);
    container.on('pointerdown', acao);
  }

  private _inicializarPartulas() {
    for (let i = 0; i < 25; i++) {
      this.particulas.push({
        x: Phaser.Math.Between(0, LARGURA_JOGO),
        y: Phaser.Math.Between(0, ALTURA_JOGO),
        vx: Phaser.Math.FloatBetween(-0.5, 0.5),
        vy: Phaser.Math.FloatBetween(-0.2, -1.0),
        alfa: Phaser.Math.FloatBetween(0.1, 0.5),
        tamanho: Phaser.Math.Between(2, 5)
      });
    }
  }

  update(): void {
    this.particulasGfx.clear();
    for (let p of this.particulas) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) {
        p.y = ALTURA_JOGO + 10;
        p.x = Phaser.Math.Between(0, LARGURA_JOGO);
      }
      this.particulasGfx.fillStyle(0xffffff, p.alfa);
      this.particulasGfx.fillRect(p.x, p.y, p.tamanho, p.tamanho);
    }
  }
}