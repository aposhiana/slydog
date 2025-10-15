import { TILE_TYPES, GRID_W, GRID_H } from '../shared/constants.js';
import { NPC } from './npc.js';
import { checkLevelComplete } from './game_state.js';

// World class manages the tilemap, collision detection, and NPCs
export class World {
  constructor() {
    // Initialize with empty data - will be loaded from level data
    this.tilemap = [];
    this.npcs = [];
    this.clues = {};
    this.requiredClues = [];
    this.currentLevel = null;
    this.nextLevel = null;
  }

  /**
   * Initialize world with level data
   * @param {Object} levelData - Level data loaded from JSON
   */
  initializeLevel(levelData) {
    console.log(`🌍 Initializing world for level: ${levelData.id}`);
    
    // Set level data
    this.currentLevel = levelData.id;
    this.nextLevel = levelData.next_level;
    this.tilemap = levelData.tilemap;
    this.clues = levelData.clues;
    this.requiredClues = levelData.required_clues;
    this.npcs = levelData.npcs; // NPCs are already created by LevelLoader
    
    console.log(`✅ World initialized for ${levelData.name}`);
    console.log(`📊 NPCs: ${this.npcs.length}, Clues: ${Object.keys(this.clues).length}, Required: ${this.requiredClues.length}`);
  }

  // Check if there's a next level available
  hasNextLevel() {
    return this.nextLevel !== null;
  }

  // Get the next level ID
  getNextLevel() {
    return this.nextLevel;
  }

  // Get current level ID
  getCurrentLevel() {
    return this.currentLevel;
  }

  // Check if a position is valid (within bounds and not a wall)
  isValidPosition(x, y) {
    // Check bounds
    if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) {
      return false;
    }
    
    // Check if tile is walkable
    return this.tilemap[y][x] === TILE_TYPES.FLOOR;
  }

  // Get tile type at position
  getTile(x, y) {
    if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) {
      return TILE_TYPES.WALL; // Treat out-of-bounds as walls
    }
    return this.tilemap[y][x];
  }

  // Set tile at position (for future level editing)
  setTile(x, y, tileType) {
    if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) {
      this.tilemap[y][x] = tileType;
    }
  }

  // Get the tilemap for rendering
  getTilemap() {
    return this.tilemap;
  }


  // Get all NPCs
  getNPCs() {
    return this.npcs;
  }

  // Find NPC at a specific grid position
  getNPCAt(x, y) {
    return this.npcs.find(npc => npc.gridX === x && npc.gridY === y);
  }

  // Find NPCs adjacent to a position
  getAdjacentNPCs(x, y) {
    return this.npcs.filter(npc => npc.isAdjacentTo(x, y));
  }

  // Check if a position is valid for NPCs (not occupied by wall or another NPC)
  isValidNPCPosition(x, y) {
    if (!this.isValidPosition(x, y)) {
      return false;
    }
    
    // Check if another NPC is already at this position
    return !this.getNPCAt(x, y);
  }


  // Get clue data
  getClues() {
    return this.clues;
  }

  // Get required clues for this level
  getRequiredClues() {
    return this.requiredClues;
  }

  // Check if level is complete
  checkLevelComplete(ownedClues) {
    return checkLevelComplete(this.requiredClues);
  }
}
