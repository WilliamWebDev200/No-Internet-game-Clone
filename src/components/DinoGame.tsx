import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Character, Obstacle, Cloud, HorizonDot, Star, Bullet, Particle, FloatingText } from '../types';
import { sound } from '../utils/audio';
import { drawCharacter } from '../utils/characterRenderer';
import {
  COLORS,
  drawPixelMatrix,
  CACTUS_SMALL,
  CACTUS_LARGE,
  PTERODACTYL_UP,
  PTERODACTYL_DOWN,
  CLOUD_SPRITE,
} from '../utils/pixelSprites';
import { Play, RotateCcw, Volume2, VolumeX, Moon, Sun, ArrowDown, ArrowUp, Zap, Crosshair } from 'lucide-react';

interface DinoGameProps {
  character: Character;
  onOpenCharacterModal: () => void;
  themeMode: 'auto' | 'day' | 'night';
  onToggleTheme: () => void;
  speedModifier: 'normal' | 'fast' | 'moon';
  onStatsUpdate?: (score: number, jumped: boolean, ducked: boolean, blasted?: boolean) => void;
}

export const DinoGame: React.FC<DinoGameProps> = ({
  character,
  onOpenCharacterModal,
  themeMode,
  onToggleTheme,
  speedModifier,
  onStatsUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Game state
  const [gameState, setGameState] = useState<'idle' | 'running' | 'paused' | 'gameover'>('idle');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('dino_high_score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [isNight, setIsNight] = useState<boolean>(false);
  const [ammo, setAmmo] = useState<number>(3);

  // References for game loop values (avoiding closure stale values)
  const stateRef = useRef({
    gameState: 'idle' as 'idle' | 'running' | 'paused' | 'gameover',
    score: 0,
    highScore: 0,
    speed: 6.5,
    distance: 0,
    // Dino physics
    x: 50,
    y: 253,
    vy: 0,
    groundY: 300,
    dinoH: 47,
    dinoW: 44,
    isJumping: false,
    isDucking: false,
    canDoubleJump: false,
    // 3-bullet shooting power
    ammo: 3,
    maxAmmo: 3,
    bullets: [] as Bullet[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    // Jump physics based on modifier
    gravity: 0.6,
    jumpVelocity: -10.5,
    // Animation
    runFrame: 0,
    lastFrameSwitch: 0,
    // Obstacles & decor
    obstacles: [] as Obstacle[],
    clouds: [] as Cloud[],
    horizonDots: [] as HorizonDot[],
    stars: [] as Star[],
    nextObstacleDist: 220,
    // Milestone flashing
    milestoneFlashUntil: 0,
    milestoneBlink: false,
    lastMilestoneScore: 0,
    // Controls
    jumpPressed: false,
    duckPressed: false,
  });

  // Keep stateRef high score in sync
  useEffect(() => {
    stateRef.current.highScore = highScore;
  }, [highScore]);

  // Handle physics configuration by speed modifier
  useEffect(() => {
    if (speedModifier === 'moon') {
      stateRef.current.gravity = 0.32;
      stateRef.current.jumpVelocity = -8.2;
    } else if (speedModifier === 'fast') {
      stateRef.current.gravity = 0.72;
      stateRef.current.jumpVelocity = -12;
    } else {
      stateRef.current.gravity = 0.6;
      stateRef.current.jumpVelocity = -10.5;
    }
  }, [speedModifier]);

  // Handle Day/Night theme mode
  useEffect(() => {
    if (themeMode === 'day') {
      setIsNight(false);
    } else if (themeMode === 'night') {
      setIsNight(true);
    }
  }, [themeMode]);

  // Initialize decor elements
  const initDecor = useCallback((width: number) => {
    const clouds: Cloud[] = [];
    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: Math.random() * width,
        y: 40 + Math.random() * 90,
        speed: 0.8 + Math.random() * 0.4,
        width: 46,
      });
    }

    const dots: HorizonDot[] = [];
    for (let i = 0; i < 35; i++) {
      dots.push({
        x: Math.random() * width,
        y: 300 + Math.random() * 16,
        length: 2 + Math.floor(Math.random() * 3),
      });
    }

    const stars: Star[] = [];
    for (let i = 0; i < 30; i++) {
      stars.push({
        x: Math.random() * width,
        y: 15 + Math.random() * 180,
        brightness: 0.4 + Math.random() * 0.6,
        size: Math.random() > 0.8 ? 2 : 1,
      });
    }

    stateRef.current.clouds = clouds;
    stateRef.current.horizonDots = dots;
    stateRef.current.stars = stars;
  }, []);

  // Shoot power trigger (3 bullets max per run)
  const triggerShoot = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState === 'idle' || s.gameState === 'gameover') {
      startGame();
      return;
    }

    if (s.gameState !== 'running') return;

    if (s.ammo <= 0) {
      sound.playEmptyAmmo();
      // Floating alert when dry firing
      s.floatingTexts.push({
        x: s.x,
        y: s.y - 12,
        text: 'NO AMMO!',
        alpha: 1,
        vy: -1.2,
      });
      return;
    }

    // Decrement ammo
    s.ammo -= 1;
    setAmmo(s.ammo);
    sound.playShoot();

    // Spawn bullet from dino's mouth / character edge
    const currentW = s.isDucking ? 60 : s.dinoW;
    const bulletY = s.isDucking ? s.groundY - 15 : s.y + 16;
    const bulletX = s.x + currentW + 4;

    s.bullets.push({
      x: bulletX,
      y: bulletY,
      vx: s.speed + 15,
      width: 18,
      height: 6,
    });

    // Muzzle sparks
    for (let i = 0; i < 6; i++) {
      s.particles.push({
        x: bulletX,
        y: bulletY + 3,
        vx: (Math.random() - 0.2) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: 2 + Math.random() * 2,
        color: '#f59e0b',
        alpha: 1,
        life: 15,
      });
    }
  }, []);

  // Jump trigger
  const triggerJump = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState === 'idle' || s.gameState === 'gameover') {
      startGame();
      return;
    }

    if (s.gameState === 'running' && !s.isJumping) {
      s.isJumping = true;
      s.vy = s.jumpVelocity;
      sound.playJump();
      onStatsUpdate?.(s.score, true, false);
    }
  }, [onStatsUpdate]);

  // Duck triggers
  const startDuck = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState === 'running') {
      s.isDucking = true;
      onStatsUpdate?.(s.score, false, true);
    }
  }, [onStatsUpdate]);

  const endDuck = useCallback(() => {
    stateRef.current.isDucking = false;
  }, []);

  // Start / restart game
  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.gameState = 'running';
    s.score = 0;
    s.distance = 0;
    s.speed = speedModifier === 'fast' ? 8.5 : speedModifier === 'moon' ? 5.8 : 6.5;
    s.y = s.groundY - s.dinoH;
    s.vy = 0;
    s.isJumping = false;
    s.isDucking = false;
    s.obstacles = [];
    s.nextObstacleDist = 260;
    s.lastMilestoneScore = 0;
    s.milestoneFlashUntil = 0;
    s.milestoneBlink = false;
    // Reset 3 bullets
    s.ammo = 3;
    s.bullets = [];
    s.particles = [];
    s.floatingTexts = [];
    setAmmo(3);

    setGameState('running');
    setScore(0);
    sound.playJump(); // starting jump
    s.isJumping = true;
    s.vy = s.jumpVelocity;
  }, [speedModifier]);

  // Toggle pause
  const togglePause = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState === 'running') {
      s.gameState = 'paused';
      setGameState('paused');
    } else if (s.gameState === 'paused') {
      s.gameState = 'running';
      setGameState('running');
    }
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling when using Space or Arrow keys inside game
      if (['Space', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        stateRef.current.jumpPressed = true;
        triggerJump();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        stateRef.current.duckPressed = true;
        startDuck();
      } else if (['KeyF', 'KeyZ', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
        e.preventDefault();
        triggerShoot();
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        togglePause();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        stateRef.current.jumpPressed = false;
        // If released jump early, reduce upward momentum for variable jump height
        if (stateRef.current.vy < -4) {
          stateRef.current.vy = -4;
        }
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        stateRef.current.duckPressed = false;
        endDuck();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [triggerJump, startDuck, endDuck, triggerShoot, togglePause]);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    // Auto-resize logic with High-DPI support
    const handleResize = () => {
      if (!canvas || !containerRef.current) return;
      const width = containerRef.current.clientWidth || window.innerWidth || 800;
      const height = 380;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      initDecor(width);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Collision detection between Dino and obstacle
    const checkCollision = (obs: Obstacle): boolean => {
      const s = stateRef.current;
      const dinoCurrentH = s.isDucking ? 26 : s.dinoH;
      const dinoCurrentW = s.isDucking ? 58 : s.dinoW;
      const dinoCurrentY = s.isDucking ? s.groundY - 26 : s.y;

      // Inset bounding boxes slightly for generous fair gameplay
      const dinoBox = {
        x: s.x + 5,
        y: dinoCurrentY + 4,
        w: dinoCurrentW - 10,
        h: dinoCurrentH - 8,
      };

      const obsBox = {
        x: obs.x + 4,
        y: obs.y + 4,
        w: obs.width - 8,
        h: obs.height - 8,
      };

      return (
        dinoBox.x < obsBox.x + obsBox.w &&
        dinoBox.x + dinoBox.w > obsBox.x &&
        dinoBox.y < obsBox.y + obsBox.h &&
        dinoBox.y + dinoBox.h > obsBox.y
      );
    };

    // Game loop tick
    const render = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const s = stateRef.current;
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      // Determine palette
      let currentIsNight = isNight;
      if (themeMode === 'auto') {
        const cycle = Math.floor(s.score / 700);
        currentIsNight = cycle % 2 === 1;
      }
      const palette = currentIsNight ? COLORS.night : COLORS.day;

      // Update game physics if running
      if (s.gameState === 'running') {
        s.distance += s.speed;
        s.score = Math.floor(s.distance / 10);
        setScore(s.score);

        // Milestone 100-point flash and chime
        if (s.score > 0 && s.score % 100 === 0 && s.score !== s.lastMilestoneScore) {
          s.lastMilestoneScore = s.score;
          s.milestoneFlashUntil = time + 1400;
          sound.playScore();
        }

        // Speed increases gradually
        if (s.speed < 13.5) {
          s.speed += 0.0012;
        }

        // Running animation frame switch (approx every 120ms)
        if (time - s.lastFrameSwitch > 120) {
          s.runFrame = s.runFrame === 0 ? 1 : 0;
          s.lastFrameSwitch = time;
        }

        // Dino vertical physics
        if (s.isJumping) {
          s.y += s.vy;
          s.vy += s.gravity;

          // Ground landing
          if (s.y >= s.groundY - s.dinoH) {
            s.y = s.groundY - s.dinoH;
            s.vy = 0;
            s.isJumping = false;
          }
        }

        // Move clouds
        s.clouds.forEach((cloud) => {
          cloud.x -= cloud.speed;
          if (cloud.x < -cloud.width) {
            cloud.x = width + 20;
            cloud.y = 40 + Math.random() * 90;
          }
        });

        // Move horizon dots
        s.horizonDots.forEach((dot) => {
          dot.x -= s.speed;
          if (dot.x < -10) {
            dot.x = width + Math.random() * 20;
          }
        });

        // Spawn obstacles
        s.nextObstacleDist -= s.speed;
        if (s.nextObstacleDist <= 0) {
          const canSpawnBird = s.score > 320 && Math.random() > 0.45;

          if (canSpawnBird) {
            const heights: ('low' | 'mid' | 'high')[] = ['low', 'mid', 'high'];
            const flyHeight = heights[Math.floor(Math.random() * heights.length)];
            let obsY = s.groundY - 34;
            if (flyHeight === 'mid') obsY = s.groundY - 65;
            if (flyHeight === 'high') obsY = s.groundY - 100;

            s.obstacles.push({
              x: width + 20,
              y: obsY,
              width: 46,
              height: 38,
              type: 'pterodactyl',
              flyHeight,
              frame: 0,
            });
          } else {
            const r = Math.random();
            let obsType: Obstacle['type'] = 'cactus_small';
            let w = 17;
            let h = 35;

            if (r < 0.3) {
              obsType = 'cactus_small';
              w = 17;
              h = 35;
            } else if (r < 0.5) {
              obsType = 'cactus_double';
              w = 34;
              h = 35;
            } else if (r < 0.7) {
              obsType = 'cactus_triple';
              w = 51;
              h = 35;
            } else if (r < 0.88) {
              obsType = 'cactus_large';
              w = 25;
              h = 50;
            } else {
              obsType = 'cactus_large_group';
              w = 50;
              h = 50;
            }

            s.obstacles.push({
              x: width + 20,
              y: s.groundY - h,
              width: w,
              height: h,
              type: obsType,
            });
          }

          const minGap = 160 + s.speed * 8;
          const randomGap = Math.random() * (220 + s.speed * 10);
          s.nextObstacleDist = minGap + randomGap;
        }

        // Update Bullets & Obstacle destruction
        for (let bIdx = s.bullets.length - 1; bIdx >= 0; bIdx--) {
          const b = s.bullets[bIdx];
          b.x += b.vx;

          let hitObstacle = false;

          for (let oIdx = s.obstacles.length - 1; oIdx >= 0; oIdx--) {
            const obs = s.obstacles[oIdx];
            // Check collision between bullet and obstacle
            if (
              b.x + b.width >= obs.x &&
              b.x <= obs.x + obs.width &&
              b.y + b.height >= obs.y &&
              b.y <= obs.y + obs.height
            ) {
              // Obstacle destroyed!
              hitObstacle = true;
              s.obstacles.splice(oIdx, 1);
              sound.playExplosion();

              // Spawn 22 pixel explosion fragments
              for (let p = 0; p < 22; p++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = 2 + Math.random() * 6;
                s.particles.push({
                  x: obs.x + obs.width / 2,
                  y: obs.y + obs.height / 2,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd - 2,
                  size: 2.5 + Math.floor(Math.random() * 3),
                  color: Math.random() > 0.6 ? '#f97316' : Math.random() > 0.3 ? '#ef4444' : '#fbbf24',
                  alpha: 1,
                  life: 25,
                });
              }

              // Bonus distance + score popup
              s.distance += 500; // +50 score points
              s.floatingTexts.push({
                x: obs.x,
                y: obs.y - 10,
                text: '+50 BLAST!',
                alpha: 1,
                vy: -1.4,
              });

              onStatsUpdate?.(s.score + 50, false, false, true);
              break;
            }
          }

          if (hitObstacle || b.x > width + 50) {
            s.bullets.splice(bIdx, 1);
          }
        }

        // Update explosion particles
        for (let pIdx = s.particles.length - 1; pIdx >= 0; pIdx--) {
          const p = s.particles[pIdx];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.22; // gravity on debris
          p.alpha -= 0.035;
          if (p.alpha <= 0) {
            s.particles.splice(pIdx, 1);
          }
        }

        // Update floating score texts
        for (let ftIdx = s.floatingTexts.length - 1; ftIdx >= 0; ftIdx--) {
          const ft = s.floatingTexts[ftIdx];
          ft.y += ft.vy;
          ft.alpha -= 0.025;
          if (ft.alpha <= 0) {
            s.floatingTexts.splice(ftIdx, 1);
          }
        }

        // Update obstacles & check collision with player
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          obs.x -= s.speed;

          if (obs.type === 'pterodactyl') {
            obs.frame = Math.floor(time / 200) % 2;
          }

          if (checkCollision(obs)) {
            // Crash!
            s.gameState = 'gameover';
            setGameState('gameover');
            sound.playHit();

            if (s.score > s.highScore) {
              s.highScore = s.score;
              setHighScore(s.score);
              localStorage.setItem('dino_high_score', String(s.score));
            }
            break;
          }

          if (obs.x + obs.width < -10) {
            s.obstacles.splice(i, 1);
          }
        }
      }

      // --- RENDERING ---
      // 1. Background
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);

      // 2. Stars & Moon if Night
      if (currentIsNight) {
        ctx.fillStyle = palette.star;
        s.stars.forEach((st) => {
          ctx.globalAlpha = st.brightness;
          ctx.fillRect(st.x, st.y, st.size, st.size);
        });
        ctx.globalAlpha = 1;

        const moonX = width - 80;
        const moonY = 30;
        ctx.fillStyle = '#e8eaed';
        ctx.beginPath();
        ctx.arc(moonX, moonY, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = palette.bg;
        ctx.beginPath();
        ctx.arc(moonX + 6, moonY - 3, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Clouds
      s.clouds.forEach((cl) => {
        drawPixelMatrix(ctx, CLOUD_SPRITE, cl.x, cl.y, 2, { '#': palette.cloud });
      });

      // 4. Ground Line & Texture
      ctx.strokeStyle = palette.ground;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, s.groundY);
      ctx.lineTo(width, s.groundY);
      ctx.stroke();

      ctx.fillStyle = palette.ground;
      s.horizonDots.forEach((dot) => {
        ctx.fillRect(dot.x, dot.y, dot.length, 1);
      });

      // 5. Obstacles
      s.obstacles.forEach((obs) => {
        const colorMap = { '#': palette.obstacle };
        if (obs.type === 'cactus_small') {
          drawPixelMatrix(ctx, CACTUS_SMALL, obs.x, obs.y, 2.5, colorMap);
        } else if (obs.type === 'cactus_double') {
          drawPixelMatrix(ctx, CACTUS_SMALL, obs.x, obs.y, 2.5, colorMap);
          drawPixelMatrix(ctx, CACTUS_SMALL, obs.x + 16, obs.y, 2.5, colorMap);
        } else if (obs.type === 'cactus_triple') {
          drawPixelMatrix(ctx, CACTUS_SMALL, obs.x, obs.y, 2.5, colorMap);
          drawPixelMatrix(ctx, CACTUS_SMALL, obs.x + 16, obs.y, 2.5, colorMap);
          drawPixelMatrix(ctx, CACTUS_SMALL, obs.x + 32, obs.y, 2.5, colorMap);
        } else if (obs.type === 'cactus_large') {
          drawPixelMatrix(ctx, CACTUS_LARGE, obs.x, obs.y, 2.5, colorMap);
        } else if (obs.type === 'cactus_large_group') {
          drawPixelMatrix(ctx, CACTUS_LARGE, obs.x, obs.y, 2.5, colorMap);
          drawPixelMatrix(ctx, CACTUS_LARGE, obs.x + 24, obs.y, 2.5, colorMap);
        } else if (obs.type === 'pterodactyl') {
          const matrix = obs.frame === 0 ? PTERODACTYL_UP : PTERODACTYL_DOWN;
          drawPixelMatrix(ctx, matrix, obs.x, obs.y, 2.3, colorMap);
        }
      });

      // 6. Bullets (Laser Plasma Projectiles)
      s.bullets.forEach((b) => {
        // Outer glowing laser beam
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(b.x, b.y, b.width, b.height);
        // Inner core
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(b.x + 3, b.y + 1.5, b.width - 4, b.height - 3);
        // Trailing sparks
        ctx.fillStyle = '#f97316';
        ctx.fillRect(b.x - 4, b.y + 2, 3, 2);
        ctx.fillRect(b.x - 8, b.y + 1, 2, 2);
      });

      // 7. Explosion Debris Particles
      s.particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      });

      // 8. Floating Score Texts
      s.floatingTexts.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillStyle = '#f59e0b';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // 9. Character
      let charState: 'idle' | 'running' | 'jumping' | 'ducking' | 'crashed' = 'running';
      if (s.gameState === 'idle') {
        charState = 'idle';
      } else if (s.gameState === 'gameover') {
        charState = 'crashed';
      } else if (s.isJumping) {
        charState = 'jumping';
      } else if (s.isDucking) {
        charState = 'ducking';
      }

      drawCharacter(
        ctx,
        character,
        s.x,
        s.y,
        charState,
        s.runFrame,
        palette.dino
      );

      // 10. Canvas HUD: Ammo Indicators (3 Bullets Power)
      const ammoX = 20;
      const ammoY = 56;
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.textBaseline = 'top';
      ctx.fillStyle = s.ammo > 0 ? (currentIsNight ? '#fbbf24' : '#d97706') : '#ef4444';
      ctx.fillText(`AMMO:`, ammoX, ammoY);

      // Draw 3 bullet capsules on canvas
      for (let i = 0; i < s.maxAmmo; i++) {
        const slotX = ammoX + 55 + i * 16;
        const slotY = ammoY - 1;
        if (i < s.ammo) {
          // Loaded bullet
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(slotX, slotY, 11, 10);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(slotX + 8, slotY + 2, 3, 6);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(slotX + 2, slotY + 2, 2, 6);
        } else {
          // Empty slot outline
          ctx.strokeStyle = currentIsNight ? '#4b5563' : '#9ca3af';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(slotX, slotY, 11, 10);
        }
      }

      ctx.fillStyle = currentIsNight ? '#9ca3af' : '#71717a';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText(`(${s.ammo}/3)`, ammoX + 110, ammoY + 1);

      // 11. Score HUD (High Score + Current Score in 5-digit format)
      ctx.font = '13px "Press Start 2P", monospace';
      ctx.textBaseline = 'top';

      const formatScore = (val: number) => String(Math.floor(val)).padStart(5, '0');
      const scoreStr = formatScore(s.score);
      const hiStr = formatScore(s.highScore);

      let showCurrentScore = true;
      if (time < s.milestoneFlashUntil) {
        const blinkCycle = Math.floor((time / 150) % 2);
        showCurrentScore = blinkCycle === 0;
      }

      ctx.fillStyle = palette.textMuted;
      ctx.fillText(`HI ${hiStr}`, width - 210, 20);

      ctx.fillStyle = palette.text;
      if (showCurrentScore) {
        ctx.fillText(scoreStr, width - 75, 20);
      }

      // 12. Game Over Banner
      if (s.gameState === 'gameover') {
        ctx.fillStyle = palette.text;
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('G A M E  O V E R', width / 2, height / 2 - 45);

        const restartX = width / 2;
        const restartY = height / 2 + 5;

        ctx.strokeStyle = palette.text;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(restartX, restartY, 14, 0.4 * Math.PI, 1.8 * Math.PI);
        ctx.stroke();

        ctx.fillStyle = palette.text;
        ctx.beginPath();
        ctx.moveTo(restartX + 10, restartY - 14);
        ctx.lineTo(restartX + 16, restartY - 8);
        ctx.lineTo(restartX + 6, restartY - 8);
        ctx.fill();

        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText('PRESS SPACE TO RESTART', width / 2, restartY + 36);
        ctx.textAlign = 'start';
      }

      // 13. Idle prompt
      if (s.gameState === 'idle') {
        ctx.fillStyle = palette.textMuted;
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PRESS SPACE OR TAP TO JUMP', width / 2, height / 2 - 15);
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText('POWER: PRESS F OR [SHOOT] TO FIRE (3 BULLETS)', width / 2, height / 2 + 10);
        ctx.textAlign = 'start';
      }

      // 14. Paused banner
      if (s.gameState === 'paused') {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#ffffff';
        ctx.font = '15px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', width / 2, height / 2 - 20);
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillText('PRESS P TO RESUME', width / 2, height / 2 + 10);
        ctx.textAlign = 'start';
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [themeMode, isNight, character, initDecor, onStatsUpdate]);

  // Handle canvas click / tap
  const handleCanvasInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (gameState === 'idle' || gameState === 'gameover') {
      startGame();
    } else if (gameState === 'running') {
      triggerJump();
    }
  };

  const handleMuteToggle = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="flex flex-col items-center w-full" ref={containerRef}>
      {/* Game Canvas Container */}
      <div className="relative w-full rounded border border-[#d1d5db] dark:border-[#3c4043] overflow-hidden shadow-xs bg-[#f7f7f7] dark:bg-[#202124] transition-colors">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasInteraction}
          className="w-full h-[380px] cursor-pointer block select-none"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Floating Quick Action Controls Bar (Top Left) */}
        <div className="absolute top-2 left-3 flex items-center gap-1.5 z-10">
          <button
            onClick={onOpenCharacterModal}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-white/90 dark:bg-[#303134]/90 hover:bg-white dark:hover:bg-[#3c4043] border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Change or upload character"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>Character: <strong className="font-semibold">{character.name}</strong></span>
          </button>

          {/* Desktop On-Canvas Shoot Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerShoot();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border shadow-2xs transition-all active:scale-95 cursor-pointer ${
              ammo > 0
                ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/50 text-amber-800 dark:text-amber-300'
                : 'bg-gray-200/80 dark:bg-neutral-800/80 border-gray-300 dark:border-neutral-700 text-gray-400 dark:text-neutral-500 cursor-not-allowed'
            }`}
            title="Shoot obstacle (Press F, Z, or Shift)"
          >
            <Zap className={`w-3.5 h-3.5 ${ammo > 0 ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-gray-400'}`} />
            <span>Shoot ({ammo}/3)</span>
            <kbd className="hidden sm:inline px-1 bg-black/10 dark:bg-white/10 rounded text-[10px]">F</kbd>
          </button>

          <button
            onClick={handleMuteToggle}
            className="p-1.5 bg-white/90 dark:bg-[#303134]/90 hover:bg-white dark:hover:bg-[#3c4043] border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 shadow-2xs transition-colors cursor-pointer"
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onToggleTheme}
            className="p-1.5 bg-white/90 dark:bg-[#303134]/90 hover:bg-white dark:hover:bg-[#3c4043] border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 shadow-2xs transition-colors cursor-pointer"
            title="Toggle Day/Night mode"
            aria-label="Toggle theme mode"
          >
            {isNight ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Mobile On-Screen Action Overlay Controls (Visible on Touch devices) */}
        <div className="md:hidden flex justify-between items-center px-4 py-2 bg-gray-100/90 dark:bg-neutral-800/90 border-t border-gray-200 dark:border-neutral-700 select-none">
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              startDuck();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              endDuck();
            }}
            onMouseDown={startDuck}
            onMouseUp={endDuck}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-200 dark:bg-neutral-700 active:bg-gray-300 dark:active:bg-neutral-600 rounded font-mono text-xs text-gray-800 dark:text-gray-100 font-bold active:scale-95 transition-transform"
          >
            <ArrowDown className="w-4 h-4" />
            DUCK
          </button>

          <button
            onTouchStart={(e) => {
              e.preventDefault();
              triggerShoot();
            }}
            onClick={triggerShoot}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded font-mono text-xs font-bold active:scale-95 transition-transform shadow-xs ${
              ammo > 0
                ? 'bg-amber-600 active:bg-amber-700 text-white'
                : 'bg-neutral-400 dark:bg-neutral-700 text-neutral-200'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
            SHOOT ({ammo}/3)
          </button>

          <button
            onTouchStart={(e) => {
              e.preventDefault();
              triggerJump();
            }}
            onClick={triggerJump}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-800 text-white dark:bg-emerald-600 dark:text-white active:scale-95 rounded font-mono text-xs font-bold transition-transform shadow-xs"
          >
            <ArrowUp className="w-4 h-4" />
            JUMP
          </button>
        </div>
      </div>

      {/* Control Hint Bar Below Canvas */}
      <div className="flex flex-wrap items-center justify-between w-full mt-3 text-xs text-gray-500 dark:text-gray-400 font-mono px-1 gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded text-[11px]">Space</kbd> / <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded text-[11px]">↑</kbd> Jump</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded text-[11px]">↓</kbd> Duck</span>
          <span className="text-amber-600 dark:text-amber-400 font-semibold"><kbd className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded text-[11px] text-amber-800 dark:text-amber-300">F</kbd> / <kbd className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded text-[11px] text-amber-800 dark:text-amber-300">Z</kbd> Shoot (3 bullets)</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded text-[11px]">P</kbd> Pause</span>
        </div>

        <div className="flex items-center gap-2">
          {gameState === 'running' && (
            <button
              onClick={togglePause}
              className="text-xs hover:text-gray-900 dark:hover:text-gray-200 underline cursor-pointer"
            >
              Pause
            </button>
          )}
          {gameState === 'gameover' && (
            <button
              onClick={startGame}
              className="flex items-center gap-1 text-xs font-semibold text-gray-800 dark:text-gray-100 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Play Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

