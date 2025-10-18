Go to https://slydog.pages.dev/ to play the game

# Train Mystery

This is a data-driven, AI-assisted mystery game set on a train. You talk to NPCs, steer conversations, and collect clues to progress through levels.

## Live Site

- Play here: https://slydog.pages.dev/

---

## Creating Content

The game is fully data-driven via JSON. You can add new levels, mysteries, and characters without changing core code.

### 1) Create a new character

Characters live in `src/npc_characters/`. Create a new file like `src/npc_characters/inspector.json`:

```json
{
  "name": "Inspector Gray",
  "color": "#555555",
  "persona": "a meticulous investigator who speaks succinctly",
  "sprite": "inspector_sprite.png",
  "avatar": "inspector_avatar.png"
}
```

**Required fields:**
- `name`: Display name in dialogue
- `color`: Hex color for fallback rendering (when sprite isn't loaded)
- `persona`: Guides the NPC's tone and behavior in the system prompt
- `sprite`: Filename of the sprite image (must be in `assets/sprites/`)
- `avatar`: Filename of the avatar image for dialogue (must be in `assets/avatars/`)

**Adding the sprite asset:**
1. Add your sprite image to `assets/sprites/` (e.g., `inspector_sprite.png`)
2. Update the renderer to load your sprite by adding it to the `npcSprites` object in `src/engine/renderer.js`:

**Adding the avatar asset:**
1. Add your avatar image to `assets/avatars/` (e.g., `inspector_avatar.png`)
2. Update the dialogue system to load your avatar by adding it to the `avatarFiles` array in `src/game/dialogue.js`:

```javascript
// In the constructor, add to npcSprites object:
this.npcSprites = {
  monster: new Image(),
  girl: new Image(),
  trenchcoat: new Image(),
  robot: new Image(),
  nervous: new Image(),
  inspector: new Image()  // Add your new character
};

// Set the sprite source:
this.npcSprites.inspector.src = 'assets/sprites/inspector_sprite.png';
```

**For avatars, update the dialogue system:**

```javascript
// In src/game/dialogue.js, add to the avatarFiles array in loadAvatars():
const avatarFiles = [
  'girl_avatar.png',
  'moster_avatar.png', 
  'trenchcoat_avatar.png',
  'robot_avatar.png',
  'nervous_avatar.png',
  'inspector_avatar.png'  // Add your new avatar
];
```

Use the `character_id` to reference this file from your level's `npcs` array (e.g., `"character_id": "inspector"` for `inspector.json`).

### 1.1) Managing Sprite Assets

**Asset Organization:**
- All character sprites go in `assets/sprites/`
- Sprite files should be PNG format for transparency support
- Recommended naming: `{character_id}_sprite.png` (e.g., `inspector_sprite.png`)

**Sprite Requirements:**
- **Size**: Sprites are automatically scaled to fit tile width (50px) while preserving aspect ratio
- **Aspect Ratio**: Can be taller than tiles for 2.5D effect (feet will be anchored to tile bottom)
- **Transparency**: Use PNG with transparent background for clean integration
- **Style**: Match the existing 2.5D pixel art style for consistency

**Current Available Sprites:**
- `monster_sprite.png` - Zorblax the Monster
- `girl_sprite.png` - Luna Stardust  
- `trenchcoat_sprite.png` - Mysterious Trenchcoat Figure
- `robot_sprite.png` - Circuit-7
- `nervous_sprite.png` - Nervous Norman

**Fallback Rendering:**
If a sprite fails to load, the game will display a colored rectangle using the character's `color` field as a fallback.

### 1.2) Managing Avatar Assets

**Avatar Organization:**
- All character avatars go in `assets/avatars/`
- Avatar files should be PNG format for transparency support
- Recommended naming: `{character_id}_avatar.png` (e.g., `inspector_avatar.png`)

**Avatar Requirements:**
- **Size**: Avatars are displayed at 120x120 pixels in a circular frame
- **Aspect Ratio**: Square images work best (will be cropped to circle)
- **Transparency**: Use PNG with transparent background for clean integration
- **Style**: Match the existing character art style for consistency

**Current Available Avatars:**
- `girl_avatar.png` - Luna Stardust
- `moster_avatar.png` - Zorblax the Monster
- `trenchcoat_avatar.png` - Agent Shadow
- `robot_avatar.png` - Circuit-7
- `nervous_avatar.png` - Nervous Norman
- `neighmys_avatar.png` - Neighmys

**Avatar Display:**
- Avatars appear on the right side of the dialogue panel
- Only characters with an `avatar` field will show an avatar
- If an avatar fails to load, no avatar will be displayed (no fallback)

### 1.3) Updating the Renderer for New Sprites

When adding a new character with a sprite, you need to update the renderer to load the sprite:

**File:** `src/engine/renderer.js`

**Step 1: Add to npcSprites object (in constructor):**
```javascript
// Find the npcSprites object in the constructor
this.npcSprites = {
  monster: new Image(),
  girl: new Image(),
  trenchcoat: new Image(),
  robot: new Image(),
  nervous: new Image(),
  your_new_character: new Image()  // Add this line
};
```

**Step 2: Set the sprite source (in constructor):**
```javascript
// Find where sprite sources are set
this.npcSprites.monster.src = 'assets/sprites/monster_sprite.png';
this.npcSprites.girl.src = 'assets/sprites/girl_sprite.png';
this.npcSprites.trenchcoat.src = 'assets/sprites/trenchcoat_sprite.png';
this.npcSprites.robot.src = 'assets/sprites/robot_sprite.png';
this.npcSprites.nervous.src = 'assets/sprites/nervous_sprite.png';
this.npcSprites.your_new_character.src = 'assets/sprites/your_new_character_sprite.png'; // Add this line
```

**Important Notes:**
- The `character_id` in your character JSON must match the key in `npcSprites`
- The sprite filename in the character JSON must match the actual file in `assets/sprites/`
- The avatar filename in the character JSON must match the actual file in `assets/avatars/`
- The renderer automatically handles scaling and positioning - no additional code needed
- Sprites are loaded asynchronously, so there may be a brief fallback display while loading
- Avatars are loaded asynchronously, so there may be a brief delay before they appear in dialogue

### 2) Create a new level

Levels live in `src/levels/` as `level_1.json`, `level_2.json`, etc. Copy an existing file and update it. A complete level structure looks like this:

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
    [1,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,1],
    [1,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,1],
    [1,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,2,2,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ],
  "required_clues": ["clue_f", "clue_g"],
  "clues": {
    "clue_f": {
      "id": "clue_f",
      "name": "Final Discovery",
      "description": "The final piece of the puzzle reveals the truth.",
      "hint": "Look for the final witness.",
      "conversation_lead": "If asked about the final piece of evidence, mention the crucial discovery.",
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
  "player_start": [2, 5]
}
```

**Key fields:**
- `id`: Unique level identifier (e.g., "level_3")
- `name`: Display name for the level
- `description`: Brief description of the level's mystery
- `next_level`: ID of next level (null for final level)
- `tilemap`: 32x11 grid where 0=floor, 1=wall, 2=seat
- `required_clues`: Array of clue IDs needed to complete the level
- `player_start`: Starting position [x, y] for the player
- `npcs`: Array with `character_id`, `position`, optional `clue_id`
- `clues`: A graph of clues, each with:
  - `id`: Unique clue identifier
  - `name`: Display name for the clue
  - `description`: What to say when the clue is revealed
  - `hint`: Hint shown when clue dependencies aren't met
  - `conversation_lead`: Hint for the AI on when/how to offer the clue
  - `dependencies`: List of clue IDs required beforehand

**Adding to level progression:**
Available levels are returned by `getAvailableLevels()` in `src/game/level_loader.js`. Add your new `level_X` there to include it in progression:

```javascript
export async function getAvailableLevels() {
  return ['level_1', 'level_2', 'level_3']; // Add your new level here
}
```

### 3) Create a new mystery

A “mystery” is the collection of clues and dependencies across one or more levels. To design a new mystery:

1. Sketch the clue dependency graph (what must be known before each clue becomes available).
2. Define each clue’s `description` (what gets said) and `conversation_lead` (how to guide to it).
3. Distribute NPCs across cars (levels) with positions that fit the train aisle layout.
4. Put clues into the appropriate `level_X.json` under `clues`, and assign each NPC an appropriate `clue_id`.
5. Validate in-game; the engine checks the clue graph at load time.

---

## How Function Calling Works

The game uses OpenAI function calling to reliably “grant” clues and continue the conversation.

- The NPC system prompt is constructed in `src/game/npc.js`. It:
  - Sets persona and brevity
  - Provides available clues for this NPC (only those whose dependencies are satisfied)
  - Includes each clue’s `conversation_lead` so the AI can proactively steer toward it

- When the user asks about a relevant topic, the model can call the `grantClue` function. Functions are defined in `src/game/game_functions.js` as the `GAME_FUNCTIONS` schema. The main function:
  - `grantClue(clueId, reason)`: Adds the clue to `GameState` and logs context.

- Two-phase flow (robustness):
  1. Conversation → model returns a function call (e.g., `grantClue`). The game processes it and updates `GameState`.
  2. A follow-up call asks the model to continue the conversation, explicitly sharing the clue’s `description` so the player hears it in character.

This decoupling makes the system more reliable: even if the model focuses on the function call first, the second pass ensures the spoken explanation appears.

---

## Tips for Good conversation_lead

- Write natural hints, not strict triggers (e.g., “If asked about timing, discuss schedule delay”).
- Encourage the character’s voice (persona) to shine through.
- Keep clues short and specific; dependencies do the heavy lifting for pacing.

---

## Original Setup & Deployment (Cloudflare Workers proxy)

### 1. Install dependencies
```bash
# Initialize Node project
npm init -y

# Install Cloudflare CLI
npm install -g wrangler
```

### 2. Authenticate with Cloudflare
```bash
wrangler login
```

### 3. Set up OpenAI secret
```bash
cd proxy
wrangler secret put OPENAI_API_KEY
```

> Paste your OpenAI API key when prompted (starts with `sk-...`).

### 4. Deploy the Worker
```bash
wrangler deploy
```

> The first deployment will prompt you to register a `workers.dev` subdomain — choose **Y** and enter a unique name (e.g., `andrewaposhian`).

### 5. Run the game locally
```bash
cd ..
npx http-server .
```

Then open your browser at:  
👉 [http://127.0.0.1:8080](http://127.0.0.1:8080)

You should see:
```
NPC says: Hello! How can I assist you today?
```

---

### Notes

- **Worker endpoint:**  
  `https://train-mystery-proxy.andrewaposhian.workers.dev`

- **Redeploy Worker after code changes:**
  ```bash
  cd proxy
  wrangler deploy
  ```

- **Replace OpenAI key if needed:**
  ```bash
  wrangler secret put OPENAI_API_KEY
  wrangler deploy
  ```

- **Test Worker manually:**
  ```bash
  curl -X POST https://train-mystery-proxy.andrewaposhian.workers.dev \
       -H "Content-Type: application/json" \
       -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hello"}]}'
  ```
