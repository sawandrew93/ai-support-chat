import express from 'express';
import sanitizeHtml from 'sanitize-html';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { embedText } from '../services/embeddings.js';
import { generateAIResponse, analyzeIntentForHandoff } from '../services/ai.js';
import { semanticSearch, supabaseService } from '../services/vectorStore.js';
import { enqueueHandoff } from '../services/handoff.js';

const router = express.Router();
const supabase = supabaseService;

// Create or reuse a conversation
router.post('/start', async (req, res) => {
  const customer_id = req.body.customer_id || uuidv4();
  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({ customer_id })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ conversation_id: conv.id, customer_id });
});

// User message to AI with RAG
router.post('/message', async (req, res) => {
  const { conversation_id, message } = req.body;
  if (!conversation_id || !message) return res.status(400).json({ error: 'Missing fields' });
  const content = sanitizeHtml(message, { allowedTags: [], allowedAttributes: {} });

  await supabase.from('messages').insert({ conversation_id, role: 'user', content });

  // RAG: embed query -> semantic search -> AI response
  const queryEmbedding = await embedText(content);
  const matches = await semanticSearch({ embedding: queryEmbedding, matchCount: 5, minSim: 0.6 });

  const aiText = await generateAIResponse({
    prompt: content,
    context: matches.map(m => ({ content: m.content, similarity: m.similarity }))
  });

  await supabase.from('messages').insert({ conversation_id, role: 'assistant', content: aiText });

  // Check handoff intent
  const needsHandoff = await analyzeIntentForHandoff(content);
  if (needsHandoff) {
    await supabase.from('conversations').update({ status: 'queued' }).eq('id', conversation_id);
    enqueueHandoff(conversation_id, 'anon');
  }

  res.json({ reply: aiText, handoff: needsHandoff });
});

export default router;

