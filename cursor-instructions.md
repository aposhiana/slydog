Instructions for Cursor Agent:

ROLE: You are a senior game engineer tasked with scaffolding and implementing a tiny, extensible narrative game where the player walks down a train’s aisles, talks to AI-driven NPCs, collects clues, and solves a mystery. Prioritize simplicity, clean architecture, and ease of adding new characters/levels. Generate production-ready code.

############################
# 1) TECH CONSTRAINTS
############################
- Language/stack: JavaScript (ES6+) + HTML5 Canvas + plain HTML/CSS.
- No frameworks. No build tools. Files should run in a browser by just opening `index.html`.
- For ChatGPT API calls: do NOT call OpenAI directly from the browser (never expose the key).
- Instead, include a minimal **Cloudflare Workers proxy**:
  - Worker routes requests from the game to OpenAI’s API.
  - Reads the `OPENAI_API_KEY` secret from environment.
  - Enforces CORS, caps max tokens, and returns the assistant JSON (or SSE if streaming).
  - Should deploy with `wrangler deploy`.
  - Document in README how to set the secret with `wrangler secret put OPENAI_API_KEY`.

############################
# 2) GAME SUMMARY
############################
- Top-down (3/4-style) grid in a train car.
- Windows show simple parallax starfield to imply space travel.
- Movement: tile-based stepping with WASD/arrow keys. No diagonal.
- Interactions: press [E] when next to NPC → open dialog panel.
- Dialogs are powered by ChatGPT API via the Cloudflare Worker.
- Win condition: collect all required clues for a level → show victory screen.

############################
# 3) FILE / PROJECT LAYOUT
############################
index.html
/style.css
/src/
  main.js
  engine/
    loop.js
    input.js
    renderer.js
    assets.js
  game/
    game_state.js
    world.js
    player.js
    npc.js
    dialogue.js
    clue_graph.js
    space_bg.js
  levels/
    level_schema.json
    level_1.json
    level_2.json
  ai/
    openai_client.js     # calls Cloudflare Worker endpoint
    npc_runtime.js
/proxy/
  worker.js              # Cloudflare Worker code
  wrangler.toml
README.md

############################
# 4) CORE MECHANICS
############################
- Tilemap grid (default 20x12, 32px tiles).
- Collision against blocked tiles.
- Dialog panel with text wrap, hint button, clues list.
- Space background: two parallax star layers scrolling.
- Victory when all required clues collected.

############################
# 5) DATA MODELS (JSON CONFIG)
############################
- Level JSON defines tilemap, required_clues, npc list, clue definitions.
- NPCs include persona, backstory, clue_role (what clue they hold, how it’s revealed, hint policy).
- Clues are a dependency DAG: must check prerequisites before granting.

############################
# 6) NPC AI & FUNCTION CALLING
############################
- Each NPC gets a system prompt with:
  - Persona/backstory/speaking style
  - Clue(s) they hold
  - Rules for when/how to reveal
  - Hint policy

- NPCs can call functions defined in the engine. These enforce clue logic and solvability:
  1. **`get_player_clues()`**  
     - NPCs use this to see which clues the player already has.  
     - Prevents duplicate rewards and enables context-aware dialogue (“You already have the conductor’s passcode.”).  
     - Keeps state authoritative without bloating the chat history.  

  2. **`grant_clue(clue_id)`**  
     - The *only* safe way an NPC can award a clue.  
     - Checks dependencies against the clue graph before granting.  
     - Ensures the NPC can’t hand out impossible or premature clues.  

  3. **`suggest_hint()`**  
     - Provides structured hints when the player is stuck.  
     - Generates guidance based on missing dependencies (e.g., “Try asking the guard in the next car.”).  
     - Standardizes hint behavior across all NPCs while keeping immersion.  

- Together these 3 functions are **minimal but complete**: query state, advance state, and provide help.  
- The engine handles rules; NPCs just role-play and make function calls.  
- This design ensures solvability, keeps NPC prompts simple, and makes adding new characters easy.

############################
# 7) UI REQUIREMENTS
############################
- HUD: current level, clues list, “Press E to talk”.
- Dialog panel: text flow, hint button, goodbye button.
- Save/load:
  - Use `localStorage` for { levelId, playerPos, ownedClues }.

############################
# 8) EXTENSIBILITY
############################
- Add new NPCs by editing level JSON.
- Add new levels by cloning JSON, editing clues/NPCs.
- Engine should load arbitrary level JSON files.

############################
# 9) MINIMAL ART
############################
- Rectangles for seats/walls, circle for player, different shapes/colors for NPCs.
- Starfield background drawn with random points.

############################
# 10) TEST CONTENT
############################
- Level 1: 3 NPCs, linear clue chain A→B→C.
- Level 2: 4 NPCs, diamond dependency graph.

