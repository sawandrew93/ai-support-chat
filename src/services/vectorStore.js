import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

export const supabaseService = createClient(config.supabaseUrl, config.supabaseServiceKey);

export async function storeDocumentWithChunks({ title, mime_type, chunks, embeddings }) {
  const { data: doc, error: docErr } = await supabaseService
    .from('documents')
    .insert({ title, mime_type })
    .select()
    .single();
  if (docErr) throw new Error(docErr.message);

  const rows = chunks.map((content, idx) => ({
    document_id: doc.id,
    chunk_index: idx,
    content,
    embedding: embeddings[idx] // array of floats
  }));

  const { error: chErr } = await supabaseService.from('document_chunks').insert(rows);
  if (chErr) throw new Error(chErr.message);

  return doc;
}

export async function semanticSearch({ embedding, matchCount = 5, minSim = 0.7 }) {
  const { data, error } = await supabaseService.rpc('match_document_chunks', {
    query_embedding: embedding,
    match_count: matchCount,
    min_similarity: minSim
  });
  if (error) throw new Error(error.message);
  return data || [];
}

