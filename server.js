require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const NodeCache = require('node-cache');

const app = express();
const port = process.env.PORT || 3001;

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize cache (TTL: 24 hours)
const explanationCache = new NodeCache({ stdTTL: 86400 });
const languageDetectionCache = new NodeCache({ stdTTL: 86400 });

// Middleware
app.use(cors({
  origin: ['https://giggletranslate.netlify.app', 'https://api.giggleai.org', 'https://giggleai.org'] // Restrict to your frontend domain
}));
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.send('Giggle Translate API is running!');
});

// API endpoint for language detection with caching
app.post('/api/detect-language', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.json({ detectedLanguage: 'en' });
    }
    
    // Check cache first
    const cacheKey = text.toLowerCase().trim();
    if (languageDetectionCache.has(cacheKey)) {
      console.log('Language detection cache hit');
      return res.json({ detectedLanguage: languageDetectionCache.get(cacheKey) });
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
    
    // Cache the result
    languageDetectionCache.set(cacheKey, detectedLanguage);
    
    res.json({ detectedLanguage });
  } catch (error) {
    console.error('Error detecting language:', error);
    res.status(500).json({ error: 'Language detection failed', detectedLanguage: 'en' });
  }
});

// Updated API endpoint for generating explanations with caching
app.post('/api/explain', async (req, res) => {
  try {
    const { word, age, language } = req.body;
    
    // Create a cache key from the request parameters
    const cacheKey = `${word.toLowerCase().trim()}-${age}-${language}`;
    
    // Check if we have a cached response
    if (explanationCache.has(cacheKey)) {
      console.log('Explanation cache hit');
      return res.json({ explanation: explanationCache.get(cacheKey) });
    }
    
    // Build the system prompt
    let systemPrompt = `You are Giggle Translate, an app that explains words to children.
The user will provide a word in ${language}.
Provide a simple, age-appropriate explanation for a ${age}-year-old child.
Use examples, simple language, and fun comparisons that a ${age}-year-old would understand.
Keep your explanation concise, under 3 sentences.`;
    
    // Add language-specific instruction only when not English
    if (language.toLowerCase() !== 'english') {
      systemPrompt += `
IMPORTANT: Your entire response must be in ${language} language, not in English.`;
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Explain the word "${word}" to a ${age}-year-old child.`
        }
      ],
      max_tokens: 150,
    });
    
    const explanation = response.choices[0].message.content.trim();
    
    // Cache the explanation
    explanationCache.set(cacheKey, explanation);
    
    res.json({ explanation });
  } catch (error) {
    console.error('Error generating explanation:', error);
    res.status(500).json({ error: 'Explanation generation failed', explanation: 'Oops! I couldn\'t get an explanation right now. Try again in a moment.' });
  }
});

// Statistics endpoint (optional)
app.get('/api/stats', (req, res) => {
  const stats = {
    explanationCacheSize: explanationCache.keys().length,
    languageCacheSize: languageDetectionCache.keys().length,
    explanationCacheStats: explanationCache.getStats(),
    languageCacheStats: languageDetectionCache.getStats()
  };
  res.json(stats);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});