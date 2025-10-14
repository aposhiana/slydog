// Game constants
export const TILE_SIZE = 32;
export const GRID_W = 20;
export const GRID_H = 12;

// Canvas dimensions
export const CANVAS_WIDTH = GRID_W * TILE_SIZE;
export const CANVAS_HEIGHT = GRID_H * TILE_SIZE;

// Z-layers for rendering order
export const Z_LAYERS = {
  bg: 0,
  world: 1,
  entities: 2,
  ui: 3
};

// Tile types
export const TILE_TYPES = {
  FLOOR: 0,
  WALL: 1
};

// Colors
export const COLORS = {
  FLOOR: '#4a4a4a',
  WALL: '#2a2a2a',
  PLAYER: '#4a9eff',
  GRID: '#333333'
};
