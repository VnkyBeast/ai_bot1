const express = require('express');
const path = require('path');
const openai = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve the index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;

    try {
        // Generate a response from OpenAI
        const response = await openai.Completion.create({
            model: "text-davinci-003",
            prompt: userMessage,
            max_tokens: 150,
        });

        // Extract the text response
        const reply = response.choices[0].text.trim();
        res.json({ reply });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
