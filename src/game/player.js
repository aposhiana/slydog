import { TILE_SIZE } from '../shared/constants.js';

// Player class handles position and movement
export class Player {
  constructor(x, y) {
    // Grid position (integer coordinates)
    this.gridX = x;
    this.gridY = y;
    
    // Pixel position (for smooth animation)
    this.pixelX = x * TILE_SIZE;
    this.pixelY = y * TILE_SIZE;
    
    // Target position for smooth movement
    this.targetX = this.pixelX;
    this.targetY = this.pixelY;
    
    // Movement speed (pixels per second)
    this.moveSpeed = 200;
    
    // Whether the player is currently moving
    this.isMoving = false;
  }

  // Update player position and animation
  update(dt, world) {
    // Check if we've reached our target position
    const threshold = 1; // pixels
    const dx = this.targetX - this.pixelX;
    const dy = this.targetY - this.pixelY;
    
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
      // We've reached the target
      this.pixelX = this.targetX;
      this.pixelY = this.targetY;
      this.isMoving = false;
    } else {
      // Move towards target
      this.isMoving = true;
      const moveDistance = this.moveSpeed * dt;
      
      if (Math.abs(dx) > threshold) {
        this.pixelX += Math.sign(dx) * Math.min(moveDistance, Math.abs(dx));
      }
      if (Math.abs(dy) > threshold) {
        this.pixelY += Math.sign(dy) * Math.min(moveDistance, Math.abs(dy));
      }
    }
  }

  // Attempt to move in a direction
  tryMove(dx, dy, world) {
    // Don't allow movement if already moving
    if (this.isMoving) {
      return false;
    }
    
    // Calculate new grid position
    const newGridX = this.gridX + dx;
    const newGridY = this.gridY + dy;
    
    // Check if the new position is valid
    if (world.isValidPosition(newGridX, newGridY)) {
      // Update grid position
      this.gridX = newGridX;
      this.gridY = newGridY;
      
      // Set target pixel position
      this.targetX = this.gridX * TILE_SIZE;
      this.targetY = this.gridY * TILE_SIZE;
      
      return true;
    }
    
    return false;
  }

  // Get current pixel position
  getPosition() {
    return {
      x: this.pixelX,
      y: this.pixelY
    };
  }

  // Get current grid position
  getGridPosition() {
    return {
      x: this.gridX,
      y: this.gridY
    };
  }

  // Set position directly (for initialization)
  setPosition(x, y) {
    this.gridX = x;
    this.gridY = y;
    this.pixelX = x * TILE_SIZE;
    this.pixelY = y * TILE_SIZE;
    this.targetX = this.pixelX;
    this.targetY = this.pixelY;
    this.isMoving = false;
  }
}
