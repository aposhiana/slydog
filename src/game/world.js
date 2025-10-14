import { TILE_TYPES, GRID_W, GRID_H } from '../shared/constants.js';
import { NPC } from './npc.js';
import { LEVEL_1_CLUES, LEVEL_1_REQUIRED_CLUES, LEVEL_1_NPC_CLUES, validateClueGraph } from './clue_graph.js';
import { checkLevelComplete } from './game_state.js';

// World class manages the tilemap, collision detection, and NPCs
export class World {
  constructor() {
    this.tilemap = this.generatePlaceholderTilemap();
    
    // Initialize clue system first
    this.clues = LEVEL_1_CLUES;
    this.requiredClues = LEVEL_1_REQUIRED_CLUES;
    this.npcClues = LEVEL_1_NPC_CLUES;
    
    // Then generate NPCs (which now have access to clue mappings)
    this.npcs = this.generatePlaceholderNPCs();
    
    // Validate clue graph on load
    this.validateClueSystem();
  }

  // Generate a simple placeholder tilemap
  generatePlaceholderTilemap() {
    const tilemap = [];
    
    for (let y = 0; y < GRID_H; y++) {
      tilemap[y] = [];
      for (let x = 0; x < GRID_W; x++) {
        // Create walls around the border
        if (x === 0 || x === GRID_W - 1 || y === 0 || y === GRID_H - 1) {
          tilemap[y][x] = TILE_TYPES.WALL;
        }
        // Add some interior walls for variety
        else if (
          (x === 5 && y >= 2 && y <= 8) ||
          (x === 15 && y >= 3 && y <= 9) ||
          (y === 6 && x >= 8 && x <= 12)
        ) {
          tilemap[y][x] = TILE_TYPES.WALL;
        }
        // Everything else is floor
        else {
          tilemap[y][x] = TILE_TYPES.FLOOR;
        }
      }
    }
    
    return tilemap;
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

  // Generate placeholder NPCs for testing
  generatePlaceholderNPCs() {
    const npcs = [];
    
    // Conductor NPC - provides clue A
    npcs.push(new NPC(
      'conductor',
      3, 3,
      '#ff6b6b', // Red
      'Conductor Smith',
      'a friendly train conductor who has been working this route for 20 years',
      this.npcClues.conductor // clue_a
    ));
    
    // Passenger NPC - provides clue B
    npcs.push(new NPC(
      'passenger',
      8, 4,
      '#4ecdc4', // Teal
      'Mrs. Johnson',
      'an elderly passenger traveling to visit her grandchildren',
      this.npcClues.passenger // clue_b
    ));
    
    // Chef NPC - no clue
    npcs.push(new NPC(
      'chef',
      16, 7,
      '#45b7d1', // Blue
      'Chef Marco',
      'the train\'s head chef who takes great pride in his culinary skills'
      // No clueId - this NPC doesn't provide clues
    ));
    
    // Guard NPC - provides clue C
    npcs.push(new NPC(
      'guard',
      12, 2,
      '#96ceb4', // Green
      'Officer Davis',
      'a security guard who keeps a watchful eye on the passengers',
      this.npcClues.guard // clue_c
    ));
    
    return npcs;
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

  // Validate the clue system on initialization
  validateClueSystem() {
    const validation = validateClueGraph(this.clues);
    if (!validation.isValid) {
      console.error('❌ Clue graph validation failed:');
      validation.errors.forEach(error => console.error(`  - ${error}`));
      throw new Error('Invalid clue graph configuration');
    }
    console.log('✅ Clue graph validation passed');
    console.log(`🔍 Loaded ${Object.keys(this.clues).length} clues for level ${this.requiredClues.length} required`);
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
