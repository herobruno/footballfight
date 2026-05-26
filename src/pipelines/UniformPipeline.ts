import Phaser from 'phaser';

export function hexToRgbNormalized(hex: number): number[] {
  const r = ((hex >> 16) & 0xff) / 255;
  const g = ((hex >> 8) & 0xff) / 255;
  const b = (hex & 0xff) / 255;
  return [r, g, b];
}

export class UniformPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  public uPrimaryColor: number[] = [1.0, 1.0, 1.0];
  public uSecondaryColor: number[] = [0.0, 0.0, 1.0];
  public uDestaqueColor: number[] = [0.0, 1.0, 1.0];

  constructor(game: Phaser.Game) {
    super({
      game,
      name: 'UniformPipeline',
      fragShader: `
        precision mediump float;
        uniform sampler2D uMainSampler;
        varying vec2 outTexCoord;
        uniform vec3 uPrimaryColor;
        uniform vec3 uSecondaryColor;
        uniform vec3 uDestaqueColor;

        bool colorClose(vec3 c1, vec3 c2, float threshold) {
            return distance(c1, c2) < threshold;
        }

        void main() {
            vec4 texel = texture2D(uMainSampler, outTexCoord);
            if (texel.a == 0.0) {
                gl_FragColor = texel;
                return;
            }
            
            vec3 color = texel.rgb;
            
            // Cores originais do sprite (referências exatas da roupa)
            vec3 origWhite = vec3(1.0, 1.0, 1.0);                              // Branco principal (#FFFFFF)
            vec3 origShadow1 = vec3(237.0/255.0, 234.0/255.0, 245.0/255.0);    // Cinza claro (#EDEAF5)
            vec3 origShadow2 = vec3(201.0/255.0, 195.0/255.0, 217.0/255.0);    // Cinza arroxeado (#C9C3D9)
            vec3 origShadow3 = vec3(159.0/255.0, 152.0/255.0, 180.0/255.0);    // Sombra escura (#9F98B4)
            
            vec3 origBlueCollar = vec3(120.0/255.0, 215.0/255.0, 255.0/255.0); // Azul claro da gola/meia (#78D7FF)
            vec3 origBlueSec = vec3(74.0/255.0, 184.0/255.0, 232.0/255.0);     // Azul secundário (#4AB8E8)
            vec3 origBlueShadow = vec3(47.0/255.0, 125.0/255.0, 179.0/255.0);  // Azul sombra (#2F7DB3)
            
            vec3 origSockWhite = vec3(245.0/255.0, 244.0/255.0, 250.0/255.0);  // Branco meia (#F5F4FA)
            vec3 origSockBlue = vec3(126.0/255.0, 220.0/255.0, 255.0/255.0);   // Azul detalhe (#7EDCFF)
            
            vec3 origShoeWhite = vec3(248.0/255.0, 248.0/255.0, 255.0/255.0);  // Branco tênis (#F8F8FF)
            vec3 origShoeNeonBlue = vec3(94.0/255.0, 216.0/255.0, 255.0/255.0); // Azul neon do tênis (#5ED8FF)
            
            float thr = 0.18; // Limiar de proximidade para tolerar pequenas variações de compressão/pixel
            
            // ── Camisa / Calção (Branco e Sombras) ──
            if (colorClose(color, origWhite, thr)) {
                color = uPrimaryColor;
            } else if (colorClose(color, origShadow1, thr)) {
                color = mix(uPrimaryColor, vec3(0.0, 0.0, 0.0), 0.08);
            } else if (colorClose(color, origShadow2, thr)) {
                color = mix(uPrimaryColor, vec3(0.0, 0.0, 0.0), 0.22);
            } else if (colorClose(color, origShadow3, thr)) {
                color = mix(uPrimaryColor, vec3(0.0, 0.0, 0.0), 0.38);
            }
            // ── Detalhes em Azul da Roupa ──
            else if (colorClose(color, origBlueCollar, thr)) {
                color = uSecondaryColor;
            } else if (colorClose(color, origBlueSec, thr)) {
                color = mix(uSecondaryColor, vec3(0.0, 0.0, 0.0), 0.15);
            } else if (colorClose(color, origBlueShadow, thr)) {
                color = mix(uSecondaryColor, vec3(0.0, 0.0, 0.0), 0.35);
            }
            // ── Meias ──
            else if (colorClose(color, origSockWhite, thr)) {
                color = uPrimaryColor;
            } else if (colorClose(color, origSockBlue, thr)) {
                color = uSecondaryColor;
            }
            // ── Tênis ──
            else if (colorClose(color, origShoeWhite, thr)) {
                color = vec3(0.97, 0.97, 1.0); // Continua branco
            } else if (colorClose(color, origShoeNeonBlue, thr)) {
                color = uDestaqueColor;
            }
            
            gl_FragColor = vec4(color, texel.a);
        }
      `
    });
  }

  onPreRender() {
    this.set3f('uPrimaryColor', this.uPrimaryColor[0], this.uPrimaryColor[1], this.uPrimaryColor[2]);
    this.set3f('uSecondaryColor', this.uSecondaryColor[0], this.uSecondaryColor[1], this.uSecondaryColor[2]);
    this.set3f('uDestaqueColor', this.uDestaqueColor[0], this.uDestaqueColor[1], this.uDestaqueColor[2]);
  }
}
