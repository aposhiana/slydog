import { startGameLoop } from './engine/loop.js';
import { input } from './engine/input.js';
import { Renderer } from './engine/renderer.js';
import { World } from './game/world.js';
import { Player } from './game/player.js';
import { GameState } from './game/game_state.js';
import { DialogueSystem } from './game/dialogue.js';

// Get canvas element
const canvas = document.getElementById('gameCanvas');
if (!canvas) {
  throw new Error('Canvas element not found');
}

// Initialize game systems
const world = new World();
const player = new Player(GameState.playerPos.x, GameState.playerPos.y);
const renderer = new Renderer(canvas);
const dialogueSystem = new DialogueSystem(canvas);

// Ensure canvas has focus for keyboard input
canvas.addEventListener('click', () => {
  canvas.focus();
});

// Set tabindex to make canvas focusable
canvas.setAttribute('tabindex', '0');
canvas.focus();

// Simple text input buffer for dialogue
let textInputBuffer = '';
let isDialogueInputActive = false;

// Direct text input handler for dialogue
document.addEventListener('keydown', (e) => {
  // Handle restart key when level is complete (highest priority)
  if (e.key === 'r' && GameState.isLevelComplete) {
    console.log('🔄 Restart key pressed!');
    restartGame();
    e.preventDefault();
    return;
  }
  
  if (isDialogueInputActive && GameState.isInDialogue) {
    if (e.key === 'Enter') {
      if (textInputBuffer.trim()) {
        // Clear the input immediately and disable input display
        const message = textInputBuffer.trim();
        textInputBuffer = '';
        dialogueSystem.hideInput();
        
        // Submit the text and get response
        if (dialogueSystem.currentNPC) {
          const npc = dialogueSystem.currentNPC;
          
          // Check if NPC has a clue to grant
          if (npc.hasClue()) {
            npc.canGrantClue(world.getClues(), GameState.ownedClues).then(canGrant => {
              if (canGrant) {
                // Grant clue and get special response
                npc.grantClue(world.getClues()).then(clueGranted => {
                  if (clueGranted) {
                    // Check if level is complete
                    world.checkLevelComplete(GameState.ownedClues);
                    
                    // Get clue-specific response
                    const clue = world.getClues()[npc.clueId];
                    const clueResponse = `I have something important to tell you: ${clue.description}`;
                    dialogueSystem.continueDialogue(clueResponse);
                  } else {
                    // Normal dialogue
                    npc.continueDialogue(message).then(response => {
                      dialogueSystem.continueDialogue(response);
                    });
                  }
                });
              } else {
                // Show hint for unavailable clue
                npc.getClueHint(world.getClues(), GameState.ownedClues).then(hint => {
                  if (hint) {
                    dialogueSystem.continueDialogue(hint);
                  } else {
                    // Normal dialogue
                    npc.continueDialogue(message).then(response => {
                      dialogueSystem.continueDialogue(response);
                    });
                  }
                });
              }
            });
          } else {
            // Normal dialogue for NPCs without clues
            npc.continueDialogue(message).then(response => {
              dialogueSystem.continueDialogue(response);
            });
          }
        }
      }
      e.preventDefault();
    } else if (e.key === 'Backspace') {
      textInputBuffer = textInputBuffer.slice(0, -1);
      e.preventDefault();
    } else if (e.key === 'ArrowUp' && dialogueSystem.maxScrollOffset > 0) {
      // Scroll up in dialogue
      dialogueSystem.scrollOffset = Math.max(0, dialogueSystem.scrollOffset - 20);
      e.preventDefault();
    } else if (e.key === 'ArrowDown' && dialogueSystem.maxScrollOffset > 0) {
      // Scroll down in dialogue
      dialogueSystem.scrollOffset = Math.min(dialogueSystem.maxScrollOffset, dialogueSystem.scrollOffset + 20);
      e.preventDefault();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      textInputBuffer += e.key;
      e.preventDefault();
    }
  }
});

// Global restart handler (separate from dialogue system)
document.addEventListener('keydown', (e) => {
  if (e.key === 'r' && GameState.isLevelComplete) {
    console.log('🔄 Global restart key pressed!');
    restartGame();
    e.preventDefault();
    return false;
  }
});

