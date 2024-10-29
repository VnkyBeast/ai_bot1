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

    console.log('User Message:', userMessage); // Log user message

    try {
        const response = await openai.Completion.create({
            model: "text-davinci-003",
            prompt: userMessage,
            max_tokens: 150,
        });

        console.log('API Response:', response); // Log the API response

        if (response && response.choices && response.choices.length > 0) {
            const reply = response.choices[0].text.trim();
            return res.json({ reply });
        } else {
            return res.json({ reply: 'No response from AI' });
        }
    } catch (error) {
        console.error('Error:', error); // Log the error
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});
