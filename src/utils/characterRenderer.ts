import { Character } from '../types';
import {
  drawPixelMatrix,
  T_REX_STAND,
  T_REX_RUN_1,
  T_REX_RUN_2,
  T_REX_CRASH,
  T_REX_DUCK_1,
  T_REX_DUCK_2,
} from './pixelSprites';

// Procedural matrices for other preset characters
const CAT_STAND = [
  "...#.....#........",
  "..###...###.......",
  "..#########.......",
  "..#.#.#.#.#.......",
  "..#########.......",
  "....#####.........",
  "....#######.......",
  "...#########..#...",
  "..###########.##..",
  "..###########.##..",
  "..###########.##..",
  "..###########.##..",
  "...#########..#...",
  "....##...##.......",
  "....##...##.......",
  "....##...##.......",
];

const CAT_RUN_1 = [
  "...#.....#........",
  "..###...###.......",
  "..#########.......",
  "..#.#.#.#.#.......",
  "..#########.......",
  "....#####.........",
  "....#######.......",
  "...#########..#...",
  "..###########.##..",
  "..###########.##..",
  "..###########.##..",
  "..###########.##..",
  "...#########..#...",
  "....##....#.......",
  "....##....##......",
  "....#.............",
];

const CAT_RUN_2 = [
  "...#.....#........",
  "..###...###.......",
  "..#########.......",
  "..#.#.#.#.#.......",
  "..#########.......",
  "....#####.........",
  "....#######.......",
  "...#########..#...",
  "..###########.##..",
  "..###########.##..",
  "..###########.##..",
  "..###########.##..",
  "...#########..#...",
  ".....#....##......",
  "....##....##......",
  "...........#......",
];

const CAT_DUCK = [
  ".....................",
  "................#....",
  "...#...#........##...",
  "..#######.......##...",
  "..#.#.#.#.#########..",
  "..#######.#########..",
  "...#####..########...",
  "....####..#######....",
  ".....##....##........",
];

const BOT_STAND = [
  ".......#........",
  "......###.......",
  ".......#........",
  ".....#####......",
  "....#.....#.....",
  "...#########....",
  "...#..###..#....",
  "...#..###..#....",
  "...#########....",
  "....#######.....",
  "....#######.....",
  "...#########....",
  "...##.###.##....",
  "...##.###.##....",
  "....#.....#.....",
  "....##...##.....",
  "....##...##.....",
  "....###.###.....",
];

const BOT_RUN_1 = [
  ".......#........",
  "......###.......",
  ".......#........",
  ".....#####......",
  "....#.....#.....",
  "...#########....",
  "...#..###..#....",
  "...#..###..#....",
  "...#########....",
  "....#######.....",
  "....#######.....",
  "...#########....",
  "...##.###.##....",
  "...##.###.##....",
  "....#.....#.....",
  "....##...#......",
  "....##...##.....",
  "....###.........",
];

const BOT_RUN_2 = [
  ".......#........",
  "......###.......",
  ".......#........",
  ".....#####......",
  "....#.....#.....",
  "...#########....",
  "...#..###..#....",
  "...#..###..#....",
  "...#########....",
  "....#######.....",
  "....#######.....",
  "...#########....",
  "...##.###.##....",
  "...##.###.##....",
  "....#.....#.....",
  ".....#...##.....",
  "....##...##.....",
  ".........###....",
];

const BOT_DUCK = [
  "..................",
  ".....#..#####.....",
  "....###.#####.....",
  ".....#..#.#.#.....",
  "...###########....",
  "..#############...",
  "...###########....",
  "....###...###.....",
  "....##.....##.....",
];

const ALIEN_STAND = [
  "......#####......",
  "....#########....",
  "...###########...",
  "..##..#####..##..",
  "..##..#####..##..",
  "..#############..",
  "...###########...",
  "....#########....",
  ".....#######.....",
  "....#########....",
  "...###########...",
  "..#############..",
  "..##..#####..##..",
  "......#...#......",
  ".....##...##.....",
  ".....##...##.....",
];

const ALIEN_RUN_1 = [
  "......#####......",
  "....#########....",
  "...###########...",
  "..##..#####..##..",
  "..##..#####..##..",
  "..#############..",
  "...###########...",
  "....#########....",
  ".....#######.....",
  "....#########....",
  "...###########...",
  "..#############..",
  "..##..#####..##..",
  "......#...#......",
  ".....##....#.....",
  ".....##....##....",
];

