const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// 채팅방별로 연결된 클라이언트를 관리
const chatRooms = new Map();

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);

      switch (data.type) {
        case 'join':
          handleJoin(ws, data.chatId);
          break;
        case 'message':
          handleMessage(ws, data);
          break;
        case 'leave':
          handleLeave(ws, data.chatId);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // 연결이 끊어진 클라이언트를 모든 채팅방에서 제거
    chatRooms.forEach((clients, chatId) => {
      if (clients.has(ws)) {
        clients.delete(ws);
        if (clients.size === 0) {
          chatRooms.delete(chatId);
        }
      }
    });
  });
});

function handleJoin(ws, chatId) {
  console.log(`Client joining chat room: ${chatId}`);
  if (!chatRooms.has(chatId)) {
    chatRooms.set(chatId, new Set());
  }
  chatRooms.get(chatId).add(ws);
}

function handleMessage(ws, data) {
  const { chatId, ...messageData } = data;
  console.log(`Broadcasting message to chat room: ${chatId}`);
  
  const clients = chatRooms.get(chatId);
  if (clients) {
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'message',
          chatId,
          ...messageData
        }));
      }
    });
  }
}

function handleLeave(ws, chatId) {
  console.log(`Client leaving chat room: ${chatId}`);
  const clients = chatRooms.get(chatId);
  if (clients) {
    clients.delete(ws);
    if (clients.size === 0) {
      chatRooms.delete(chatId);
    }
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
}); 