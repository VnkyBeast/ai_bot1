const express = require('express');
const path = require('path');

// Load .env ONLY in local development
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const { HfInference } = require('@huggingface/inference');

const app = express();
const PORT = process.env.PORT || 5000;

// Get token from environment (Render will provide this)
const HF_TOKEN = process.env.HF_TOKEN;

if (!HF_TOKEN) {
    console.error("❌ HF_TOKEN is missing. Set it in Render Environment Variables.");
    process.exit(1);
}

// Initialize Hugging Face client
const client = new HfInference(HF_TOKEN);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Chat endpoint (NO STREAMING — stable)
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;

    try {
        // Primary method (chatCompletion)
        const response = await client.chatCompletion({
            model: "Qwen/Qwen2.5-7B-Instruct",
            messages: [
                { role: "user", content: userMessage }
            ],
            max_tokens: 300
        });

        const reply = response.choices?.[0]?.message?.content;

        if (!reply) {
            throw new Error("Empty response from model");
        }

        return res.json({ reply });

    } catch (error) {
        console.error("⚠️ chatCompletion failed, trying fallback...", error.message);

        try {
            // ✅ Fallback method (textGeneration — more reliable)
            const fallback = await client.textGeneration({
                model: "Qwen/Qwen2.5-7B-Instruct",
                inputs: userMessage,
                parameters: {
                    max_new_tokens: 200
                }
            });

            return res.json({
                reply: fallback.generated_text
            });

        } catch (fallbackError) {
            console.error("❌ Fallback also failed:", fallbackError.message);

            return res.status(500).json({
                error: "Model unavailable or API failed"
            });
        }
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
