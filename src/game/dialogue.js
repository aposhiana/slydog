import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../shared/constants.js';

// Dialogue system for rendering conversation UI
export class DialogueSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Load avatar images
    this.avatarImages = {};
    this.loadAvatars();
    
    // Dialogue panel dimensions
    this.panelHeight = 200; // Even taller for long responses
    this.panelY = CANVAS_HEIGHT - this.panelHeight;
    this.margin = 20;
    this.textY = this.panelY + 30;
    this.lineHeight = 16; // Slightly smaller line height to fit more text
    
    // Avatar dimensions
    this.avatarSize = 120;
    this.avatarMargin = 15;
    
    // Dialogue state
    this.isActive = false;
    this.currentNPC = null;
    this.currentText = '';
    this.isTyping = false;
    this.typewriterIndex = 0;
    this.typewriterSpeed = 30; // characters per second
    this.lastTypeTime = 0;
    
    // Input state
    this.playerInput = '';
    this.showInput = false;
    this.cursorVisible = true;
    this.cursorBlinkTime = 0;
    this.isWaitingForResponse = false; // Flag to prevent replay during AI response
    
    // Scrolling state
    this.scrollOffset = 0;
    this.maxScrollOffset = 0;
  }

  // Load avatar images
  loadAvatars() {
    const avatarFiles = [
      'girl_avatar.png',
      'monster_avatar.png', 
      'trenchcoat_avatar.png',
      'robot_avatar.png',
      'nervous_avatar.png',
      'neighmys_avatar.png',
      'corndog_man_avatar.png',
      'marthastewart.png'
    ];
    
    avatarFiles.forEach(filename => {
      const img = new Image();
      img.src = `assets/avatars/${filename}`;
      this.avatarImages[filename] = img;
    });
  }

  // Start dialogue with an NPC
  startDialogue(npc, initialText) {
    this.isActive = true;
    this.currentNPC = npc;
    this.currentText = initialText;
    this.isTyping = true;
    this.typewriterIndex = 0;
    this.lastTypeTime = 0;
    this.playerInput = '';
    this.showInput = false;
    this.scrollOffset = 0; // Reset scroll position
    
    // Clear any previous dialogue history for clean display
    this.dialogueHistory = [];
  }

  // Continue dialogue with new text
  continueDialogue(newText) {
    this.currentText = newText;
    this.isTyping = true;
    this.typewriterIndex = 0;
    this.lastTypeTime = 0;
    this.showInput = false;
    this.playerInput = '';
    this.isWaitingForResponse = false; // Response received, can start typing
    this.scrollOffset = 0; // Reset scroll for new response
  }

  // End dialogue
  endDialogue() {
    this.isActive = false;
    this.currentNPC = null;
    this.currentText = '';
    this.isTyping = false;
    this.showInput = false;
    this.playerInput = '';
    this.isWaitingForResponse = false;
    console.log('Dialogue ended');
  }

  // Update dialogue animation
  update(dt) {
    if (!this.isActive) return;

    // Update typewriter effect
    if (this.isTyping && this.typewriterIndex < this.currentText.length) {
      this.lastTypeTime += dt;
      const charsToAdd = Math.floor(this.lastTypeTime * this.typewriterSpeed);
      if (charsToAdd > 0) {
        this.typewriterIndex = Math.min(this.typewriterIndex + charsToAdd, this.currentText.length);
        this.lastTypeTime = 0;
      }
    } else if (this.isTyping) {
      // Finished typing, show input after a short delay
      this.lastTypeTime += dt;
      if (this.lastTypeTime > 0.5) {
        this.isTyping = false;
        this.showInput = true;
        this.lastTypeTime = 0;
      }
    }

    // Update cursor blink
    if (this.showInput) {
      this.cursorBlinkTime += dt;
      if (this.cursorBlinkTime > 0.5) {
        this.cursorVisible = !this.cursorVisible;
        this.cursorBlinkTime = 0;
      }
    }
  }

  // Handle text input
  handleInput(char) {
    if (!this.showInput) return;

    if (char === 'Enter') {
      this.submitInput();
    } else if (char === 'Backspace') {
      this.playerInput = this.playerInput.slice(0, -1);
    } else if (char.length === 1 && this.playerInput.length < 100) {
      this.playerInput += char;
    }
  }

  // Set player input from external buffer
  setPlayerInput(text) {
    this.playerInput = text;
  }

  // Hide input area immediately
  hideInput() {
    this.showInput = false;
    this.isWaitingForResponse = true;
    // Don't start typing animation - just wait for response
  }

  // Submit player input
  async submitInput() {
    if (!this.currentNPC || !this.playerInput.trim()) return;

    const message = this.playerInput.trim();
    this.playerInput = '';
    this.showInput = false;
    this.isTyping = true;
    this.typewriterIndex = 0;

    // Continue dialogue with NPC
    try {
      const response = await this.currentNPC.continueDialogue(message);
      this.continueDialogue(response);
    } catch (error) {
      console.error('Error continuing dialogue:', error);
      this.continueDialogue("I'm having trouble responding right now.");
    }
  }

  // Render the dialogue panel
  render() {
    if (!this.isActive) return;

    // Draw dialogue panel background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, this.panelY, CANVAS_WIDTH, this.panelHeight);

    // Draw border
    this.ctx.strokeStyle = '#4a9eff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(0, this.panelY, CANVAS_WIDTH, this.panelHeight);

    // Draw NPC name
    this.ctx.fillStyle = this.currentNPC ? this.currentNPC.color : '#ffffff';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.fillText(
      this.currentNPC ? this.currentNPC.name : 'Unknown',
      this.margin,
      this.panelY + 20
    );

    // Draw avatar if available
    this.renderAvatar();

    // Draw dialogue text with typewriter effect or waiting message
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px monospace';
    
    // Adjust text area if avatar is present
    const hasAvatar = this.currentNPC && this.currentNPC.avatar && this.avatarImages[this.currentNPC.avatar];
    const textAreaWidth = hasAvatar ? CANVAS_WIDTH - this.avatarSize - this.avatarMargin * 3 : CANVAS_WIDTH - this.margin * 2;
    
    if (this.isWaitingForResponse) {
      // Show waiting message instead of replaying text
      this.ctx.fillStyle = '#888888';
      this.ctx.fillText('Waiting for response...', this.margin, this.textY);
    } else {
      // Normal typewriter effect with scrolling
      const displayText = this.currentText.substring(0, this.typewriterIndex);
      // For short text, don't apply scroll offset - start at textY
      // For long text, apply scroll offset to move content up
      const startY = this.maxScrollOffset > 0 ? this.textY - this.scrollOffset : this.textY;
      this.calculateAndDrawText(displayText, this.margin, startY, textAreaWidth);
    }

    // Draw input field if ready - position it at the bottom of the panel
    if (this.showInput) {
      this.ctx.fillStyle = '#666666';
      this.ctx.fillText('You: ', this.margin, this.panelY + this.panelHeight - 20);
      
      this.ctx.fillStyle = '#ffffff';
      const inputText = this.playerInput + (this.cursorVisible ? '_' : '');
      
      // Wrap input text if it's too long
      this.wrapInputText(inputText, this.margin + 30, this.panelY + this.panelHeight - 20, CANVAS_WIDTH - this.margin * 2 - 30);
    }
  }

  // Calculate text height and draw text with scrolling support
  calculateAndDrawText(text, x, y, maxWidth) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    let totalHeight = 0;
    
    // Define the bottom boundary to avoid overlapping with input area
    const bottomBoundary = this.panelY + this.panelHeight - 60; // Leave room for input

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && i > 0) {
        // Only draw if we're not past the bottom boundary
        if (currentY <= bottomBoundary) {
          this.ctx.fillText(line, x, currentY);
        }
        line = words[i] + ' ';
        currentY += this.lineHeight;
        totalHeight += this.lineHeight;
      } else {
        line = testLine;
      }
    }
    
    // Always draw the last line if it fits
    if (currentY <= bottomBoundary) {
      this.ctx.fillText(line, x, currentY);
    }
    totalHeight += this.lineHeight;
    
    // Update scroll limits
    const textAreaHeight = this.panelHeight - 60;
    this.maxScrollOffset = Math.max(0, totalHeight - textAreaHeight + 40);
    
    // Auto-scroll to bottom when text is complete
    if (this.isTyping && this.typewriterIndex >= this.currentText.length) {
      this.scrollOffset = this.maxScrollOffset;
    }
    
    return currentY;
  }

  // Helper function to wrap input text
  wrapInputText(text, x, y, maxWidth) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && i > 0) {
        this.ctx.fillText(line, x, currentY);
        line = words[i] + ' ';
        currentY += this.lineHeight;
      } else {
        line = testLine;
      }
    }
    
    // Always draw the last line
    this.ctx.fillText(line, x, currentY);
  }

  // Helper function to wrap text and return the final Y position
  wrapText(text, x, y, maxWidth) {
    return this.calculateAndDrawText(text, x, y, maxWidth);
  }

  // Check if dialogue is active
  isDialogueActive() {
    return this.isActive;
  }

  // Check if input is being shown
  isInputActive() {
    return this.showInput;
  }

  // Render avatar on the right side of the dialogue panel
  renderAvatar() {
    if (!this.currentNPC || !this.currentNPC.avatar) return;
    
    const avatarImage = this.avatarImages[this.currentNPC.avatar];
    if (!avatarImage || !avatarImage.complete || avatarImage.naturalWidth === 0) return;
    
    // Calculate avatar position (right side of panel)
    const avatarX = CANVAS_WIDTH - this.avatarSize - this.avatarMargin;
    const avatarY = this.panelY + this.avatarMargin;
    
    // Draw avatar background circle
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.beginPath();
    this.ctx.arc(
      avatarX + this.avatarSize / 2,
      avatarY + this.avatarSize / 2,
      this.avatarSize / 2 + 5,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    
    // Draw avatar border
    this.ctx.strokeStyle = this.currentNPC.color;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    
    // Draw avatar image
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(
      avatarX + this.avatarSize / 2,
      avatarY + this.avatarSize / 2,
      this.avatarSize / 2,
      0,
      Math.PI * 2
    );
    this.ctx.clip();
    
    this.ctx.drawImage(
      avatarImage,
      avatarX,
      avatarY,
      this.avatarSize,
      this.avatarSize
    );
    
    this.ctx.restore();
  }
}
