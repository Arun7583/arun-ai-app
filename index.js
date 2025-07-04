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
    if (!question && !image) { return res.status(400).json({ error: "Sawal ya image, kam se kam ek cheez zaroori hai." }); }
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) { return res.status(500).json({ error: "API Key nahi mili." }); }
    const userTurn = { role: "user", parts: [] };
    if (question) { userTurn.parts.push({ text: question }); }
    if (image) {
      const image_parts = image.split(",");
      if (image_parts.length > 1) {
        userTurn.parts.push({ inline_data: { mime_type: image_parts[0].split(';')[0].split(':')[1], data: image_parts[1] } });
      }
    }
    const contents = history ? [...history, userTurn] : [userTurn];
    const payload = { contents };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    const aiResponse = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!aiResponse.ok) { const errorText = await aiResponse.text(); throw new Error(`API request failed: ${errorText}`); }
    const result = await aiResponse.json();
    if (result.candidates && result.candidates[0].content.parts[0].text) {
        const originalText = result.candidates[0].content.parts[0].text;
        const promoText = `*(To gain more knowledge, you can also check out the premium books from the "Read Your Favorite Book" button below!)*\n\n`;
        result.candidates[0].content.parts[0].text = promoText + originalText;
    }
    res.status(200).json(result);
  } catch (error) {
    console.error("Function Error:", error);
    res.status(500).json({ error: "Manager ke andar koi error aa gaya hai." });
  }
});
app.get('*', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });
app.listen(3000, () => { console.log('Server is running on port 3000'); });
