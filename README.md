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
  "persona": "a meticulous investigator who speaks succinctly"
}
```

- name: Display name in dialogue
- color: The NPC’s sprite color
- persona: Guides the NPC’s tone and behavior in the system prompt

Use the `character_id` to reference this file from your level’s `npcs` array (e.g., `"character_id": "inspector"` for `inspector.json`).

### 2) Create a new level

Levels live in `src/levels/` as `level_1.json`, `level_2.json`, etc. Copy an existing file and update it. A minimal level looks like this:

```json
{
  "name": "Car A",
  "player_start": [2, 5],
  "npcs": [
    { "character_id": "conductor", "position": [8, 5], "clue_id": "timetable" },
    { "character_id": "passenger", "position": [14, 5], "clue_id": "alibi" }
  ],
  "clues": {
    "timetable": {
      "description": "The train was delayed 15 minutes before departure.",
      "conversation_lead": "If asked about schedule or timing, mention the pre-departure delay.",
      "dependencies": []
    },
    "alibi": {
      "description": "The passenger was in Car B at departure.",
      "conversation_lead": "If asked about where they were, share their location at departure.",
      "dependencies": ["timetable"]
    }
  }
}
```

Key fields:
- player_start: grid coords `[x, y]`
- npcs: array with `character_id`, `position`, optional `clue_id`
- clues: a graph of clues, each with:
  - description: what to say when the clue is revealed
  - conversation_lead: hint for the AI on when/how to offer the clue
  - dependencies: list of clue IDs required beforehand

Note: Available levels are returned by `getAvailableLevels()` in `src/game/level_loader.js`. Add your new `level_X` there to include it in progression.

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
