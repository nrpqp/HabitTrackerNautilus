export const MAX_HABITS = 7;
export const TOTAL_DAYS = 21;
export const MAX_NAME_LENGTH = 15;

export const startAngle = -90;
export const sweepAngle = 300;
export const innerRadius = 60;
export const cellThickness = 24;
export const gapBetweenRings = 3;
export const svgPadding = 40;
export const DEG = Math.PI / 180;

export const DEFAULT_COLORS = [
  '#e74c3c',
  '#3498db',
  '#2ecc71',
  '#f39c12',
  '#9b59b6',
  '#1abc9c',
  '#e84393',
];

export const ELEMENTS = [
  { id: 'fire',      name: 'Fuego',  icon: '🔥', h0: 10,  s0: 70, l0: 55, h1: 35,  s1: 100, l1: 48, rgb: [255, 107, 53],  particleType: 'spark',   speed: 1.5,  gravity: 0.07,  upward: true,   drag: 0.975, lifeScale: 1,    sizeScale: 1 },
  { id: 'water',     name: 'Agua',   icon: '💧', h0: 200, s0: 55, l0: 60, h1: 195, s1: 90,  l1: 38, rgb: [0, 180, 216],   particleType: 'ripple',  speed: 0.9,  gravity: -0.02, upward: false, drag: 0.930, lifeScale: 1,    sizeScale: 1 },
  { id: 'plant',     name: 'Planta', icon: '🌿', h0: 140, s0: 45, l0: 55, h1: 120, s1: 80,  l1: 33, rgb: [82, 183, 136],  particleType: 'leaf',    speed: 0.8,  gravity: -0.03, upward: false, drag: 0.985, lifeScale: 1,    sizeScale: 1 },
  { id: 'lightning', name: 'Rayo',   icon: '⚡', h0: 48,  s0: 80, l0: 60, h1: 55,  s1: 100, l1: 50, rgb: [255, 214, 10],  particleType: 'bolt',    speed: 3.0,  gravity: 0,     upward: false, drag: 0.995, lifeScale: 0.42, sizeScale: 0.8 },
  { id: 'ice',       name: 'Hielo',  icon: '❄️', h0: 195, s0: 40, l0: 75, h1: 190, s1: 70,  l1: 55, rgb: [168, 218, 220], particleType: 'crystal', speed: 0.7,  gravity: 0.02,  upward: false, drag: 0.975, lifeScale: 1.1,  sizeScale: 1 },
  { id: 'earth',     name: 'Tierra', icon: '🪨', h0: 30,  s0: 45, l0: 55, h1: 25,  s1: 65,  l1: 35, rgb: [196, 154, 108], particleType: 'chunk',   speed: 1.1,  gravity: 0.18,  upward: false, drag: 0.990, lifeScale: 0.9,  sizeScale: 1 },
  { id: 'air',       name: 'Aire',   icon: '💨', h0: 270, s0: 40, l0: 75, h1: 265, s1: 65,  l1: 55, rgb: [199, 125, 255], particleType: 'swirl',   speed: 0.65, gravity: -0.04, upward: false, drag: 0.980, lifeScale: 1.15, sizeScale: 1 },
];
