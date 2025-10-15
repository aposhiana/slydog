// Clue graph validation functions for data-driven levels

/**
 * Validate a clue graph to check for cycles and missing dependencies
 * @param {Object} clues - Object containing clue definitions
 * @returns {Object} - Validation result with isValid flag and errors array
 */
export function validateClueGraph(clues) {
  const errors = [];
  const visited = new Set();
  const recursionStack = new Set();
  
  // Check each clue
  for (const [clueId, clue] of Object.entries(clues)) {
    // Validate clue structure
    if (!clue.id) {
      errors.push(`Clue ${clueId} is missing required 'id' field`);
      continue;
    }
    
    if (!clue.description) {
      errors.push(`Clue ${clueId} is missing required 'description' field`);
      continue;
    }
    
    if (!Array.isArray(clue.dependencies)) {
      errors.push(`Clue ${clueId} has invalid 'dependencies' field (must be array)`);
      continue;
    }
    
    // Check if dependencies exist
    for (const depId of clue.dependencies) {
      if (!clues[depId]) {
        errors.push(`Clue ${clueId} depends on non-existent clue: ${depId}`);
      }
    }
    
    // Check for cycles using DFS
    if (!visited.has(clueId)) {
      if (hasCycle(clueId, clues, visited, recursionStack)) {
        errors.push(`Circular dependency detected involving clue: ${clueId}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check for cycles in the clue graph using DFS
 * @param {string} clueId - Current clue being visited
 * @param {Object} clues - All clues
 * @param {Set} visited - Set of visited clues
 * @param {Set} recursionStack - Set of clues in current recursion path
 * @returns {boolean} - True if cycle detected
 */
function hasCycle(clueId, clues, visited, recursionStack) {
  visited.add(clueId);
  recursionStack.add(clueId);
  
  const clue = clues[clueId];
  if (clue && clue.dependencies) {
    for (const depId of clue.dependencies) {
      if (!visited.has(depId)) {
        if (hasCycle(depId, clues, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(depId)) {
        return true;
      }
    }
  }
  
  recursionStack.delete(clueId);
  return false;
}

/**
 * Check if a clue can be granted based on owned clues
 * @param {string} clueId - The clue ID to check
 * @param {Object} clues - All clues
 * @param {Set} ownedClues - Set of owned clue IDs
 * @returns {boolean} - True if clue can be granted
 */
export function canGrantClue(clueId, clues, ownedClues) {
  const clue = clues[clueId];
  if (!clue) {
    return false;
  }
  
  // Check if all dependencies are satisfied
  return clue.dependencies.every(depId => ownedClues.has(depId));
}

/**
 * Get a hint for a clue that can't be granted yet
 * @param {string} clueId - The clue ID
 * @param {Object} clues - All clues
 * @param {Set} ownedClues - Set of owned clue IDs
 * @returns {string} - Hint message
 */
export function getClueHint(clueId, clues, ownedClues) {
  const clue = clues[clueId];
  if (!clue) {
    return "This clue is not available.";
  }
  
  // Find missing dependencies
  const missingDeps = clue.dependencies.filter(depId => !ownedClues.has(depId));
  
  if (missingDeps.length === 0) {
    return clue.hint || "This clue should be available now.";
  }
  
  // Return a hint about missing dependencies
  if (clue.hint) {
    return clue.hint;
  }
  
  return `You need to gather more information first. Missing: ${missingDeps.join(', ')}`;
}
