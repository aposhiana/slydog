import { 
  TILE_SIZE, 
  GRID_W, 
  GRID_H, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  TILE_TYPES,
  COLORS 
} from '../shared/constants.js';

// Renderer class handles all drawing operations
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Camera offset for centering on player
    this.cameraX = 0;
    this.cameraY = 0;
    
    // Load dog sprites
    this.dogSprites = {
      front: new Image(),
      back: new Image(),
      left: new Image(),
      right: new Image()
    };
    
    // Set sprite sources
    this.dogSprites.front.src = 'assets/sprites/dogspriteback.png';
    this.dogSprites.back.src = 'assets/sprites/dogspritefront.png';
    this.dogSprites.left.src = 'assets/sprites/dogspriteleft.png';
    this.dogSprites.right.src = 'assets/sprites/dogspriteright.png';
  }

  // Clear the canvas
  clear() {
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // Update camera to center on player
  updateCamera(playerX, playerY) {
    // Center camera on player
    this.cameraX = playerX - CANVAS_WIDTH / 2;
    this.cameraY = playerY - CANVAS_HEIGHT / 2;
  }

  // Render the world tilemap
  renderWorld(world) {
    const tilemap = world.getTilemap();
    
    // Calculate which tiles are visible
    const startX = Math.max(0, Math.floor(this.cameraX / TILE_SIZE));
    const endX = Math.min(GRID_W, Math.ceil((this.cameraX + CANVAS_WIDTH) / TILE_SIZE));
    const startY = Math.max(0, Math.floor(this.cameraY / TILE_SIZE));
    const endY = Math.min(GRID_H, Math.ceil((this.cameraY + CANVAS_HEIGHT) / TILE_SIZE));
    
    // Draw visible tiles
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tileType = tilemap[y][x];
        const screenX = x * TILE_SIZE - this.cameraX;
        const screenY = y * TILE_SIZE - this.cameraY;
        
        // Draw tile
        if (tileType === TILE_TYPES.FLOOR) {
          this.ctx.fillStyle = COLORS.FLOOR;
        } else if (tileType === TILE_TYPES.WALL) {
          this.ctx.fillStyle = COLORS.WALL;
        } else if (tileType === TILE_TYPES.SEAT) {
          this.ctx.fillStyle = COLORS.SEAT;
        }
        
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        
        // Draw seat details
        if (tileType === TILE_TYPES.SEAT) {
          // Draw seat back
          this.ctx.fillStyle = '#8B4513';
          this.ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, 8);
          
          // Draw seat base
          this.ctx.fillStyle = '#654321';
          this.ctx.fillRect(screenX + 2, screenY + 22, TILE_SIZE - 4, 8);
        }
        
        // Draw tile border
        this.ctx.strokeStyle = COLORS.GRID;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  // Render the player
  renderPlayer(player) {
    const pos = player.getPosition();
    const screenX = pos.x - this.cameraX;
    const screenY = pos.y - this.cameraY;
    
    // Get the appropriate dog sprite based on direction
    const sprite = this.dogSprites[player.direction];
    
    // Draw dog sprite if loaded, otherwise fallback to circle
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      this.ctx.drawImage(sprite, screenX, screenY, TILE_SIZE, TILE_SIZE);
    } else {
      // Fallback to circle while sprites are loading
      this.ctx.fillStyle = COLORS.PLAYER;
      this.ctx.beginPath();
      this.ctx.arc(
        screenX + TILE_SIZE / 2, 
        screenY + TILE_SIZE / 2, 
        TILE_SIZE / 3, 
        0, 
        Math.PI * 2
      );
      this.ctx.fill();
      
      // Draw player border
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  // Render NPCs
  renderNPCs(npcs) {
    npcs.forEach(npc => {
      const pos = npc.getPosition();
      const screenX = pos.x - this.cameraX;
      const screenY = pos.y - this.cameraY;
      
      // Draw NPC as a colored square
      this.ctx.fillStyle = npc.color;
      this.ctx.fillRect(
        screenX + TILE_SIZE * 0.2, 
        screenY + TILE_SIZE * 0.2, 
        TILE_SIZE * 0.6, 
        TILE_SIZE * 0.6
      );
      
      // Draw NPC border
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(
        screenX + TILE_SIZE * 0.2, 
        screenY + TILE_SIZE * 0.2, 
        TILE_SIZE * 0.6, 
        TILE_SIZE * 0.6
      );
      
      // Draw NPC name above them
      this.ctx.fillStyle = npc.color;
      this.ctx.font = '10px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        npc.name, 
        screenX + TILE_SIZE / 2, 
        screenY - 5
      );
      this.ctx.textAlign = 'left'; // Reset alignment
    });
  }

  // Render interaction indicator
  renderInteractionIndicator(canInteract) {
    if (canInteract) {
      this.ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
      this.ctx.font = 'bold 12px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        'Press E to talk', 
        CANVAS_WIDTH / 2, 
        30
      );
      this.ctx.textAlign = 'left'; // Reset alignment
    }
  }

  // Render debug information
  renderDebug(player, world) {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px monospace';
    
    const gridPos = player.getGridPosition();
    const pixelPos = player.getPosition();
    
    this.ctx.fillText(`Grid: ${gridPos.x}, ${gridPos.y}`, 10, 20);
    this.ctx.fillText(`Pixel: ${Math.round(pixelPos.x)}, ${Math.round(pixelPos.y)}`, 10, 35);
    this.ctx.fillText(`Moving: ${player.isMoving}`, 10, 50);
    this.ctx.fillText(`Camera: ${Math.round(this.cameraX)}, ${Math.round(this.cameraY)}`, 10, 65);
  }

  // Main render function
  render(world, player, dialogueSystem, gameState, showDebug = true) {
    this.clear();
    this.updateCamera(player.pixelX, player.pixelY);
    this.renderWorld(world);
    this.renderNPCs(world.getNPCs());
    this.renderPlayer(player);
    this.renderInteractionIndicator(gameState.canInteract && !gameState.isInDialogue);
    
    // Render dialogue panel if active
    if (dialogueSystem && dialogueSystem.isDialogueActive()) {
      dialogueSystem.render();
    }
    
    // Render victory overlay if level is complete or game is complete
    if (gameState.isLevelComplete || gameState.isGameComplete) {
      this.renderVictoryOverlay(gameState.victoryMessage, gameState);
    }
    
    if (showDebug) {
      this.renderDebug(player, world);
    }
  }

  // Render victory overlay
  renderVictoryOverlay(message, gameState) {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Victory message background
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const boxWidth = 500;
    const boxHeight = 200;
    
    this.ctx.fillStyle = '#2a4d3a';
    this.ctx.fillRect(centerX - boxWidth/2, centerY - boxHeight/2, boxWidth, boxHeight);
    
    // Border
    this.ctx.strokeStyle = '#4a9eff';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(centerX - boxWidth/2, centerY - boxHeight/2, boxWidth, boxHeight);
    
    // Victory text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 32px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(message, centerX, centerY - 20);
    
          // Subtitle
          this.ctx.font = '16px monospace';
          this.ctx.fillStyle = '#cccccc';
          const subtitle = gameState.isGameComplete ? 
            'All levels completed! Press R to restart' : 
            'All clues collected! Press Enter to continue';
          this.ctx.fillText(subtitle, centerX, centerY + 20);
    
    // Reset text alignment
    this.ctx.textAlign = 'left';
  }
}
