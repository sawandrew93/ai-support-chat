import fetch from 'node-fetch';
import { config } from '../config.js';

export async function embedText(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.embeddingModel}:embedContent?key=${config.googleApiKey}`;
  const body = {
    content: { parts: [{ text }] }
  };
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type':'application/json' },
    body: JSON.stringify(body)
  });
  const json = await resp.json();
  const values = json?.embedding?.values || json?.embedding?.value || [];
  return values;
}

