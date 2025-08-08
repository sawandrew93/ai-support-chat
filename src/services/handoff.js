// In-memory queue for MVP. For production, move to DB or Redis.
const queue = []; // items: { conversationId, customerId, createdAt }

export function enqueueHandoff(conversationId, customerId) {
  queue.push({ conversationId, customerId, createdAt: Date.now() });
}

export function dequeueHandoff() {
  return queue.shift() || null;
}

export function getQueue() {
  return [...queue];
}

