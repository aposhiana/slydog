import { TILE_SIZE } from '../shared/constants.js';

// 2.5D tile dimensions matching pygame implementation
const TILE_WIDTH = 50;
const TILE_HEIGHT = 85; 
const TILE_FLOOR_HEIGHT = 40;

// NPC class for non-player characters
export class NPC {
  constructor(id, x, y, color, name, persona, clueId = null) {
    this.id = id;
    this.gridX = x;
    this.gridY = y;
    this.pixelX = x * TILE_WIDTH;
    this.pixelY = y * TILE_FLOOR_HEIGHT;
    
    // Visual properties
    this.color = color;
    this.name = name;
    this.persona = persona;
    this.size = TILE_WIDTH * 0.6; // Slightly smaller than player
    
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
    return `You are ${this.name}, ${this.persona}. Keep responses brief (1-2 sentences) and in character. You're speaking to a passenger on a train. 

When the passenger asks about topics you know about, call the grantClue function to share that information with them.`;
  }

  // Start dialogue with this NPC
  async startDialogue(playerMessage = '', clues = {}, ownedClues = new Set()) {
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
      const { GAME_FUNCTIONS, getAvailableCluesForNPC } = await import('./game_functions.js');
      
      // Get available clues for this NPC
      const availableClues = getAvailableCluesForNPC(clues, ownedClues, this.clueId);
      
      // Add context about available clues
      if (availableClues.length > 0) {
        const clueContext = availableClues.map(clue => 
          `- ${clue.id}: ${clue.description}\n  Conversation guidance: ${clue.conversation_lead}\n  When granting this clue, explain: ${clue.description}`
        ).join('\n');
        
        messages[0].content += `\n\nYou have access to these clues that you can reveal:\n${clueContext}\n\nWhen the passenger asks about these topics, call the grantClue function to share that information.`;
      }
      
      const response = await sendChat(messages, {
        tools: availableClues.length > 0 ? GAME_FUNCTIONS : undefined,
        tool_choice: availableClues.length > 0 ? "auto" : undefined
      });
      
      this.currentDialogue = response.content;
      this.lastToolCalls = response.tool_calls;
      
    } catch (error) {
      console.error('Dialogue error:', error);
      this.currentDialogue = "Sorry, I can't talk right now.";
      this.lastToolCalls = [];
    }
    
    return {
      content: this.currentDialogue,
      tool_calls: this.lastToolCalls || []
    };
  }

  // Continue dialogue with a response
  async continueDialogue(playerMessage, clues = {}, ownedClues = new Set()) {
    if (!this.isTalking) {
      return await this.startDialogue(playerMessage, clues, ownedClues);
    }
    
    const messages = [
      { role: 'system', content: this.getSystemPrompt() },
      { role: 'assistant', content: this.currentDialogue },
      { role: 'user', content: playerMessage }
    ];
    
    try {
      const { sendChat } = await import('../ai/openai_client.js');
      const { GAME_FUNCTIONS, getAvailableCluesForNPC } = await import('./game_functions.js');
      
      // Get available clues for this NPC
      const availableClues = getAvailableCluesForNPC(clues, ownedClues, this.clueId);
      
      // Add context about available clues
      if (availableClues.length > 0) {
        const clueContext = availableClues.map(clue => 
          `- ${clue.id}: ${clue.description}\n  Conversation guidance: ${clue.conversation_lead}\n  When granting this clue, explain: ${clue.description}`
        ).join('\n');
        
        messages[0].content += `\n\nYou have access to these clues that you can reveal:\n${clueContext}\n\nWhen the passenger asks about these topics, call the grantClue function to share that information.`;
      }
      
      const response = await sendChat(messages, {
        tools: availableClues.length > 0 ? GAME_FUNCTIONS : undefined,
        tool_choice: availableClues.length > 0 ? "auto" : undefined
      });
      
      this.currentDialogue = response.content;
      this.lastToolCalls = response.tool_calls;
      
    } catch (error) {
      console.error('Dialogue error:', error);
      this.currentDialogue = "I'm having trouble responding right now.";
      this.lastToolCalls = [];
    }
    
    return {
      content: this.currentDialogue,
      tool_calls: this.lastToolCalls || []
    };
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

  // Get the last tool calls from the NPC's response
  getLastToolCalls() {
    return this.lastToolCalls || [];
  }
}
