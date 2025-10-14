// Clue graph system for managing clue dependencies and validation

/**
 * Validates a clue graph to ensure no cycles and all dependencies exist
 * @param {Object} clues - Object mapping clue IDs to clue objects
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateClueGraph(clues) {
  const errors = [];
  const clueIds = Object.keys(clues);
  
  // Check that all dependencies exist
  for (const [clueId, clue] of Object.entries(clues)) {
    if (clue.dependencies) {
      for (const depId of clue.dependencies) {
        if (!clueIds.includes(depId)) {
          errors.push(`Clue "${clueId}" depends on non-existent clue "${depId}"`);
        }
      }
    }
  }
  
  // Check for cycles using DFS
  const visited = new Set();
  const recursionStack = new Set();
  
  function hasCycle(clueId) {
    if (recursionStack.has(clueId)) {
      return true; // Cycle detected
    }
    
    if (visited.has(clueId)) {
      return false; // Already processed
    }
    
    visited.add(clueId);
    recursionStack.add(clueId);
    
    const clue = clues[clueId];
    if (clue && clue.dependencies) {
      for (const depId of clue.dependencies) {
        if (hasCycle(depId)) {
          return true;
        }
      }
    }
    
    recursionStack.delete(clueId);
    return false;
  }
  
  // Check each clue for cycles
  for (const clueId of clueIds) {
    if (hasCycle(clueId)) {
      errors.push(`Circular dependency detected involving clue "${clueId}"`);
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Checks if a clue can be granted based on owned clues
 * @param {string} clueId - The clue ID to check
 * @param {Object} clues - Object mapping clue IDs to clue objects
 * @param {Set} ownedClues - Set of owned clue IDs
 * @returns {boolean} - True if clue can be granted
 */
export function canGrantClue(clueId, clues, ownedClues) {
  const clue = clues[clueId];
  if (!clue) {
    console.warn(`Clue "${clueId}" not found in clue graph`);
    return false;
  }
  
  // If already owned, can't grant again
  if (ownedClues.has(clueId)) {
    return false;
  }
  
  // Check dependencies
  if (clue.dependencies && clue.dependencies.length > 0) {
    for (const depId of clue.dependencies) {
      if (!ownedClues.has(depId)) {
        return false; // Missing dependency
      }
    }
  }
  
  return true;
}

/**
 * Gets a hint message for a clue that can't be granted yet
 * @param {string} clueId - The clue ID to get hint for
 * @param {Object} clues - Object mapping clue IDs to clue objects
 * @param {Set} ownedClues - Set of owned clue IDs
 * @returns {string} - Hint message
 */
export function getClueHint(clueId, clues, ownedClues) {
  const clue = clues[clueId];
  if (!clue) {
    return "This clue is not available.";
  }
  
  // If already owned
  if (ownedClues.has(clueId)) {
    return "You already have this clue.";
  }
  
  // Check what dependencies are missing
  if (clue.dependencies && clue.dependencies.length > 0) {
    const missingDeps = clue.dependencies.filter(depId => !ownedClues.has(depId));
    if (missingDeps.length > 0) {
      const missingClueNames = missingDeps.map(depId => clues[depId]?.name || depId);
      return `You need to investigate ${missingClueNames.join(' and ')} first.`;
    }
  }
  
  return clue.hint || "This clue is not available yet.";
}

/**
 * Default clue data for level 1 - linear chain A → B → C
 */
export const LEVEL_1_CLUES = {
  clue_a: {
    id: 'clue_a',
    name: 'Conductor\'s Schedule',
    description: 'The conductor\'s schedule shows an unusual delay at the last stop.',
    hint: 'Talk to the conductor to learn about the train schedule.',
    dependencies: [] // No dependencies - first clue
  },
  clue_b: {
    id: 'clue_b',
    name: 'Passenger\'s Observation',
    description: 'A passenger noticed someone suspicious getting off at the previous station.',
    hint: 'Mrs. Johnson might have seen something interesting.',
    dependencies: ['clue_a'] // Requires clue A
  },
  clue_c: {
    id: 'clue_c',
    name: 'Security Report',
    description: 'The security guard found evidence of tampering in the luggage car.',
    hint: 'Officer Davis has important security information.',
    dependencies: ['clue_b'] // Requires clue B
  }
};

/**
 * Required clues to complete level 1
 */
export const LEVEL_1_REQUIRED_CLUES = ['clue_a', 'clue_b', 'clue_c'];

/**
 * NPC clue mappings for level 1
 */
export const LEVEL_1_NPC_CLUES = {
  'conductor': 'clue_a',
  'passenger': 'clue_b', 
  'guard': 'clue_c'
};
