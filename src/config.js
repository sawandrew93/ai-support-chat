import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  jwtSecret: process.env.JWT_SECRET,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  googleApiKey: process.env.GOOGLE_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-004',
  embeddingDim: parseInt(process.env.EMBEDDING_DIM || '768', 10),
  maxUploadMB: parseInt(process.env.MAX_UPLOAD_MB || '15', 10)
};

['jwtSecret','supabaseUrl','supabaseServiceKey','googleApiKey'].forEach(k => {
  if (!config[k]) {
    console.warn(`Warning: missing env ${k}`);
  }
});

