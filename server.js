const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 채팅방 관리를 위한 Map
const chatRooms = new Map();

wss.on('connection', (ws) => {
  console.log('새로운 클라이언트가 연결되었습니다.');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'join':
          // 채팅방에 참여
          if (!chatRooms.has(data.chatId)) {
            chatRooms.set(data.chatId, new Set());
          }
          chatRooms.get(data.chatId).add(ws);
          break;

        case 'message':
          // 메시지 전송
          if (chatRooms.has(data.chatId)) {
            const messageData = {
              type: 'message',
              text: data.text,
              sender: data.sender,
              senderId: data.senderId,
              timestamp: new Date().toISOString(),
            };

            // 해당 채팅방의 모든 클라이언트에게 메시지 전송
            chatRooms.get(data.chatId).forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(messageData));
              }
            });
          }
          break;

        case 'leave':
          // 채팅방에서 나가기
          if (chatRooms.has(data.chatId)) {
            chatRooms.get(data.chatId).delete(ws);
            if (chatRooms.get(data.chatId).size === 0) {
              chatRooms.delete(data.chatId);
            }
          }
          break;
      }
    } catch (error) {
      console.error('메시지 처리 중 오류 발생:', error);
    }
  });

  ws.on('close', () => {
    // 연결이 끊어졌을 때 모든 채팅방에서 제거
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
}); 