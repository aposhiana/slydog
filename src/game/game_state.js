export const GameState = {
  levelId: "level_1",
  playerPos: { x: 2, y: 2 },
  clues: new Set(), // Legacy - keeping for compatibility
  
  // Clue system state
  ownedClues: new Set(),
  isLevelComplete: false,
  victoryMessage: "",
  shouldCheckVictoryOnDialogueEnd: false,
  
  // Dialogue state
  isInDialogue: false,
  currentNPC: null,
  dialogueHistory: [],
  
  // Interaction state
  nearbyNPCs: [],
  canInteract: false,
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
 * Get all player clues
 * @returns {Array} - Array of owned clue IDs
 */
export function getPlayerClues() {
  return Array.from(GameState.ownedClues);
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
