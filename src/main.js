import { sendChat } from "./ai/openai_client.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

async function init() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.font = "18px monospace";
  ctx.fillText("Contacting AI NPC...", 40, 80);

  const reply = await sendChat([
    { role: "system", content: "You are a friendly train conductor NPC." },
    { role: "user", content: "Hello from the game!" },
  ]);

  ctx.fillText(`NPC says: ${reply}`, 40, 120);
}

init();
