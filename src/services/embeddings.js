import fetch from 'node-fetch';
import { config } from '../config.js';

export async function embedText(text) {
  console.log('🔍 Starting text embedding...');
  console.log('Text length:', text.length);
  console.log('Embedding model:', config.embeddingModel);
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.embeddingModel}:embedContent?key=${config.googleApiKey}`;
    const body = {
      content: { parts: [{ text }] }
    };
    
    console.log('Making request to Embedding API...');
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type':'application/json' },
      body: JSON.stringify(body)
    });
    
    console.log('Embedding API response status:', resp.status);
    
    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('Embedding API error:', resp.status, resp.statusText, errorText);
      return [];
    }
    
    const json = await resp.json();
    const values = json?.embedding?.values || json?.embedding?.value || [];
    console.log('Embedding generated, dimension:', values.length);
    return values;
  } catch (error) {
    console.error('Error in embedText:', error);
    return [];
  }
}

