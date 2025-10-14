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
        }
        
        this.ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
        
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
    
    // Draw player as a circle
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
  render(world, player, showDebug = true) {
    this.clear();
    this.updateCamera(player.pixelX, player.pixelY);
    this.renderWorld(world);
    this.renderPlayer(player);
    
    if (showDebug) {
      this.renderDebug(player, world);
    }
  }
}
