export const GameState = {
  levelId: null, // Will be set when level loads
  playerPos: { x: 2, y: 2 }, // Default start position
  clues: new Set(), // Legacy - keeping for compatibility
  
  // Clue system state
  ownedClues: new Set(),
  isLevelComplete: false,
  victoryMessage: "",
  shouldCheckVictoryOnDialogueEnd: false,
  
  // Level progression state
  isGameComplete: false,
  
  // Dialogue state
  isInDialogue: false,
  currentNPC: null,
  dialogueHistory: [],
  
  // Interaction state
  nearbyNPCs: [],
  canInteract: false,
  
  // Methods
  hasClue(clueId) {
    return this.ownedClues.has(clueId);
  },
  
  grantClue(clueId, metadata = {}) {
    if (!this.ownedClues.has(clueId)) {
      this.ownedClues.add(clueId);
      return true;
    }
    return false;
  }
};

/**
 * Grant a clue to the player
 * @param {string} clueId - The clue ID to grant
 * @param {Object} clues - The clue graph object
 * @returns {boolean} - True if clue was granted successfully
 */
export function grantClue(clueId, clues) {
  if (!GameState.ownedClues.has(clueId)) {
    GameState.ownedClues.add(clueId);
    console.log(`🎯 CLUE GRANTED: ${clues[clueId]?.name || clueId}`);
    console.log(`📝 Description: ${clues[clueId]?.description || 'No description'}`);
    console.log(`🔍 Total clues owned: ${GameState.ownedClues.size}`);
    return true;
  }
  return false;
}

/**
 * Check if player has a specific clue
 * @param {string} clueId - The clue ID to check
 * @returns {boolean} - True if player has the clue
 */
export function hasClue(clueId) {
  return GameState.ownedClues.has(clueId);
}

/**
 * Get all player clues
 * @returns {Array} - Array of owned clue IDs
 */
export function getPlayerClues() {
  return Array.from(GameState.ownedClues);
}

/**
 * Check if level is complete based on required clues
 * @param {Array} requiredClues - Array of required clue IDs
 * @returns {boolean} - True if all required clues are owned
 */
export function checkLevelComplete(requiredClues) {
  if (!requiredClues || requiredClues.length === 0) {
    return false;
  }
  
  const hasAllClues = requiredClues.every(clueId => GameState.ownedClues.has(clueId));
  
  if (hasAllClues && !GameState.isLevelComplete) {
    GameState.isLevelComplete = true;
    GameState.victoryMessage = "🎉 Mystery Solved! 🎉";
    console.log("🏆 VICTORY! All clues collected!");
    console.log("🔍 Final clues:", Array.from(GameState.ownedClues));
  }
  
  return GameState.isLevelComplete;
}

/**
 * Reset game state for a new level
 * @param {Object} levelData - Level data from JSON
 */
export function resetForNewLevel(levelData) {
  console.log(`🔄 Resetting game state for level: ${levelData.id}`);
  
  // Reset level-specific state
  GameState.levelId = levelData.id;
  GameState.ownedClues.clear();
  GameState.isLevelComplete = false;
  GameState.victoryMessage = "";
  GameState.shouldCheckVictoryOnDialogueEnd = false;
  GameState.isGameComplete = false;
  
  // Reset dialogue state
  GameState.isInDialogue = false;
  GameState.currentNPC = null;
  GameState.dialogueHistory = [];
  
  // Reset interaction state
  GameState.nearbyNPCs = [];
  GameState.canInteract = false;
  
  // Set player start position from level data
  GameState.playerPos.x = levelData.player_start[0];
  GameState.playerPos.y = levelData.player_start[1];
  
  console.log(`✅ Game state reset for ${levelData.name}`);
  console.log(`📍 Player start position: (${GameState.playerPos.x}, ${GameState.playerPos.y})`);
}

/**
 * Mark game as complete (no more levels)
 */
export function markGameComplete() {
  GameState.isGameComplete = true;
  GameState.victoryMessage = "🎉 Game Complete! 🎉";
  console.log("🏆 GAME COMPLETE! All levels finished!");
}
