# Level Design Guide

This guide explains how to add new levels and NPCs to the Train Mystery game.

## Adding New Levels

### 1. Create Level JSON File

Create a new file in `/src/levels/` following the naming pattern `level_X.json`:

```json
{
  "id": "level_3",
  "name": "The Final Investigation",
  "description": "The mystery reaches its climax. Find the final clues.",
  "next_level": null,
  "tilemap": [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,1],
    [1,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    // ... rest of tilemap (32x11 grid with seats)
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ],
  "required_clues": ["clue_f", "clue_g"],
  "clues": {
    "clue_f": {
      "id": "clue_f",
      "name": "Final Discovery",
      "description": "The final piece of the puzzle reveals the truth.",
      "hint": "Look for the final witness.",
      "dependencies": []
    }
  },
  "npcs": [
    {
      "character_id": "witness",
      "position": [10, 5],
      "clue_id": "clue_f"
    }
  ],
  "player_start": [2, 2]
}
```

### 2. Level JSON Structure

- **id**: Unique level identifier (e.g., "level_3")
- **name**: Display name for the level
- **description**: Brief description of the level's mystery
- **next_level**: ID of next level (null for final level)
- **tilemap**: 32x11 grid where 0=floor, 1=wall, 2=seat
- **required_clues**: Array of clue IDs needed to complete the level
- **clues**: Object defining all clues in this level
- **npcs**: Array of NPCs to place in this level
- **player_start**: Starting position [x, y] for the player

### 3. Clue Structure

Each clue in the `clues` object should have:

- **id**: Unique clue identifier
- **name**: Display name for the clue
- **description**: Full description revealed when clue is granted
- **hint**: Hint shown when clue dependencies aren't met
- **dependencies**: Array of clue IDs that must be owned first

## Adding New NPCs

### 1. Create NPC Character JSON File

Create a new file in `/src/npc_characters/` with the NPC's ID:

```json
{
  "id": "witness",
  "name": "Mysterious Witness",
  "color": "#ff9500",
  "persona": "a nervous witness who saw something they shouldn't have",
  "dialogue_style": "anxious and evasive",
  "description": "A key witness who holds crucial information"
}
```

### 2. NPC Character Structure

- **id**: Unique character identifier
- **name**: Display name for the NPC
- **color**: Hex color for the NPC's appearance
- **persona**: Description used by AI for dialogue generation
- **dialogue_style**: Style description for AI dialogue
- **description**: Brief description of the character

### 3. Place NPC in Level

Add the NPC to a level's `npcs` array:

```json
{
  "character_id": "witness",
  "position": [10, 5],
  "clue_id": "clue_f"
}
```

- **character_id**: Must match the ID in the character JSON file
- **position**: [x, y] grid coordinates (0-31, 0-10)
- **clue_id**: Optional clue this NPC provides (null for no clue)

## Level Progression

The game automatically progresses through levels based on the `next_level` field:

1. Player completes all required clues in current level
2. Game checks if `next_level` exists
3. If yes: loads next level automatically
4. If no: shows "Game Complete!" screen

## Clue Dependencies

Clues can have dependencies to create a logical progression:

```json
"clue_b": {
  "dependencies": ["clue_a"]  // Must have clue_a first
}
```

The game validates that:
- All dependencies exist
- No circular dependencies
- Dependencies are satisfied before granting clues

## Train Layout Design

The game uses a train-like layout with:

- **32x11 grid**: Longer and narrower to simulate train cars
- **Seat rows**: Pattern of seats (2) with aisle (0) for walking
- **Walls**: Outer walls (1) and aisle boundaries
- **Movement**: Player walks left-to-right down the aisle
- **NPCs**: Stationed in seats or walking in the aisle

### Tile Types:
- **0 (Floor)**: Walkable aisle space
- **1 (Wall)**: Impassable walls and boundaries  
- **2 (Seat)**: Train seats that block movement

### Layout Pattern:
```
[1,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,1]
[1,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,1]
[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]
```

## Tips

1. **Reuse NPCs**: You can use the same character in multiple levels
2. **Logical Progression**: Design clues to build on each other
3. **Clear Hints**: Provide helpful hints for unavailable clues
4. **Balanced Difficulty**: Don't make dependencies too complex
5. **Test Thoroughly**: Verify clue graph validation passes
6. **Train Realism**: Place NPCs in seats or aisle positions
7. **Seat Collisions**: Remember seats block movement

## Example Level Sequence

- **Level 1**: Basic mystery setup (3 clues, linear progression)
- **Level 2**: Deeper investigation (2 clues, some reuse of Level 1 NPCs)
- **Level 3**: Final revelation (1-2 clues, new characters)

This creates a satisfying progression where players learn about characters across multiple levels while uncovering new mysteries.
