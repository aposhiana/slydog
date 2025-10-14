## ⚙️ Setup & Deployment

### 1. **Install dependencies**
```bash
# Initialize Node project
npm init -y

# Install Cloudflare CLI
npm install -g wrangler
```

### 2. **Authenticate with Cloudflare**
```bash
wrangler login
```

### 3. **Set up OpenAI secret**
```bash
cd proxy
wrangler secret put OPENAI_API_KEY
```

> Paste your OpenAI API key when prompted (starts with `sk-...`).

### 4. **Deploy the Worker**
```bash
wrangler deploy
```

> The first deployment will prompt you to register a `workers.dev` subdomain — choose **Y** and enter a unique name (e.g., `andrewaposhian`).

### 5. **Run the game locally**
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

### 🧠 Notes

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
