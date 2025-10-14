import { startGameLoop } from './engine/loop.js';
import { input } from './engine/input.js';
import { Renderer } from './engine/renderer.js';
import { World } from './game/world.js';
import { Player } from './game/player.js';
import { GameState } from './game/game_state.js';

// Get canvas element
const canvas = document.getElementById('gameCanvas');
if (!canvas) {
  throw new Error('Canvas element not found');
}

// Initialize game systems
const world = new World();
const player = new Player(GameState.playerPos.x, GameState.playerPos.y);
const renderer = new Renderer(canvas);

// Game state
let gameRunning = true;

// Update function called each frame
function update(dt) {
  if (!gameRunning) return;
  
  // Handle input
  const movement = input.getMovementPress();
  if (movement.dx !== 0 || movement.dy !== 0) {
    player.tryMove(movement.dx, movement.dy, world);
  }
  
  // Update player animation
  player.update(dt, world);
  
  // Update input system
  input.update();
  
  // Update game state
  const gridPos = player.getGridPosition();
  GameState.playerPos.x = gridPos.x;
  GameState.playerPos.y = gridPos.y;
}

// Render function called each frame
function render() {
  if (!gameRunning) return;
  
  renderer.render(world, player, true);
}

// Initialize and start the game
function init() {
  console.log('🚂 TRAIN MYSTERY GAME - NEW VERSION LOADED! 🚂');
  console.log('Initializing Train Mystery Game...');
  console.log('Controls: WASD or Arrow Keys to move');
  console.log('Player starting position:', GameState.playerPos);
  
  // Start the game loop
  startGameLoop(update, render);
  
  console.log('Game started successfully!');
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