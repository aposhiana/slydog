// LevelLoader module - handles dynamic loading of levels and NPCs

import { NPC } from './npc.js';
import { validateClueGraph } from './clue_graph.js';

/**
 * Loads a level from JSON and initializes all game data
 * @param {string} levelId - The level ID to load (e.g., 'level_1')
 * @returns {Promise<Object>} - Level data with loaded NPCs
 */
export async function loadLevel(levelId) {
  try {
    console.log(`🔄 Loading level: ${levelId}`);
    
    // Load level JSON
    const levelData = await loadJSON(`/src/levels/${levelId}.json`);
    
    // Load NPC character data
    const npcCharacters = await loadNPCCharacters(levelData.npcs);
    
    // Create NPC instances with positions and clues
    const npcs = createNPCs(levelData.npcs, npcCharacters);
    
    // Validate clue graph
    const clueValidation = validateClueGraph(levelData.clues);
    if (!clueValidation.isValid) {
      throw new Error(`Invalid clue graph in ${levelId}: ${clueValidation.errors.join(', ')}`);
    }
    
    console.log(`✅ Level ${levelId} loaded successfully`);
    console.log(`📊 NPCs: ${npcs.length}, Clues: ${Object.keys(levelData.clues).length}`);
    
    return {
      ...levelData,
      npcs,
      npcCharacters
    };
    
  } catch (error) {
    console.error(`❌ Failed to load level ${levelId}:`, error);
    throw error;
  }
}

/**
 * Load JSON file from URL
 * @param {string} url - URL to load
 * @returns {Promise<Object>} - Parsed JSON data
 */
async function loadJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Load NPC character data for all NPCs in the level
 * @param {Array} npcData - NPC data from level JSON
 * @returns {Promise<Object>} - Map of character_id to character data
 */
async function loadNPCCharacters(npcData) {
  const characterIds = [...new Set(npcData.map(npc => npc.character_id))];
  const characters = {};
  
  // Load each unique character
  for (const characterId of characterIds) {
    try {
      const characterData = await loadJSON(`/src/npc_characters/${characterId}.json`);
      characters[characterId] = characterData;
      console.log(`📝 Loaded NPC character: ${characterData.name}`);
    } catch (error) {
      console.error(`❌ Failed to load NPC character ${characterId}:`, error);
      throw error;
    }
  }
  
  return characters;
}

/**
 * Create NPC instances from level data and character data
 * @param {Array} npcData - NPC data from level JSON
 * @param {Object} npcCharacters - Character data loaded from JSON files
 * @returns {Array<NPC>} - Array of NPC instances
 */
function createNPCs(npcData, npcCharacters) {
  return npcData.map(npc => {
    const character = npcCharacters[npc.character_id];
    if (!character) {
      throw new Error(`Character ${npc.character_id} not found in loaded characters`);
    }
    
    return new NPC(
      npc.character_id,
      npc.position[0], // gridX
      npc.position[1], // gridY
      character.color,
      character.name,
      character.persona,
      npc.clue_id, // clueId
      npc.character_id, // characterId for sprite lookup
      character.avatar // avatar filename
    );
  });
}

/**
 * Get list of available levels
 * @returns {Promise<Array<string>>} - Array of level IDs
 */
export async function getAvailableLevels() {
  // For now, return hardcoded list. In a real game, this could scan the directory
  return ['level_1', 'level_2', 'level_3', 'level_4'];
}

/**
 * Check if a level exists
 * @param {string} levelId - Level ID to check
 * @returns {Promise<boolean>} - True if level exists
 */
export async function levelExists(levelId) {
  try {
    const levels = await getAvailableLevels();
    return levels.includes(levelId);
  } catch (error) {
    console.error('Error checking if level exists:', error);
    return false;
  }
}
