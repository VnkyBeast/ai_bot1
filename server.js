const express = require('express');
const path = require('path');

// Load .env only locally
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const { HfInference } = require('@huggingface/inference');

const app = express();
const PORT = process.env.PORT || 5000;

const HF_TOKEN = process.env.HF_TOKEN;

if (!HF_TOKEN) {
    console.error("❌ HF_TOKEN missing");
    process.exit(1);
}

const client = new HfInference(HF_TOKEN);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Stable chat endpoint
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;

    try {
        const response = await client.chatCompletion({
            model: "Qwen/Qwen2.5-7B-Instruct",
            messages: [{ role: "user", content: userMessage }],
            max_tokens: 300
        });

        let reply = response?.choices?.[0]?.message?.content;

        if (!reply || reply.trim() === "") {
            throw new Error("Empty response");
        }

        return res.json({ reply });

    } catch (error) {
        console.log("⚠️ Primary failed:", error.message);

        try {
            const fallback = await client.textGeneration({
                model: "Qwen/Qwen2.5-7B-Instruct",
                inputs: userMessage,
                parameters: { max_new_tokens: 200 }
            });

            let reply = fallback?.generated_text;

            if (!reply || reply.trim() === "") {
                reply = "⚠️ Empty response from AI.";
            }

            return res.json({ reply });

        } catch (err) {
            console.error("❌ All failed:", err.message);

            return res.json({
                reply: "⚠️ AI unavailable. Try again later."
            });
        }
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
