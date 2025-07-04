// index.js - Version 2.2 (Final)
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

app.post('/askAI', async (req, res) => {
  try {
    const { question, image, history } = req.body;

    if (!question && !image) {
      return res.status(400).json({ error: "Sawal ya image, kam se kam ek cheez zaroori hai." });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "API Key nahi mili." });
    }

    // --- PROMPT UPDATE V2.2 ---
    // AI ko behtar nirdesh diye gaye hain taaki woh bhasha aur format ko theek se samjhe.
    const prompt = `
      You are a helpful and versatile AI assistant. Follow these rules strictly:
      1.  **Language Rule:** You MUST respond in the exact same language and style as the user's question. If the question is in Hinglish (e.g., 'Dialisys ka principal kya hai?'), your entire response, including the promotional text and book reference, MUST be in Hinglish.
      2.  **Format Rule:** Your response must follow this exact format:
          - First, on a new line, write the promotional text: "*(To gain more knowledge, you can also check out the premium books from the "Read Your Favorite Book" button below!)*"
          - Then, provide the main, detailed answer to the user's question.
          - Finally, if the query is academic or related to learning, provide a relevant book reference at the very end, under the heading "Book Reference:".

      User's Question: "${question}"
    `;

    const userTurn = { role: "user", parts: [] };
    if (question) {
      userTurn.parts.push({ text: prompt }); // Hum prompt ko user ke sawaal ke saath bhej rahe hain
    }
    if (image) {
      const image_parts = image.split(",");
      if (image_parts.length > 1) {
        userTurn.parts.push({
          inline_data: {
            mime_type: image_parts[0].split(';')[0].split(':')[1],
            data: image_parts[1]
          }
        });
      }
    }
    
    const contents = history ? [...history, userTurn] : [userTurn];
    const payload = { contents };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    
    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("API Error:", errorText);
      throw new Error(`API request failed: ${errorText}`);
    }
    
    const result = await aiResponse.json();
    res.status(200).json(result);

  } catch (error) {
    console.error("Function Error:", error);
    res.status(500).json({ error: "Manager ke andar koi error aa gaya hai." });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
