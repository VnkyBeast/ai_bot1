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

// Chat endpoint using Hugging Face Llama model with retry logic
app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;
    const maxRetries = 5; // Number of retries
    const retryDelay = 20000; // 20-second delay between retries

    try {
        const fetch = (await import('node-fetch')).default; 
        let response;
        
        // Retry loop to handle model loading
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            response = await fetch('https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat', { 
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ inputs: userMessage }),
            });

            // Check if response status is not a loading error
            if (response.status !== 503) {
                break; // Exit loop if the model is not loading
            }

            console.log(`Model loading, retrying in ${retryDelay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay)); // Delay before retrying
        }

        // If response is still not OK, send error to client
        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error:", errorData);
            return res.status(response.status).json({ error: errorData });
        }

        const data = await response.json();
        console.log("Response Data:", data);

        // Check for valid response content
        if (data && data.length > 0 && data[0].generated_text) {
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
