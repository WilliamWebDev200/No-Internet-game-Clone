export interface Character {
  id: string;
  name: string;
  type: 'preset' | 'custom';
  description: string;
  color?: string;
  // If custom image data URL
  customImageUrl?: string;
  // Options for custom image processing
  pixelate?: boolean;
  removeBg?: boolean;
  bgTolerance?: number;
  scale?: number;
  // Custom duck squish ratio
  duckSquish?: number;
}

export type GameState = 'idle' | 'running' | 'paused' | 'gameover';

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'cactus_small' | 'cactus_double' | 'cactus_triple' | 'cactus_large' | 'cactus_large_group' | 'pterodactyl';
  flyHeight?: 'low' | 'mid' | 'high'; // low (must duck or jump), mid (must jump), high (walk under)
  frame?: number;
  speedMultiplier?: number;
}

export interface Cloud {
  x: number;
  y: number;
  speed: number;
  width: number;
}

export interface HorizonDot {
  x: number;
  y: number;
  length: number;
}

export interface Star {
  x: number;
  y: number;
  brightness: number;
  size: number;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  width: number;
  height: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  alpha: number;
  vy: number;
}

export interface GameStats {
  highScore: number;
  totalGames: number;
  totalJumps: number;
  totalDucks: number;
  obstaclesDestroyed?: number;
  longestRunTime: number; // in seconds
  characterUsage: Record<string, number>;
}