############################
# 11) OPENAI API VIA CLOUDFLARE WORKERS
############################
- `openai_client.js`: calls your Worker endpoint (not api.openai.com).
- Provide `/proxy/worker.js` as a Cloudflare Worker that:
  - Forwards POST requests to `https://api.openai.com/v1/chat/completions`.
  - Injects the server-side `OPENAI_API_KEY`.
  - Handles CORS (`Access-Control-Allow-Origin: *`).
  - Caps `max_tokens` to ≤512.
  - Optionally supports SSE streaming.
- Include `wrangler.toml` for deployment.
- Document in README:
  - `npm install -g wrangler`
  - `wrangler secret put OPENAI_API_KEY`
  - `wrangler deploy`
- Target traffic: ~30 concurrent players. This is safe on the free plan (100k requests/day).

############################
# 12) DEV EXPERIENCE
############################
README must include:
- How to run locally (static server → open `index.html`).
- How to deploy the Cloudflare Worker.
- How to add NPCs/levels.
- JSON schema for NPCs/clues.
- Safety notes: never expose API key in client.

############################
# 13) DELIVERABLES
############################
- Fully runnable JS+Canvas game with 2 example levels.
- Example NPCs with varied persona + clue rules.
- Clue graph validator.
- Victory flow.
- Cloudflare Worker proxy in `/proxy`.
- README with setup/run/deploy instructions.

# ACTION: Generate the full project with this structure, filling in minimal working code, placeholder art, example levels, the Worker, and a README with setup/run instructions.


############################
# 14) ASSET & PORTRAIT GUIDE
############################
The README must include an **Asset & Portrait Guide** section with the following requirements:

- **Low-Res Sprites (Overworld)**
  - Player and NPC movement sprites: 32×32 or 64×64 px (PNG with transparency).
  - Tilemap tiles: 32×32 px grid-aligned.
  - Store in `/assets/player/`, `/assets/npcs/`, `/assets/tiles/`.

- **High-Res Portraits (Dialogue)**
  - Each NPC may define a separate `portrait` field in its JSON config.
  - Recommended size: 512×512 px (WebP or PNG, ≤200 KB).
  - Rendered in the dialogue panel at ~192–256 px square, scaled to fit while preserving aspect ratio.
  - Store in `/assets/npcs/portraits/`.
  - Fallback: if no portrait is defined or fails to load, show initials or a silhouette.

- **Backgrounds**
  - Parallax stars should be code-generated by default.
  - Optionally allow replacement with repeatable textures (PNG/JPG).

- **Formats & Fallbacks**
  - Preferred: WebP (smaller size) or PNG (transparency).
  - If assets are missing, the engine must render simple shapes (rectangles, circles, star points).

- **README Documentation**
  - List all required images (sprites, portraits, tiles, optional backgrounds).
  - Specify recommended sizes and formats.
  - Show folder structure where each asset type belongs.
  - Explain how to replace placeholder art with new files, and how to adjust scaling in code if using different sizes.
  - Clarify that overworld sprites are always scaled to the tile size, while portraits are displayed at higher resolution in the dialogue UI.


############################
# 15) CLUE GRAPH SYSTEM
############################
The game must implement a **clue graph** to manage dependencies between clues. This ensures that clues are only revealed in a solvable order and that NPCs cannot bypass logic.

- **Definition**
  - Each clue in the level JSON may include a `dependencies` array of other clue IDs that must be collected first.
  - Example:
    {
      "id": "safe_code",
      "description": "A 4-digit code for the cargo safe.",
      "dependencies": ["keycard"]
    }

- **Core Behavior**
  - When an NPC calls `grant_clue(clue_id)`, the engine checks the clue’s dependencies against the player’s current inventory.
  - If all dependencies are satisfied → add the clue to the player’s inventory.
  - If not satisfied → deny the grant and allow the NPC to provide a hint via `suggest_hint()`.

- **Validation at Load**
  - On level load, validate the graph:
    - Ensure it is acyclic (no circular dependencies).
    - Ensure all clues are reachable (no dead ends).
  - Use a topological sort or similar algorithm. If validation fails, throw an error and refuse to load the level.

- **Hints**
  - `suggest_hint()` uses the clue graph to identify missing prerequisites for a requested clue and returns a nudge to the player.

- **Design Example**
  - Clues:
    - A = keycard_fragment
    - B = passcode_half (depends on A)
    - C = crew_roster (independent)
    - D = final_manifest (depends on B + C)
  - Graph:
        A → B ─┐
               └→ D
        C ──────┘
  - Valid solve path: A → B, C → D.

- **NPC Role**
  - NPCs do not enforce dependencies themselves. They simply attempt clue grants through function calls.
  - The engine enforces solvability, while NPCs handle dialogue and hints.

This system guarantees mystery levels are solvable, prevents broken states, and provides a clear structure for designing and testing clue-based progression.
