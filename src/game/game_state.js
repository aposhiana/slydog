export const GameState = {
  levelId: "level_1",
  playerPos: { x: 2, y: 2 },
  clues: new Set(),
  
  // Dialogue state
  isInDialogue: false,
  currentNPC: null,
  dialogueHistory: [],
  
  // Interaction state
  nearbyNPCs: [],
  canInteract: false,
};
