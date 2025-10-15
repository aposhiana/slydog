// src/game/game_functions.js
// Game functions that can be called by ChatGPT via function calling

import { GameState } from './game_state.js';

/**
 * Grant a clue to the player
 * @param {string} clueId - The ID of the clue to grant
 * @param {string} reason - Why this clue is being revealed
 * @returns {Object} Result of the operation
 */
export function grantClue(clueId, reason) {
  console.log(`🎯 grantClue() called with clueId: "${clueId}", reason: "${reason}"`);
  console.log(`📋 Current owned clues before grant:`, Array.from(GameState.ownedClues));
  
  try {
    // Check if clue already owned
    if (GameState.hasClue(clueId)) {
      console.log(`⚠️ Clue ${clueId} already owned by player - skipping grant`);
      return {
        success: false,
        message: `Clue ${clueId} already owned by player`,
        clueId: clueId
      };
    }
    
    // Grant the clue
    console.log(`➕ Granting clue ${clueId} to player...`);
    GameState.grantClue(clueId, {});
    console.log(`✅ Clue ${clueId} successfully added to player inventory`);
    console.log(`📋 Current owned clues after grant:`, Array.from(GameState.ownedClues));
    
    return {
      success: true,
      message: `Clue ${clueId} granted successfully`,
      clueId: clueId,
      reason: reason
    };
    
  } catch (error) {
    console.error('❌ Error in grantClue function:', error);
    return {
      success: false,
      message: `Error granting clue ${clueId}: ${error.message}`,
      clueId: clueId
    };
  }
}

/**
 * Get available clues for an NPC
 * @param {Object} clues - All clues in the level
 * @param {Set} ownedClues - Clues the player already has
 * @param {string} npcClueId - The clue this NPC can provide
 * @returns {Array} Available clues for this NPC
 */
export function getAvailableCluesForNPC(clues, ownedClues, npcClueId) {
  if (!npcClueId) return [];
  
  const availableClues = [];
  const clue = clues[npcClueId];
  
  if (clue && !ownedClues.has(npcClueId)) {
    // Check if dependencies are met
    const dependenciesMet = !clue.dependencies || 
      clue.dependencies.every(depId => ownedClues.has(depId));
    
    if (dependenciesMet) {
      availableClues.push({
        id: npcClueId,
        description: clue.description,
        conversation_lead: clue.conversation_lead
      });
    }
  }
  
  return availableClues;
}

/**
 * Function definitions for OpenAI function calling
 */
export const GAME_FUNCTIONS = [
  {
    type: "function",
    function: {
      name: "grantClue",
      description: "Grant a clue to the player when discussing relevant topics. Use the conversation_lead hints to know when to grant clues.",
      parameters: {
        type: "object",
        properties: {
          clueId: {
            type: "string",
            description: "The ID of the clue to reveal"
          },
          reason: {
            type: "string",
            description: "Why this clue is being revealed (for debugging and context)"
          }
        },
        required: ["clueId", "reason"]
      }
    }
  }
];
