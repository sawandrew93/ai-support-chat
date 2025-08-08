import express from 'express';
import http from 'http';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import authRouter from './routes/auth.js';
import chatRouter from './routes/chat.js';
import documentsRouter from './routes/documents.js';
import { initSockets } from './ws/socket.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 60_000, max: 120 });
app.use(limiter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/public', express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/documents', documentsRouter);

app.get('/health', (_, res) => res.json({ ok: true }));

initSockets(io);

server.listen(config.port, () => {
  console.log(`🚀 Server listening on http://0.0.0.0:${config.port}`);
  console.log(`🔑 Google API Key configured: ${config.googleApiKey ? 'Yes' : 'No'}`);
  console.log(`🤖 Gemini Model: ${config.geminiModel}`);
  console.log(`🔍 Embedding Model: ${config.embeddingModel}`);
  console.log(`💾 Supabase URL: ${config.supabaseUrl}`);
});

