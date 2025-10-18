// Input handling system
class InputManager {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set();
    this.released = new Set();
    this.textBuffer = '';
    this.isTextInputMode = false;
    this.textInputEvent = null;

    this.MOVE_REPEAT_INITIAL_DELAY_MS = 200;
    this.MOVE_REPEAT_INTERVAL_MS = 60;
    
    this.currentHeldDirection = null; 
    this.nextMovementRepeatAt = 0;

    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      // Prevent default browser behavior for game keys
      const gameKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyE', 'Escape'];
      if (gameKeys.includes(e.code)) {
        e.preventDefault();
      }
      
      if (!this.keys.has(e.code)) {
        this.keys.add(e.code);
        this.pressed.add(e.code);
        this._maybeResetRepeatOnDirectionChange();
      }
      
      // Handle text input for dialogue
      if (this.isTextInputMode) {
        if (e.key === 'Enter') {
          this.textInputEvent = 'Enter';
          e.preventDefault();
        } else if (e.key === 'Backspace') {
          this.textInputEvent = 'Backspace';
          e.preventDefault();
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          this.textInputEvent = e.key;
          e.preventDefault();
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      // Prevent default browser behavior for game keys
      const gameKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyE', 'Escape'];
      if (gameKeys.includes(e.code)) {
        e.preventDefault();
      }
      
      this.keys.delete(e.code);
      this.released.add(e.code);
      this._maybeResetRepeatOnDirectionChange();
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
      console.log('Movement: UP');
    } else if (this.isKeyPressed('KeyS') || this.isKeyPressed('ArrowDown')) {
      dy = 1;
      console.log('Movement: DOWN');
    } else if (this.isKeyPressed('KeyA') || this.isKeyPressed('ArrowLeft')) {
      dx = -1;
      console.log('Movement: LEFT');
    } else if (this.isKeyPressed('KeyD') || this.isKeyPressed('ArrowRight')) {
      dx = 1;
      console.log('Movement: RIGHT');
    }

    return { dx, dy };
  }

  // Call this each frame; it returns {dx, dy} when it’s time to move one tile, else {0,0}.
  getMovementRepeatStep(now = performance.now()) {
    const intended = this._getHeldDirection();

    if (!intended) {
      // Nothing held: clear repeat state
      this.currentHeldDirection = null;
      this.nextMovementRepeatAt = 0;
      return { dx: 0, dy: 0 };
    }

    // If direction changed or just started holding, emit an immediate step
    if (this.currentHeldDirection !== intended) {
      this.currentHeldDirection = intended;
      this.nextMovementRepeatAt = now + this.MOVE_REPEAT_INITIAL_DELAY_MS;
      return this._directionToDelta(intended);
    }

    // Same direction is still held: emit on schedule
    if (now >= this.nextMovementRepeatAt) {
      this.nextMovementRepeatAt = now + this.MOVE_REPEAT_INTERVAL_MS;
      return this._directionToDelta(intended);
    }

    // Not yet time for the next step
    return { dx: 0, dy: 0 };
  }

  // Check if interaction key (E) is pressed
  isInteractionPressed() {
    return this.isKeyPressed('KeyE');
  }

  // Get text input (for dialogue)
  getTextInput() {
    return this.textBuffer;
  }

  // Clear text input buffer
  clearTextInput() {
    this.textBuffer = '';
  }

  // Enable/disable text input mode
  setTextInputMode(enabled) {
    this.isTextInputMode = enabled;
    this.textInputEvent = null;
  }

  // Get the latest text input event
  getTextInputEvent() {
    const event = this.textInputEvent;
    if (event) {
      this.textInputEvent = null; // Only clear after successful retrieval
    }
    return event;
  }

  // Clear pressed/released states (call at end of frame)
  update() {
    this.pressed.clear();
    this.released.clear();
  }


  _getHeldDirection() {
    // Priority rule mirrors common grid games: vertical over horizontal, prevents diagonals.
    if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp'))    return 'up';
    if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown'))  return 'down';
    if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft'))  return 'left';
    if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) return 'right';
    return null;
  }

  _directionToDelta(direction) {
    switch (direction) {
      case 'up': return { dx: 0,  dy: -1 };
      case 'down': return { dx: 0, dy: 1 };
      case 'left': return { dx: -1, dy: 0 };
      case 'right': return { dx: 1, dy: 0 };
      default: return { dx: 0, dy: 0 };
    }
  }

  _maybeResetRepeatOnDirectionChange() {
    const intended = this._getHeldDirection();
    if (intended !== this.currentHeldDirection) {
      // I intentionally do not emit a step here.
      // The step will be emitted on the next getMovementRepeatStep() call.
      this.currentHeldDirection = null;
      this.nextMovementRepeatAt = 0;
    }
  }
}

// Export singleton instance
export const input = new InputManager();
