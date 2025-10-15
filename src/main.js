import { startGameLoop } from './engine/loop.js';
import { input } from './engine/input.js';
import { Renderer } from './engine/renderer.js';
import { World } from './game/world.js';
import { Player } from './game/player.js';
import { GameState, resetForNewLevel, markGameComplete } from './game/game_state.js';
import { DialogueSystem } from './game/dialogue.js';
import { HUD } from './game/hud.js';
import { loadLevel, levelExists } from './game/level_loader.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './shared/constants.js';

// Get canvas element
const canvas = document.getElementById('gameCanvas');
if (!canvas) {
  throw new Error('Canvas element not found');
}

// Set canvas size dynamically based on constants
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
console.log(`🎨 Canvas size set to: ${CANVAS_WIDTH}x${CANVAS_HEIGHT}`);

// Initialize game systems
const world = new World();
const player = new Player(2, 2); // Default position, will be set by level data
const renderer = new Renderer(canvas);
const dialogueSystem = new DialogueSystem(canvas);
const hud = new HUD();

// Current level ID
let currentLevelId = 'level_1';

// Load and initialize a level
async function initializeLevel(levelId) {
  try {
    console.log(`🚂 TRAIN MYSTERY GAME - Loading Level ${levelId} 🚂`);
    
    // Load level data
    const levelData = await loadLevel(levelId);
    
    // Initialize world with level data
    world.initializeLevel(levelData);
    
    // Reset game state for new level
    resetForNewLevel(levelData);
    
    // Update player position
    player.setPosition(GameState.playerPos.x, GameState.playerPos.y);
    
    console.log(`✅ Level ${levelId} initialized successfully!`);
    console.log(`📊 ${levelData.npcs.length} NPCs, ${Object.keys(levelData.clues).length} clues`);
    
  } catch (error) {
    console.error(`❌ Failed to initialize level ${levelId}:`, error);
    throw error;
  }
}

// Handle function calls from ChatGPT
async function handleFunctionCalls(toolCalls, npc) {
  console.log(`🔧 Processing ${toolCalls.length} function call(s) from ${npc.name || 'NPC'}`);
  
  const { grantClue } = await import('./game/game_functions.js');
  
  for (const toolCall of toolCalls) {
    console.log(`📞 Function call: ${toolCall.function.name}`, toolCall.function.arguments);
    
    if (toolCall.function.name === 'grantClue') {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        console.log(`🎯 Attempting to grant clue: ${args.clueId} (reason: "${args.reason}")`);
        
        const result = grantClue(args.clueId, args.reason);
        
        if (result.success) {
          console.log(`✅ Clue granted successfully: ${args.clueId} - ${args.reason}`);
          console.log(`📊 Total clues owned: ${GameState.ownedClues.size}`);
          
          // Check if this was the final clue
          world.checkLevelComplete(GameState.ownedClues);
          if (world.checkLevelComplete(GameState.ownedClues)) {
            console.log(`🏆 Level complete! Victory condition met.`);
            GameState.shouldCheckVictoryOnDialogueEnd = true;
          }
        } else {
          console.log(`❌ Failed to grant clue: ${result.message}`);
        }
      } catch (error) {
        console.error('❌ Error executing grantClue function:', error);
      }
    } else {
      console.log(`⚠️ Unknown function call: ${toolCall.function.name}`);
    }
  }
}

// Handle level completion and progression
async function handleLevelCompletion() {
  // Check if current level is complete
  const isComplete = world.checkLevelComplete(GameState.ownedClues);
  
  if (isComplete) {
    console.log(`🏆 Level ${currentLevelId} completed!`);
    
    // Check if there's a next level
    if (world.hasNextLevel()) {
      const nextLevelId = world.getNextLevel();
      console.log(`➡️ Advancing to ${nextLevelId}...`);
      
      try {
        // Load next level
        currentLevelId = nextLevelId;
        await initializeLevel(nextLevelId);
      } catch (error) {
        console.error(`❌ Failed to load next level ${nextLevelId}:`, error);
        // Fall back to restarting current level
        await initializeLevel(currentLevelId);
      }
    } else {
      // No more levels - game complete
      console.log(`🎉 Game complete! No more levels.`);
      markGameComplete();
    }
  }
}

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
  if (e.key === 'r' && (GameState.isLevelComplete || GameState.isGameComplete)) {
    console.log('🔄 Restart key pressed!');
    restartCurrentLevel();
    e.preventDefault();
    return;
  }
  
  // Handle clues display toggle (only when not in dialogue)
  if ((e.key === 'c' || e.key === 'C') && !GameState.isInDialogue) {
    console.log('📋 Clues display toggled!');
    hud.toggleClues();
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
          
          // Use function calling for dialogue
          npc.continueDialogue(message, world.getClues(), GameState.ownedClues).then(response => {
            // Display the NPC's response
            dialogueSystem.continueDialogue(response.content);
            
            // Handle any function calls
            if (response.tool_calls && response.tool_calls.length > 0) {
              console.log(`🤖 ChatGPT returned ${response.tool_calls.length} function call(s)`);
              handleFunctionCalls(response.tool_calls, npc);
            } else {
              console.log(`💬 ChatGPT response (no function calls)`);
            }
          }).catch(error => {
            console.error('❌ Error in dialogue:', error);
            dialogueSystem.continueDialogue("I'm having trouble responding right now.");
          });
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
  if (e.key === 'r' && (GameState.isLevelComplete || GameState.isGameComplete)) {
    console.log('🔄 Global restart key pressed!');
    restartCurrentLevel();
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
      
      // Check for victory condition when dialogue ends
      if (GameState.shouldCheckVictoryOnDialogueEnd) {
        GameState.shouldCheckVictoryOnDialogueEnd = false;
        handleLevelCompletion();
      }
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
      npc.startDialogue('', world.getClues(), GameState.ownedClues).then(response => {
        dialogueSystem.startDialogue(npc, response.content);
        
        // Handle any function calls
        if (response.tool_calls && response.tool_calls.length > 0) {
          console.log(`🤖 ChatGPT returned ${response.tool_calls.length} function call(s) on dialogue start`);
          handleFunctionCalls(response.tool_calls, npc);
        } else {
          console.log(`💬 ChatGPT response on dialogue start (no function calls)`);
        }
      });
    }
  }
  
  // Update player animation
  player.update(dt, world);
  
  // Update dialogue system
  dialogueSystem.update(dt);
  
  // Update HUD with current clues
  hud.updateClues(GameState.ownedClues, world.getClues());
  
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
  
  // Render HUD on top
  hud.render(renderer.ctx, GameState);
}

// Initialize and start the game
async function init() {
  console.log('🚂 TRAIN MYSTERY GAME - Initializing... 🚂');
  
  try {
    // Load first level
    await initializeLevel(currentLevelId);
    
    // Start the game loop
    startGameLoop(update, render);
    
    console.log('✅ Game started successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize game:', error);
  }
}

// Restart current level function
async function restartCurrentLevel() {
  console.log(`🔄 Restarting level ${currentLevelId}...`);
  
  try {
    // Reinitialize current level
    await initializeLevel(currentLevelId);
    
    // End any active dialogue
    dialogueSystem.endDialogue();
    
    // Clear text input buffer
    textInputBuffer = '';
    isDialogueInputActive = false;
    
    console.log(`✅ Level ${currentLevelId} restarted!`);
  } catch (error) {
    console.error(`❌ Failed to restart level ${currentLevelId}:`, error);
  }
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