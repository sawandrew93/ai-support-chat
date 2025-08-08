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
  console.log('📨 Received message request:', { conversation_id: req.body.conversation_id, message: req.body.message?.substring(0, 50) + '...' });
  
  try {
    const { conversation_id, message } = req.body;
    if (!conversation_id || !message) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'Missing fields' });
    }
    const content = sanitizeHtml(message, { allowedTags: [], allowedAttributes: {} });
    console.log('✅ Message sanitized, length:', content.length);

    console.log('💾 Saving user message to database...');
    await supabase.from('messages').insert({ conversation_id, role: 'user', content });
    console.log('✅ User message saved');

    // RAG: embed query -> semantic search -> AI response
    console.log('🔍 Generating embeddings...');
    const queryEmbedding = await embedText(content);
    console.log('✅ Embeddings generated, length:', queryEmbedding.length);
    
    console.log('🔎 Performing semantic search...');
    const matches = await semanticSearch({ embedding: queryEmbedding, matchCount: 5, minSim: 0.6 });
    console.log('✅ Found', matches.length, 'semantic matches');

    console.log('🤖 Generating AI response...');
    const aiText = await generateAIResponse({
      prompt: content,
      context: matches.map(m => ({ content: m.content, similarity: m.similarity }))
    });
    console.log('✅ AI response generated, length:', aiText.length);

    console.log('💾 Saving AI response to database...');
    await supabase.from('messages').insert({ conversation_id, role: 'assistant', content: aiText });
    console.log('✅ AI response saved');

    // Check handoff intent
    console.log('🔄 Checking handoff intent...');
    const needsHandoff = await analyzeIntentForHandoff(content);
    console.log('✅ Handoff check complete:', needsHandoff);
    
    if (needsHandoff) {
      console.log('👥 Initiating handoff...');
      await supabase.from('conversations').update({ status: 'queued' }).eq('id', conversation_id);
      enqueueHandoff(conversation_id, 'anon');
      console.log('✅ Handoff initiated');
    }

    console.log('📤 Sending response to client');
    res.json({ reply: aiText, handoff: needsHandoff });
  } catch (error) {
    console.error('❌ Error in /message route:', error);
    res.status(500).json({ error: 'Internal server error', reply: 'Sorry, I encountered an error processing your message.' });
  }
});

export default router;

