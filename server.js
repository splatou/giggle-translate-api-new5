require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 3001;

// Set up OpenAI with API key from environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.send('Giggle Translate API is running!');
});

// API endpoint for language detection
app.post('/api/detect-language', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.json({ detectedLanguage: 'en' });
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a language detection expert. Respond with only the ISO 639-1 language code (like 'en', 'es', 'fr', etc.) that corresponds to the language of the text provided."
        },
        {
          role: "user",
          content: `Detect the language of this text: "${text}"`
        }
      ],
      max_tokens: 5,
      temperature: 0.3,
    });
    
    const detectedLanguage = response.choices[0].message.content.trim().toLowerCase();
    res.json({ detectedLanguage });
  } catch (error) {
    console.error('Error detecting language:', error);
    res.status(500).json({ error: 'Language detection failed', detectedLanguage: 'en' });
  }
});

// API endpoint for generating explanations
app.post('/api/explain', async (req, res) => {
  try {
    const { word, age, language } = req.body;
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are Giggle Translate, an app that explains words to children. 
          Provide a simple, age-appropriate explanation for a ${age}-year-old child in ${language} language.
          Use examples, simple language, and fun comparisons that a ${age}-year-old would understand.
          Keep your explanation concise, under 3 sentences.`
        },
        {
          role: "user",
          content: `Explain the word "${word}" to a ${age}-year-old child.`
        }
      ],
      max_tokens: 150,
    });
    
    const explanation = response.choices[0].message.content.trim();
    res.json({ explanation });
  } catch (error) {
    console.error('Error generating explanation:', error);
    res.status(500).json({ error: 'Explanation generation failed', explanation: 'Oops! I couldn\'t get an explanation right now. Try again in a moment.' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});