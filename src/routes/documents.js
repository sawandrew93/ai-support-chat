import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config.js';
import { extractTextFromFile, chunkText } from '../services/textExtract.js';
import { embedText } from '../services/embeddings.js';
import { storeDocumentWithChunks } from '../services/vectorStore.js';
import { requireAgent } from '../middleware/auth.js';

const router = express.Router();
const uploadDir = path.join(process.cwd(), 'uploads');
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: config.maxUploadMB * 1024 * 1024 }
});

router.post('/upload', requireAgent, upload.single('file'), async (req, res) => {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file' });

    const allowed = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    const text = await extractTextFromFile(file.path, file.mimetype);
    const chunks = chunkText(text);

    // Embed in batches to avoid rate limits (simple loop for MVP)
    const embeddings = [];
    for (const chunk of chunks) {
      embeddings.push(await embedText(chunk));
    }

    const doc = await storeDocumentWithChunks({
      title: file.originalname,
      mime_type: file.mimetype,
      chunks,
      embeddings
    });

    res.json({ ok: true, document_id: doc.id, chunks: chunks.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

