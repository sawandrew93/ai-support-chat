<script>
(async function(){
  const apiBase = location.origin;
  const ws = io(apiBase + '/ws/customer', { transports: ['websocket'] });

  let conversationId = null;
  const messagesDiv = document.getElementById('messages');
  const input = document.getElementById('msg');
  const sendBtn = document.getElementById('send');
  const handoffDiv = document.getElementById('handoff');

  async function startConversation() {
    const res = await fetch(apiBase + '/api/chat/start', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({}) });
    const data = await res.json();
    conversationId = data.conversation_id;
    ws.emit('start', { conversation_id: conversationId });
  }

  function append(role, text) {
    const el = document.createElement('div');
    el.className = 'msg ' + role;
    el.textContent = text;
    messagesDiv.appendChild(el);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  sendBtn.onclick = async () => {
    const text = input.value.trim();
    if (!text) return;
    append('user', text);
    input.value = '';

    const res = await fetch(apiBase + '/api/chat/message', {
      method: 'POST',
      headers: {'content-type':'application/json'},
      body: JSON.stringify({ conversation_id: conversationId, message: text })
    });
    const data = await res.json();
    append('assistant', data.reply);
    if (data.handoff) {
      handoffDiv.style.display = 'block';
    }
    ws.emit('message', { content: text });
  };

  ws.on('agent_message', ({ content }) => {
    append('agent', 'Agent: ' + content);
  });

  await startConversation();
})();
</script>
<script>
(async function(){
  const apiBase = location.origin;
  const ws = io(apiBase + '/ws/customer', { transports: ['websocket'] });

  let conversationId = null;
  const messagesDiv = document.getElementById('messages');
  const input = document.getElementById('msg');
  const sendBtn = document.getElementById('send');
  const handoffDiv = document.getElementById('handoff');

  async function startConversation() {
    const res = await fetch(apiBase + '/api/chat/start', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({}) });
    const data = await res.json();
    conversationId = data.conversation_id;
    ws.emit('start', { conversation_id: conversationId });
  }

  function append(role, text) {
    const el = document.createElement('div');
    el.className = 'msg ' + role;
    el.textContent = text;
    messagesDiv.appendChild(el);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  sendBtn.onclick = async () => {
    const text = input.value.trim();
    if (!text) return;
    append('user', text);
    input.value = '';

    const res = await fetch(apiBase + '/api/chat/message', {
      method: 'POST',
      headers: {'content-type':'application/json'},
      body: JSON.stringify({ conversation_id: conversationId, message: text })
    });
    const data = await res.json();
    append('assistant', data.reply);
    if (data.handoff) {
      handoffDiv.style.display = 'block';
    }
    ws.emit('message', { content: text });
  };

  ws.on('agent_message', ({ content }) => {
    append('agent', 'Agent: ' + content);
  });

  await startConversation();
})();
</script>
<script>
(async function(){
  const apiBase = location.origin;
  const ws = io(apiBase + '/ws/customer', { transports: ['websocket'] });

  let conversationId = null;
  const messagesDiv = document.getElementById('messages');
  const input = document.getElementById('msg');
  const sendBtn = document.getElementById('send');
  const handoffDiv = document.getElementById('handoff');

  async function startConversation() {
    const res = await fetch(apiBase + '/api/chat/start', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({}) });
    const data = await res.json();
    conversationId = data.conversation_id;
    ws.emit('start', { conversation_id: conversationId });
  }

  function append(role, text) {
    const el = document.createElement('div');
    el.className = 'msg ' + role;
    el.textContent = text;
    messagesDiv.appendChild(el);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  sendBtn.onclick = async () => {
    const text = input.value.trim();
    if (!text) return;
    append('user', text);
    input.value = '';

    const res = await fetch(apiBase + '/api/chat/message', {
      method: 'POST',
      headers: {'content-type':'application/json'},
      body: JSON.stringify({ conversation_id: conversationId, message: text })
    });
    const data = await res.json();
    append('assistant', data.reply);
    if (data.handoff) {
      handoffDiv.style.display = 'block';
    }
    ws.emit('message', { content: text });
  };

  ws.on('agent_message', ({ content }) => {
    append('agent', 'Agent: ' + content);
  });

  await startConversation();
})();
</script>

