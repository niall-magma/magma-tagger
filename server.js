require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const path = require('path');

const app = express();
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an expert in Ontario mathematics curriculum assessment. Your job is to classify math questions as KU, AP, or TH according to these precise definitions:

TAG 1 — KU (Knowledge & Understanding):
- Student recalls a fact, names a property, or executes a procedure directly and without context
- No real-world scenario or story — just the math
- Stem states the procedure or concept directly: "What is 7 × 5?" or "Which symbol completes 473 __ 437?"
- Simple test: Does the student produce a value or execute a procedure with NO context? → KU

TAG 2 — AP (Application):
- Student must decide which skill is needed, apply it to an unfamiliar situation, and interpret the result
- MUST have a real-world scenario, story, or context (names, objects, situations)
- Stem describes a scenario: "Amara earns $150 babysitting..." or "A plank is 3.45 m long..."
- Simple test: Does the student interpret a scenario, decide what to do, then execute? → AP

TAG 3 — TH (Thinking):
- Student evaluates a claim, spots an error, compares methods, or reasons about a result rather than produce one
- Stem gives a claim or result and asks the student to evaluate: "Dawit says... Is he correct?" or "Which response correctly explains..."
- Non-routine reasoning required — working backwards, generalising, error-spotting
- Simple test: Does the student evaluate a claim, explain a result, or reason about a method? → TH

If the question contains only an image with no readable text, respond with HUMAN_REVIEW.

Respond in this exact JSON format only, no other text:
{"tag":"KU","confidence":"high","reasoning":"One sentence explaining why."}

Confidence levels: "high" (very clear), "medium" (mostly clear), "low" (borderline case)
Tag values: "KU", "AP", "TH", "HUMAN_REVIEW"`;

app.post('/api/tag', async (req, res) => {
  const { questionText } = req.body;
  if (!questionText) return res.status(400).json({ error: 'questionText is required' });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 200,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'Classify this question:\n\n' + questionText }
      ]
    });
    const raw = completion.choices[0].message.content.trim();
    res.json(JSON.parse(raw));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/section/:id', async (req, res) => {
  const jwt = process.env.MAGMA_JWT;
  if (!jwt) return res.status(500).json({ error: 'MAGMA_JWT not set in .env' });

  const url = `https://api.magmamath.com/v2/sections/${req.params.id}?fetchAll=1&useFallbackLocale=0&locale=en-SE&showHiddenProblems=1`;
  try {
    const upstream = await fetch(url, { headers: { Authorization: 'JWT ' + jwt } });
    if (upstream.status === 401) return res.status(401).json({ error: 'JWT token is expired or invalid. Update MAGMA_JWT in .env and restart.' });
    if (upstream.status === 404) return res.status(404).json({ error: 'Section ID not found. Double-check the ID from WebAdmin.' });
    if (!upstream.ok) return res.status(upstream.status).json({ error: 'MagmaMath API error: ' + upstream.status });
    res.json(await upstream.json());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Magma Tagger → http://localhost:${PORT}`));