// Game state
let gameRunning = true;

// Update function called each frame
function update(dt) {
  if (!gameRunning) return;
  
  // Check for nearby NPCs and interaction
  const playerGridPos = player.getGridPosition();
  const nearbyNPCs = world.getAdjacentNPCs(playerGridPos.x, playerGridPos.y);
  GameState.nearbyNPCs = nearbyNPCs;
  GameState.canInteract = nearbyNPCs.length > 0 && !GameState.isInDialogue;
  
  // Handle input based on game state
  if (GameState.isInDialogue) {
    // Enable text input mode
    isDialogueInputActive = true;
    
    // Handle dialogue input
    if (input.isKeyPressed('Escape')) {
      dialogueSystem.endDialogue();
      GameState.isInDialogue = false;
      GameState.currentNPC = null;
      isDialogueInputActive = false;
      textInputBuffer = '';
    }
    
  } else {
    // Disable text input mode
    isDialogueInputActive = false;
    // Handle movement input - check for newly pressed keys
    let dx = 0, dy = 0;
    
    if (input.isKeyPressed('KeyW') || input.isKeyPressed('ArrowUp')) {
      dy = -1;
    } else if (input.isKeyPressed('KeyS') || input.isKeyPressed('ArrowDown')) {
      dy = 1;
    } else if (input.isKeyPressed('KeyA') || input.isKeyPressed('ArrowLeft')) {
      dx = -1;
    } else if (input.isKeyPressed('KeyD') || input.isKeyPressed('ArrowRight')) {
      dx = 1;
    }
    
    if (dx !== 0 || dy !== 0) {
      player.tryMove(dx, dy, world);
    }
    
    // Handle interaction input
    if (input.isInteractionPressed() && GameState.canInteract) {
      const npc = nearbyNPCs[0]; // Interact with first nearby NPC
      GameState.currentNPC = npc;
      GameState.isInDialogue = true;
      
      // Start dialogue
      npc.startDialogue().then(response => {
        dialogueSystem.startDialogue(npc, response);
      });
    }
  }
  
  // Update player animation
  player.update(dt, world);
  
  // Update dialogue system
  dialogueSystem.update(dt);
  
  // Sync text input buffer with dialogue system
  if (isDialogueInputActive && GameState.isInDialogue) {
    dialogueSystem.setPlayerInput(textInputBuffer);
  }
  
  // Update input system last (clears pressed/released states)
  input.update();
  
  // Update game state
  const gridPos = player.getGridPosition();
  GameState.playerPos.x = gridPos.x;
  GameState.playerPos.y = gridPos.y;
}

// Render function called each frame
function render() {
  if (!gameRunning) return;
  
  renderer.render(world, player, dialogueSystem, GameState, true);
}

// Initialize and start the game
function init() {
  console.log('Initializing Train Mystery Game...');
  console.log('Player starting position:', GameState.playerPos);
  
  // Validate player starting position
  const playerPos = GameState.playerPos;
  const isValidPos = world.isValidPosition(playerPos.x, playerPos.y);
  console.log('Player position valid?', isValidPos);
  
  // Start the game loop
  startGameLoop(update, render);
  
  console.log('Game started successfully!');
}

// Restart game function
function restartGame() {
  console.log('🔄 Restarting game...');
  
  // Reset game state
  GameState.ownedClues.clear();
  GameState.isLevelComplete = false;
  GameState.victoryMessage = '';
  GameState.isInDialogue = false;
  GameState.currentNPC = null;
  
  // Reset player position
  GameState.playerPos.x = 2;
  GameState.playerPos.y = 2;
  player.setPosition(GameState.playerPos.x, GameState.playerPos.y);
  
  // End any active dialogue
  dialogueSystem.endDialogue();
  
  // Clear text input buffer
  textInputBuffer = '';
  isDialogueInputActive = false;
  
  console.log('✅ Game restarted!');
}

// Start the game with error handling
try {
  init();
} catch (error) {
  console.error('Failed to initialize game:', error);
  // Fallback: clear canvas and show error
  const canvas = document.getElementById('gameCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.fillText('Game initialization failed!', 20, 50);
    ctx.fillText('Check console for errors.', 20, 80);
    ctx.fillText('Error: ' + error.message, 20, 110);
  }
}