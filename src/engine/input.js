// Input handling system
class InputManager {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set();
    this.released = new Set();
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.code)) {
        this.keys.add(e.code);
        this.pressed.add(e.code);
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      this.released.add(e.code);
    });
  }

  isKeyDown(keyCode) {
    return this.keys.has(keyCode);
  }

  isKeyPressed(keyCode) {
    return this.pressed.has(keyCode);
  }

  isKeyReleased(keyCode) {
    return this.released.has(keyCode);
  }

  // Get movement direction from current key state
  getMovementDirection() {
    let dx = 0;
    let dy = 0;

    // WASD keys
    if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) {
      dy = -1;
    }
    if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) {
      dy = 1;
    }
    if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) {
      dx = -1;
    }
    if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) {
      dx = 1;
    }

    // Prevent diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx = 0;
      dy = 0;
    }

    return { dx, dy };
  }

  // Get movement direction from key press events (for discrete movement)
  getMovementPress() {
    let dx = 0;
    let dy = 0;

    // Check for pressed keys (one-time events)
    if (this.isKeyPressed('KeyW') || this.isKeyPressed('ArrowUp')) {
      dy = -1;
    } else if (this.isKeyPressed('KeyS') || this.isKeyPressed('ArrowDown')) {
      dy = 1;
    } else if (this.isKeyPressed('KeyA') || this.isKeyPressed('ArrowLeft')) {
      dx = -1;
    } else if (this.isKeyPressed('KeyD') || this.isKeyPressed('ArrowRight')) {
      dx = 1;
    }

    return { dx, dy };
  }

  // Clear pressed/released states (call at end of frame)
  update() {
    this.pressed.clear();
    this.released.clear();
  }
}

// Export singleton instance
export const input = new InputManager();
