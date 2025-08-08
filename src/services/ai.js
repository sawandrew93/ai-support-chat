import fetch from 'node-fetch';
import { config } from '../config.js';

export async function generateAIResponse({ prompt, context }) {
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: buildRagPrompt(prompt, context) }]
      }
    ]
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.googleApiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await resp.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
  return text;
}

export async function analyzeIntentForHandoff(message) {
  // Simple classification via Gemini; return boolean
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{
          text:
`Classify if this user message requires human agent handoff.
Return exactly "handoff: yes" or "handoff: no".

Message: """${message}"""` }]
      }
    ]
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.googleApiKey}`;
  const resp = await fetch(url, { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify(body) });
  const json = await resp.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase() || '';
  return text.includes('handoff: yes');
}

function buildRagPrompt(userQuestion, chunks) {
  const kb = chunks.map((c, i) => `Source ${i+1} (sim=${c.similarity.toFixed(3)}):\n${c.content}`).join('\n\n');
  return `You are a helpful support assistant. Use ONLY the provided sources when possible. If unsure, say you don't know.

User question:
${userQuestion}

Knowledge sources:
${kb}

Answer clearly and concisely.`;
}

