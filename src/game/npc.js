import { TILE_SIZE } from '../shared/constants.js';

// NPC class for non-player characters
export class NPC {
  constructor(id, x, y, color, name, persona, clueId = null) {
    this.id = id;
    this.gridX = x;
    this.gridY = y;
    this.pixelX = x * TILE_SIZE;
    this.pixelY = y * TILE_SIZE;
    
    // Visual properties
    this.color = color;
    this.name = name;
    this.persona = persona;
    this.size = TILE_SIZE * 0.6; // Slightly smaller than player
    
    // Clue system
    this.clueId = clueId; // Optional clue this NPC can provide
    
    // Dialogue state
    this.currentDialogue = '';
    this.isTalking = false;
  }

  // Get position for rendering
  getPosition() {
    return {
      x: this.pixelX,
      y: this.pixelY
    };
  }

  // Get grid position
  getGridPosition() {
    return {
      x: this.gridX,
      y: this.gridY
    };
  }

  // Check if player is adjacent (for interaction)
  isAdjacentTo(playerGridX, playerGridY) {
    const dx = Math.abs(this.gridX - playerGridX);
    const dy = Math.abs(this.gridY - playerGridY);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  // Get system prompt for AI
  getSystemPrompt() {
    return `You are ${this.name}, ${this.persona}. Keep responses brief (1-2 sentences) and in character. You're speaking to a passenger on a train.`;
  }

  // Start dialogue with this NPC
  async startDialogue(playerMessage = '') {
    this.isTalking = true;
    
    const messages = [
      { role: 'system', content: this.getSystemPrompt() }
    ];
    
    if (playerMessage) {
      messages.push({ role: 'user', content: playerMessage });
    } else {
      // Initial greeting
      messages.push({ role: 'user', content: 'Hello!' });
    }
    
    try {
      // Import sendChat dynamically to avoid circular imports
      const { sendChat } = await import('../ai/openai_client.js');
      this.currentDialogue = await sendChat(messages);
    } catch (error) {
      console.error('Dialogue error:', error);
      this.currentDialogue = "Sorry, I can't talk right now.";
    }
    
    return this.currentDialogue;
  }

  // Continue dialogue with a response
  async continueDialogue(playerMessage) {
    if (!this.isTalking) {
      return await this.startDialogue(playerMessage);
    }
    
    const messages = [
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'assistant', content: this.currentDialogue },
      { role: 'user', content: playerMessage }
    ];
    
    try {
      const { sendChat } = await import('../ai/openai_client.js');
      this.currentDialogue = await sendChat(messages);
    } catch (error) {
      console.error('Dialogue error:', error);
      this.currentDialogue = "I'm having trouble responding right now.";
    }
    
    return this.currentDialogue;
  }

  // End dialogue
  endDialogue() {
    this.isTalking = false;
    this.currentDialogue = '';
  }

  // Check if this NPC can provide a clue
  hasClue() {
    return this.clueId !== null;
  }

  // Get clue hint if dependencies aren't met
  async getClueHint(clues, ownedClues) {
    if (!this.clueId) return null;
    
    try {
      const { getClueHint } = await import('./clue_graph.js');
      return getClueHint(this.clueId, clues, ownedClues);
    } catch (error) {
      console.error('Error getting clue hint:', error);
      return "This clue is not available yet.";
    }
  }

  // Check if this NPC can grant their clue
  async canGrantClue(clues, ownedClues) {
    if (!this.clueId) return false;
    
    try {
      const { canGrantClue } = await import('./clue_graph.js');
      return canGrantClue(this.clueId, clues, ownedClues);
    } catch (error) {
      console.error('Error checking clue grant:', error);
      return false;
    }
  }

  // Grant this NPC's clue to the player
  async grantClue(clues) {
    if (!this.clueId) return false;
    
    try {
      const { grantClue } = await import('./game_state.js');
      return grantClue(this.clueId, clues);
    } catch (error) {
      console.error('Error granting clue:', error);
      return false;
    }
  }

  // Check if the player's message satisfies this NPC's clue condition
  async checkClueCondition(playerMessage, clues) {
    if (!this.clueId) return false;
    
    try {
      const { checkClueCondition } = await import('./clue_graph.js');
      const clue = clues[this.clueId];
      if (!clue) return false;
      
      return await checkClueCondition(clue, playerMessage, this.persona);
    } catch (error) {
      console.error('Error checking clue condition:', error);
      return false;
    }
  }
}
