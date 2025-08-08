import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';

export async function extractTextFromFile(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();
  if (mimeType === 'application/pdf' || ext === '.pdf') {
    const data = await fs.readFile(filePath);
    const pdf = await pdfParse(data);
    return pdf.text;
  }
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === '.docx') {
    const data = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer: data });
    return result.value;
  }
  // Fallback: plain text
  const text = await fs.readFile(filePath, 'utf8');
  return text;
}

export function chunkText(text, maxChars = 1200, overlap = 150) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  let i = 0;
  while (i < cleaned.length) {
    const end = Math.min(i + maxChars, cleaned.length);
    const slice = cleaned.slice(i, end);
    chunks.push(slice);
    if (end === cleaned.length) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return chunks;
}

