const express = require('express');
const path = require('path');

// Load .env ONLY in local (optional safety)
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const { HfInference } = require('@huggingface/inference');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Get token from environment (Render will inject this)
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

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;
    let output = "";

    try {
        const stream = client.chatCompletionStream({
            model: "Qwen/Qwen2.5-72B-Instruct",
            messages: [
                { role: "user", content: userMessage }
            ],
            max_tokens: 500
        });

        for await (const chunk of stream) {
            if (chunk.choices && chunk.choices.length > 0) {
                const newContent = chunk.choices[0]?.delta?.content || "";
                output += newContent;
                console.log(newContent);
            }
        }

        res.json({ reply: output });

    } catch (error) {
        console.error("Error:", error.message || error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
