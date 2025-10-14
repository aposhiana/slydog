import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../shared/constants.js';

// Dialogue system for rendering conversation UI
export class DialogueSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Dialogue panel dimensions
    this.panelHeight = 120;
    this.panelY = CANVAS_HEIGHT - this.panelHeight;
    this.margin = 20;
    this.textY = this.panelY + 30;
    this.lineHeight = 18;
    
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
  }

  // Continue dialogue with new text
  continueDialogue(newText) {
    this.currentText = newText;
    this.isTyping = true;
    this.typewriterIndex = 0;
    this.lastTypeTime = 0;
    this.showInput = false;
    this.playerInput = '';
  }

  // End dialogue
  endDialogue() {
    this.isActive = false;
    this.currentNPC = null;
    this.currentText = '';
    this.isTyping = false;
    this.showInput = false;
    this.playerInput = '';
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

    // Draw dialogue text with typewriter effect
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px monospace';
    
    const displayText = this.currentText.substring(0, this.typewriterIndex);
    this.wrapText(displayText, this.margin, this.textY, CANVAS_WIDTH - this.margin * 2);

    // Draw input field if ready
    if (this.showInput) {
      this.ctx.fillStyle = '#666666';
      this.ctx.fillText('You: ', this.margin, this.textY + 40);
      
      this.ctx.fillStyle = '#ffffff';
      const inputText = this.playerInput + (this.cursorVisible ? '_' : '');
      this.ctx.fillText(inputText, this.margin + 30, this.textY + 40);
    }
  }

  // Helper function to wrap text
  wrapText(text, x, y, maxWidth) {
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
    
    this.ctx.fillText(line, x, currentY);
  }

  // Check if dialogue is active
  isDialogueActive() {
    return this.isActive;
  }

  // Check if input is being shown
  isInputActive() {
    return this.showInput;
  }
}
