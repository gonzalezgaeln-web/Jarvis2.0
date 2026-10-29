
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        reply: "Mi servidor todavía no tiene configurada la IA."
      });
    }

    const message = req.body?.message;

    if (typeof message !== "string" ||
        !message.trim() ||
        message.length > 2000) {
      return res.status(400).json({
        reply: "Escribe un mensaje válido."
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL ||
            "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "Eres JARVIS 2.0, un asistente útil que responde en español."
            },
            {
              role: "user",
              content: message.trim()
            }
          ],
          max_tokens: 700
        }),
        signal: AbortSignal.timeout(30000)
      }
    );

    if (!response.ok) {
      console.error("Error de Groq:", response.status);
      return res.status(502).json({
        reply: "No pude obtener una respuesta de la IA."
      });
    }

    const data = await response.json();

    return res.json({
      reply: data.choices?.[0]?.message?.content ||
        "No recibí una respuesta."
    });
  } catch (error) {
    console.error("Error del servidor:", error.message);
    return res.status(500).json({
      reply: "Ocurrió un error. Inténtalo nuevamente."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("JARVIS está funcionando en el puerto " + PORT);
});
