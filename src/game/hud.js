// src/game/hud.js
// Heads-up display (HUD) elements for the game

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../shared/constants.js';

export class HUD {
  constructor() {
    this.isCluesExpanded = false;
    this.clues = [];
    this.clueNames = {};
  }

  // Update clues data from game state
  updateClues(ownedClues, allClues) {
    this.clues = Array.from(ownedClues);
    this.clueNames = allClues;
  }

  // Toggle clues display
  toggleClues() {
    this.isCluesExpanded = !this.isCluesExpanded;
  }

  // Render the HUD
  render(ctx, gameState) {
    this.renderCluesDisplay(ctx, gameState);
  }

  // Render the clues display
  renderCluesDisplay(ctx, gameState) {
    const padding = 10;
    const lineHeight = 20;
    const maxWidth = 200;
    
    // Calculate position (top-right corner)
    const x = CANVAS_WIDTH - maxWidth - padding;
    const y = padding;
    
    // Get clue names
    const clueNames = this.clues.map(clueId => {
      const clue = this.clueNames[clueId];
      return clue ? clue.name : clueId;
    });

    if (this.isCluesExpanded) {
      // Expanded view - show full list
      const boxHeight = Math.max(40, (clueNames.length + 1) * lineHeight + padding * 2);
      
      // Background box
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(x, y, maxWidth, boxHeight);
      
      // Border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, maxWidth, boxHeight);
      
      // Title
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('Clues Found', x + padding, y + 20);
      
      // Clue list
      ctx.font = '14px Arial';
      if (clueNames.length === 0) {
        ctx.fillStyle = '#888';
        ctx.fillText('No clues yet', x + padding, y + 40);
      } else {
        clueNames.forEach((name, index) => {
          ctx.fillStyle = '#4CAF50'; // Green for found clues
          ctx.fillText(`• ${name}`, x + padding, y + 40 + (index * lineHeight));
        });
      }
      
      // Instructions
      ctx.fillStyle = '#888';
      ctx.font = '12px Arial';
      ctx.fillText('Press C to minimize', x + padding, y + boxHeight - 10);
      
    } else {
      // Minimized view - show count only
      const boxHeight = 30;
      
      // Background box
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(x, y, maxWidth, boxHeight);
      
      // Border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, maxWidth, boxHeight);
      
      // Count text
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      const countText = `Clues (${this.clues.length})`;
      ctx.fillText(countText, x + padding, y + 20);
      
      // Instructions
      ctx.fillStyle = '#888';
      ctx.font = '12px Arial';
      ctx.fillText('Press C to expand', x + padding, y + 35);
    }
  }
}
