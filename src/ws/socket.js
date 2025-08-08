import { v4 as uuidv4 } from 'uuid';
import { supabaseService } from '../services/vectorStore.js';
import { dequeueHandoff, getQueue } from '../services/handoff.js';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function initSockets(io) {
  const customerNS = io.of('/ws/customer');
  const agentNS = io.of('/ws/agent');

  // CUSTOMER SOCKETS
  customerNS.on('connection', (socket) => {
    let conversationId = null;

    socket.on('start', async ({ conversation_id }) => {
      conversationId = conversation_id || null;
      socket.join(conversationId);
      socket.emit('ready', { conversation_id: conversationId });
    });

    socket.on('message', async ({ content }) => {
      if (!conversationId) return;
      await supabaseService.from('messages').insert({ conversation_id: conversationId, role: 'user', content });
      // Fan-out to any assigned agent
      io.of('/ws/agent').to(conversationId).emit('customer_message', { conversation_id: conversationId, content });
    });

    socket.on('disconnect', () => { /* noop */ });
  });

  // AGENT SOCKETS
  agentNS.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      socket.data.agent = payload;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  agentNS.on('connection', async (socket) => {
    const agent = socket.data.agent;

    socket.on('set_online', async (is_online) => {
      await supabaseService.from('agent_status')
        .upsert({ agent_id: agent.id, is_online, last_seen_at: new Date().toISOString() });
      socket.emit('queue', getQueue());
    });

    socket.on('pull_next', async () => {
      const item = dequeueHandoff();
      if (!item) return socket.emit('queue_empty');
      // Assign conversation to this agent
      await supabaseService.from('conversations')
        .update({ status: 'assigned', assigned_agent_id: agent.id, updated_at: new Date().toISOString() })
        .eq('id', item.conversationId);
      socket.join(item.conversationId);
      socket.emit('assigned', { conversation_id: item.conversationId });
    });

    socket.on('agent_message', async ({ conversation_id, content }) => {
      await supabaseService.from('messages').insert({ conversation_id, role: 'agent', content });
      // Relay to customer socket room
      io.of('/ws/customer').to(conversation_id).emit('agent_message', { conversation_id, content });
    });

    socket.on('disconnect', async () => {
      await supabaseService.from('agent_status')
        .upsert({ agent_id: agent.id, is_online: false, last_seen_at: new Date().toISOString() });
    });
  });
}

