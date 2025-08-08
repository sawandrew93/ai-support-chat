<script>
(async function(){
  const apiBase = location.origin;
  let token = null;
  let currentConv = null;
  let ws = null;

  const loginDiv = document.getElementById('login');
  const appDiv = document.getElementById('app');

  document.getElementById('loginBtn').onclick = async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const res = await fetch(apiBase + '/api/auth/login', {
      method: 'POST',
      headers: {'content-type':'application/json'},
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    token = data.token;
    if (!token) return alert('Login failed');
    loginDiv.style.display = 'none';
    appDiv.style.display = 'block';
    ws = io(apiBase + '/ws/agent', { auth: { token }, transports: ['websocket'] });

    ws.on('customer_message', ({ content }) => {
      append('Customer: ' + content);
    });

    ws.on('assigned', ({ conversation_id }) => {
      currentConv = conversation_id;
      append('Assigned conversation: ' + conversation_id);
    });

    ws.on('queue', (q) => {
      document.getElementById('status').textContent = 'Queue: ' + q.length + ' pending';
    });

    ws.on('queue_empty', () => {
      append('Queue is empty.');
    });
  };

  document.getElementById('onlineBtn').onclick = () => {
    ws.emit('set_online', true);
  };
  document.getElementById('pullBtn').onclick = () => {
    ws.emit('pull_next');
  };
  document.getElementById('send').onclick = () => {
    const text = document.getElementById('reply').value.trim();
    if (!text || !currentConv) return;
    ws.emit('agent_message', { conversation_id: currentConv, content: text });
    append('You: ' + text);
    document.getElementById('reply').value = '';
  };

  function append(text) {
    const div = document.createElement('div');
    div.className = 'msg';
    div.textContent = text;
    document.getElementById('conv').appendChild(div);
  }
})();
</script>

