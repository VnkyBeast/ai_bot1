const express = require('express');
const bodyParser = require('body-parser');
const openai = require('openai'); // Make sure to have this package installed
require('dotenv').config();
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html'); // Adjust the path as necessary
});

const app = express();
app.use(bodyParser.json());

openai.apiKey = process.env.OPENAI_API_KEY; // Ensure you have this in your .env file

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
            console.error('No choices found in response');
            return res.status(500).json({ error: 'No response from AI' });
        }
    } catch (error) {
        console.error('Error:', error.message); // Log the error message
        console.error('Full Error Details:', error); // Log full error details
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
