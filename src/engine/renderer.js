import { 
  TILE_SIZE, 
  GRID_W, 
  GRID_H, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  TILE_TYPES,
  COLORS 
} from '../shared/constants.js';

// 2.5D tile dimensions matching pygame implementation
const TILE_WIDTH = 50;
const TILE_HEIGHT = 85; 
const TILE_FLOOR_HEIGHT = 40;

// Renderer class handles all drawing operations
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Camera offset for centering on player
    this.cameraX = 0;
    this.cameraY = 0;
    
    // Load floor tile image (2.5D styled)
    this.floorTileImage = new Image();
    this.floorTileImage.src = 'assets/tiles/floor_tile.png';
    
    // Load chair sprite for seats
    this.chairSprite = new Image();
    this.chairSprite.src = 'assets/tiles/chair_sprite.png';
    
    // Load wall sprites for train borders
    this.wallSpriteLeft = new Image();
    this.wallSpriteLeft.src = 'assets/tiles/wallspriteleft.png';
    this.wallSpriteRight = new Image();
    this.wallSpriteRight.src = 'assets/tiles/wallspriteright.png';

    // Load NPC sprites
    this.npcSprites = {
      monster: new Image(),
      girl: new Image(),
      trenchcoat: new Image(),
      robot: new Image(),
      nervous: new Image(),
      mort: new Image(),
      bug: new Image(),
      corndog_man: new Image(),
      neighmys: new Image(),
      jeengus: new Image(),
      aperturecore: new Image(),
      dorg: new Image(),
      marthastewert: new Image()
    };
    this.npcSprites.monster.src = 'assets/sprites/monster_sprite.png';
    this.npcSprites.girl.src = 'assets/sprites/girl_sprite.png';
    this.npcSprites.trenchcoat.src = 'assets/sprites/trenchcoat_sprite.png';
    this.npcSprites.robot.src = 'assets/sprites/robot_sprite.png';
    this.npcSprites.nervous.src = 'assets/sprites/nervous_sprite.png';
    this.npcSprites.mort.src = 'assets/sprites/mort.png';
    this.npcSprites.bug.src = 'assets/sprites/bug_sprite.png';
    this.npcSprites.corndog_man.src = 'assets/sprites/corndog_man.png';
    this.npcSprites.neighmys.src = 'assets/sprites/neighmys.png';
    this.npcSprites.jeengus.src = 'assets/sprites/jeengus_sprite.png';
    this.npcSprites.aperturecore.src = 'assets/sprites/aperturecore_sprite.png';
    this.npcSprites.dorg.src = 'assets/sprites/dorg.png';
    this.npcSprites.marthastewert.src = 'assets/sprites/girl_sprite.png';

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

  // Render the world tilemap with proper 2.5D layering (pygame-style)
  renderWorld(world) {
    const tilemap = world.getTilemap();
    
    // Calculate which tiles are visible using 2.5D dimensions
    const startX = Math.max(0, Math.floor(this.cameraX / TILE_WIDTH));
    const endX = Math.min(GRID_W, Math.ceil((this.cameraX + CANVAS_WIDTH) / TILE_WIDTH));
    const startY = Math.max(0, Math.floor(this.cameraY / TILE_FLOOR_HEIGHT));
    const endY = Math.min(GRID_H, Math.ceil((this.cameraY + CANVAS_HEIGHT) / TILE_FLOOR_HEIGHT));
    
    // First pass: Render floor tiles and walls (background layer)
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tileType = tilemap[y][x];
        const screenX = x * TILE_WIDTH - this.cameraX;
        const screenY = y * TILE_FLOOR_HEIGHT - this.cameraY;
        
        if (tileType === TILE_TYPES.FLOOR) {
          // Use floor texture if available; fallback to flat color
          if (this.floorTileImage && this.floorTileImage.complete && this.floorTileImage.naturalWidth > 0) {
            this.ctx.drawImage(this.floorTileImage, screenX, screenY, TILE_WIDTH, TILE_HEIGHT);
          } else {
            this.ctx.fillStyle = COLORS.FLOOR;
            this.ctx.fillRect(screenX, screenY, TILE_WIDTH, TILE_HEIGHT);
          }
        } else if (tileType === TILE_TYPES.WALL) {
          this.renderWallTile(screenX, screenY, x, y, tilemap);
        }
      }
    }
    
    // Debug grid removed for cleaner 2.5D look
  }

  // Render wall tile with appropriate left/right sprite
  renderWallTile(screenX, screenY, gridX, gridY, tilemap) {
    // Determine which wall sprite to use based on position
    // For top and bottom rows, alternate between left and right sprites
    // For left and right edges, use left sprite for left edge, right sprite for right edge
    
    let useLeftSprite = true;
    
    // Check if this is a top or bottom row
    const isTopRow = gridY === 0;
    const isBottomRow = gridY === tilemap.length - 1;
    const isLeftEdge = gridX === 0;
    const isRightEdge = gridX === tilemap[0].length - 1;
    
    if (isTopRow || isBottomRow) {
      // For top and bottom rows, alternate between left and right sprites
      useLeftSprite = gridX % 2 === 0;
    } else if (isLeftEdge) {
      // Left edge always uses left sprite
      useLeftSprite = true;
    } else if (isRightEdge) {
      // Right edge always uses right sprite
      useLeftSprite = false;
    } else {
      // Default to left sprite for any other wall tiles
      useLeftSprite = true;
    }
    
    // Choose the appropriate sprite
    const wallSprite = useLeftSprite ? this.wallSpriteLeft : this.wallSpriteRight;
    
    // Draw the wall sprite if available, otherwise fallback to solid color
    if (wallSprite && wallSprite.complete && wallSprite.naturalWidth > 0) {
      this.ctx.drawImage(wallSprite, screenX, screenY, TILE_WIDTH, TILE_HEIGHT);
    } else {
      this.ctx.fillStyle = COLORS.WALL;
      this.ctx.fillRect(screenX, screenY, TILE_WIDTH, TILE_HEIGHT);
    }
  }

  // Render seats with proper 2.5D layering based on player position
  renderSeatsWithLayering(world, player) {
    const tilemap = world.getTilemap();
    const playerGridPos = player.getGridPosition();
    
    // Calculate which tiles are visible using 2.5D dimensions
    const startX = Math.max(0, Math.floor(this.cameraX / TILE_WIDTH));
    const endX = Math.min(GRID_W, Math.ceil((this.cameraX + CANVAS_WIDTH) / TILE_WIDTH));
    const startY = Math.max(0, Math.floor(this.cameraY / TILE_FLOOR_HEIGHT));
    const endY = Math.min(GRID_H, Math.ceil((this.cameraY + CANVAS_HEIGHT) / TILE_FLOOR_HEIGHT));
    
    // First pass: Render seats that are below or at the same level as the player
    for (let y = startY; y <= playerGridPos.y; y++) {
      for (let x = startX; x < endX; x++) {
        const tileType = tilemap[y][x];
        const screenX = x * TILE_WIDTH - this.cameraX;
        const screenY = y * TILE_FLOOR_HEIGHT - this.cameraY;
        
        if (tileType === TILE_TYPES.SEAT) {
          this.renderSeat(screenX, screenY);
        }
      }
    }
    
    // Player will be rendered here (by the main render method)
    
    // Second pass: Render seats that are above the player
    for (let y = playerGridPos.y + 1; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tileType = tilemap[y][x];
        const screenX = x * TILE_WIDTH - this.cameraX;
        const screenY = y * TILE_FLOOR_HEIGHT - this.cameraY;
        
        if (tileType === TILE_TYPES.SEAT) {
          this.renderSeat(screenX, screenY);
        }
      }
    }
  }

  // Helper method to render a single seat
  renderSeat(screenX, screenY) {
    // Use chair sprite if available; fallback to colored rectangles
    if (this.chairSprite && this.chairSprite.complete && this.chairSprite.naturalWidth > 0) {
      this.ctx.drawImage(this.chairSprite, screenX, screenY, TILE_WIDTH, TILE_HEIGHT);
    } else {
      // Fallback: draw seat with colored rectangles
      this.ctx.fillStyle = COLORS.SEAT;
      this.ctx.fillRect(screenX, screenY, TILE_WIDTH, TILE_HEIGHT);
      
      // Draw seat back
      this.ctx.fillStyle = '#8B4513';
      this.ctx.fillRect(screenX + 2, screenY + 2, TILE_WIDTH - 4, 8);
      
      // Draw seat base
      this.ctx.fillStyle = '#654321';
      this.ctx.fillRect(screenX + 2, screenY + 22, TILE_WIDTH - 4, 8);
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
      // Preserve aspect ratio and anchor feet to the tile bottom (2.5D look)
      const spriteW = sprite.naturalWidth;
      const spriteH = sprite.naturalHeight;
      const aspect = spriteW > 0 ? (spriteH / spriteW) : 1;

      // Fit width to tile, compute height from aspect (allows taller than tile)
      const drawW = TILE_WIDTH;
      const drawH = Math.round(drawW * aspect);

      // Bottom-center align: feet at bottom of the tile
      const drawX = screenX + Math.round((TILE_WIDTH - drawW) / 2);
      const drawY = screenY + (TILE_HEIGHT - drawH);

      this.ctx.drawImage(sprite, drawX, drawY, drawW, drawH);
    } else {
      // Fallback to circle while sprites are loading
      this.ctx.fillStyle = COLORS.PLAYER;
      this.ctx.beginPath();
      this.ctx.arc(
        screenX + TILE_WIDTH / 2, 
        screenY + TILE_HEIGHT / 2, 
        TILE_WIDTH / 3, 
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

  // Render NPCs with sprites
  renderNPCs(npcs) {
    npcs.forEach(npc => {
      const pos = npc.getPosition();
      const screenX = pos.x - this.cameraX;
      const screenY = pos.y - this.cameraY;
      
      // Get the appropriate sprite based on character_id
      const characterId = npc.characterId || npc.id;
      const sprite = this.npcSprites[characterId];
      
      // Draw NPC sprite if available, otherwise fallback to colored rectangle
      if (sprite && sprite.complete && sprite.naturalWidth > 0) {
        // Preserve aspect ratio and anchor to bottom of tile (2.5D look)
        const spriteW = sprite.naturalWidth;
        const spriteH = sprite.naturalHeight;
        const aspect = spriteW > 0 ? (spriteH / spriteW) : 1;

        // Fit width to tile, compute height from aspect (allows taller than tile)
        const drawW = TILE_WIDTH;
        const drawH = Math.round(drawW * aspect);

        // Bottom-center align: feet at bottom of the tile
        const drawX = screenX + Math.round((TILE_WIDTH - drawW) / 2);
        const drawY = screenY + (TILE_HEIGHT - drawH);

        this.ctx.drawImage(sprite, drawX, drawY, drawW, drawH);
      } else {
        // Fallback: draw NPC as a colored square
        this.ctx.fillStyle = npc.color;
        this.ctx.fillRect(
          screenX + TILE_WIDTH * 0.2, 
          screenY + TILE_HEIGHT * 0.2, 
          TILE_WIDTH * 0.6, 
          TILE_HEIGHT * 0.6
        );
        
        // Draw NPC border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
          screenX + TILE_WIDTH * 0.2, 
          screenY + TILE_HEIGHT * 0.2, 
          TILE_WIDTH * 0.6, 
          TILE_HEIGHT * 0.6
        );
      }
      
      // Draw NPC name above them
      this.ctx.fillStyle = npc.color;
      this.ctx.font = '10px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        npc.name, 
        screenX + TILE_WIDTH / 2, 
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
    
    // Render seats and objects with proper 2.5D layering
    this.renderSeatsWithLayering(world, player);
    
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