const ALIEN_RUN_2 = [
  "......#####......",
  "....#########....",
  "...###########...",
  "..##..#####..##..",
  "..##..#####..##..",
  "..#############..",
  "...###########...",
  "....#########....",
  ".....#######.....",
  "....#########....",
  "...###########...",
  "..#############..",
  "..##..#####..##..",
  "......#...#......",
  "......#...##.....",
  ".....##...##.....",
];

const ALIEN_DUCK = [
  "..................",
  ".....#######......",
  "...###########....",
  "..##..#####..##...",
  "..#############...",
  "..#############...",
  "##################",
  "..##..#####..##...",
  ".....#.....#......",
];

// Cache for processed custom image elements
const imageCache: Map<string, { img: HTMLImageElement; canvas: HTMLCanvasElement }> = new Map();

/**
 * Preprocess user image: handles background transparency and pixelation
 */
export async function processCustomImage(
  dataUrl: string,
  options: { removeBg?: boolean; bgTolerance?: number; pixelate?: boolean }
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const targetW = options.pixelate ? 48 : 96;
      const aspect = img.height / (img.width || 1);
      const targetH = Math.round(targetW * aspect);

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = !options.pixelate;
      ctx.drawImage(img, 0, 0, targetW, targetH);

      if (options.removeBg) {
        const imgData = ctx.getImageData(0, 0, targetW, targetH);
        const data = imgData.data;
        const tolerance = options.bgTolerance || 40;

        // Sample top-left corner color as key background color
        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Check if matches corner color or is pure/near white
          const distCorner = Math.sqrt(
            Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
          );
          const isNearWhite = r > 240 && g > 240 && b > 240;

          if (distCorner < tolerance || isNearWhite) {
            data[i + 3] = 0; // Transparent
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Draw the player character onto the main game canvas
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  char: Character,
  x: number,
  y: number,
  state: 'idle' | 'running' | 'jumping' | 'ducking' | 'crashed',
  runFrame: number, // 0 or 1
  colorTheme: string
) {
  // If custom character with custom image
  if (char.type === 'custom' && char.customImageUrl) {
    let cached = imageCache.get(char.customImageUrl);
    if (!cached) {
      const img = new Image();
      img.src = char.customImageUrl;
      cached = { img, canvas: document.createElement('canvas') };
      imageCache.set(char.customImageUrl, cached);
    }

    if (cached.img.complete && cached.img.naturalWidth > 0) {
      ctx.save();

      // Custom sizing
      const baseWidth = 44 * (char.scale || 1);
      const baseHeight = 47 * (char.scale || 1);

      if (state === 'ducking') {
        const duckH = baseHeight * 0.55;
        const duckW = baseWidth * 1.25;
        const duckY = y + (baseHeight - duckH);

        // Runner bob during duck
        const bob = runFrame === 1 ? -1 : 0;
        ctx.drawImage(cached.img, x, duckY + bob, duckW, duckH);
      } else {
        let drawX = x;
        let drawY = y;
        let rotation = 0;

        if (state === 'running') {
          // Subtle wobble / foot bob
          drawY += runFrame === 0 ? 0 : -2;
          rotation = runFrame === 0 ? -0.03 : 0.03;
        } else if (state === 'jumping') {
          rotation = -0.08; // slight upward tilt
        } else if (state === 'crashed') {
          rotation = 0.25; // knocked back
        }

        ctx.translate(drawX + baseWidth / 2, drawY + baseHeight / 2);
        ctx.rotate(rotation);
        ctx.drawImage(
          cached.img,
          -baseWidth / 2,
          -baseHeight / 2,
          baseWidth,
          baseHeight
        );

        if (state === 'crashed') {
          // Draw classic retro X eyes over custom character
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-10, -10);
          ctx.lineTo(-2, -2);
          ctx.moveTo(-2, -10);
          ctx.lineTo(-10, -2);
          ctx.stroke();
        }
      }

      ctx.restore();
      return;
    }
  }

  // Preset Characters Rendering
  const pixelSize = 2;

  if (char.id === 'classic_dino') {
    const colorMap = { '#': colorTheme };
    if (state === 'idle') {
      drawPixelMatrix(ctx, T_REX_STAND, x, y, pixelSize, colorMap);
    } else if (state === 'crashed') {
      drawPixelMatrix(ctx, T_REX_CRASH, x, y, pixelSize, { ...colorMap, X: '#ef4444' });
    } else if (state === 'ducking') {
      const duckMatrix = runFrame === 0 ? T_REX_DUCK_1 : T_REX_DUCK_2;
      drawPixelMatrix(ctx, duckMatrix, x, y + 21, pixelSize, colorMap);
    } else if (state === 'jumping') {
      drawPixelMatrix(ctx, T_REX_STAND, x, y, pixelSize, colorMap);
    } else {
      // running
      const runMatrix = runFrame === 0 ? T_REX_RUN_1 : T_REX_RUN_2;
      drawPixelMatrix(ctx, runMatrix, x, y, pixelSize, colorMap);
    }
    return;
  }

  if (char.id === 'cool_dino') {
    // Classic T-Rex with cool black sunglasses & red headband
    const colorMap = { '#': '#10b981' };
    const matrix =
      state === 'crashed'
        ? T_REX_CRASH
        : state === 'ducking'
        ? runFrame === 0
          ? T_REX_DUCK_1
          : T_REX_DUCK_2
        : state === 'running'
        ? runFrame === 0
          ? T_REX_RUN_1
          : T_REX_RUN_2
        : T_REX_STAND;

    const posY = state === 'ducking' ? y + 21 : y;
    drawPixelMatrix(ctx, matrix, x, posY, pixelSize, colorMap);

    // Draw retro 8-bit cool sunglasses
    ctx.fillStyle = '#111827';
    if (state === 'ducking') {
      ctx.fillRect(x + 40, posY + 4, 14, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x + 36, posY + 2, 20, 3); // headband
    } else {
      ctx.fillRect(x + 22, posY + 6, 16, 6);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x + 18, posY + 2, 22, 3); // headband
    }
    return;
  }

  if (char.id === 'pixel_cat') {
    const colorMap = { '#': '#ea580c' };
    const pSize = 2.4;
    if (state === 'ducking') {
      drawPixelMatrix(ctx, CAT_DUCK, x - 4, y + 22, pSize, colorMap);
    } else if (state === 'running') {
      const m = runFrame === 0 ? CAT_RUN_1 : CAT_RUN_2;
      drawPixelMatrix(ctx, m, x, y + 8, pSize, colorMap);
    } else {
      drawPixelMatrix(ctx, CAT_STAND, x, y + 8, pSize, colorMap);
    }
    return;
  }

  if (char.id === 'retro_bot') {
    const colorMap = { '#': '#2563eb' };
    const pSize = 2.4;
    if (state === 'ducking') {
      drawPixelMatrix(ctx, BOT_DUCK, x, y + 22, pSize, colorMap);
      // thruster spark
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x - 6, y + 30, 6, 4);
    } else if (state === 'running') {
      const m = runFrame === 0 ? BOT_RUN_1 : BOT_RUN_2;
      drawPixelMatrix(ctx, m, x, y + 4, pSize, colorMap);
    } else {
      drawPixelMatrix(ctx, BOT_STAND, x, y + 4, pSize, colorMap);
    }
    // Visor glowing slit
    ctx.fillStyle = '#06b6d4';
    if (state !== 'ducking') {
      ctx.fillRect(x + 12, y + 16, 12, 4);
    }
    return;
  }

  if (char.id === 'cosmic_alien') {
    const colorMap = { '#': '#8b5cf6' };
    const pSize = 2.4;
    if (state === 'ducking') {
      drawPixelMatrix(ctx, ALIEN_DUCK, x, y + 22, pSize, colorMap);
    } else if (state === 'running') {
      const m = runFrame === 0 ? ALIEN_RUN_1 : ALIEN_RUN_2;
      drawPixelMatrix(ctx, m, x, y + 6, pSize, colorMap);
    } else {
      drawPixelMatrix(ctx, ALIEN_STAND, x, y + 6, pSize, colorMap);
    }
    // Bubble helmet glow
    ctx.strokeStyle = '#c4b5fd';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 6, y + 8, 24, 16);
    return;
  }

  // Fallback to classic
  drawPixelMatrix(ctx, T_REX_STAND, x, y, pixelSize, { '#': colorTheme });
}
