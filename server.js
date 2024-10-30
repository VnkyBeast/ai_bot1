const express = require('express');
const path = require('path');
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

// Chat endpoint using Hugging Face Mistral model
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;

    try {
        const fetch = (await import('node-fetch')).default; 
        const response = await fetch('https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat', { 
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: userMessage }),
        });

        // Check if response is OK
        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error:", errorData);
            return res.status(response.status).json({ error: errorData });
        }

        const data = await response.json();
        console.log("Response Data:", data); // Log the entire response

        if (data && Array.isArray(data) && data[0]?.generated_text) {
            const reply = data[0].generated_text;
            res.json({ reply });
        } else {
            res.status(500).json({ error: 'No valid response from model' });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
