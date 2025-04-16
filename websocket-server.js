const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3001 });

// Store clients connected to each chat room
// Map<chatId: string, Set<WebSocketClient>>
const chatRooms = new Map();

console.log('WebSocket server started on port 3001');

wss.on('connection', (ws) => {
    console.log('Client connected');
    let currentChatId = null; // Keep track of the chat room this client joins

    ws.on('message', (message) => {
        let data;
        try {
            data = JSON.parse(message);
            // console.log('Received:', data); // Log received data for debugging
        } catch (e) {
            console.error('Failed to parse message or invalid message format:', message);
            return;
        }

        switch (data.type) {
            case 'join':
                currentChatId = data.chatId;
                if (!chatRooms.has(currentChatId)) {
                    chatRooms.set(currentChatId, new Set());
                }
                chatRooms.get(currentChatId).add(ws);
                console.log(`Client joined chat room: ${currentChatId}`);
                // Optionally notify others in the room
                // broadcast(currentChatId, JSON.stringify({ type: 'user_join', userId: 'some_user_id' }), ws);
                break;

            case 'message':
                if (currentChatId && chatRooms.has(currentChatId)) {
                    console.log(`Broadcasting message in room ${currentChatId}:`, data.text);
                    // Broadcast message to all clients in the same room, except the sender
                    broadcast(currentChatId, JSON.stringify(data), ws);
                } else {
                    console.log('Client tried to send message without joining a room or room does not exist.');
                }
                break;

            case 'leave':
                if (currentChatId && chatRooms.has(currentChatId)) {
                    console.log(`Client leaving chat room: ${currentChatId}`);
                    chatRooms.get(currentChatId).delete(ws);
                    // Clean up empty room
                    if (chatRooms.get(currentChatId).size === 0) {
                        chatRooms.delete(currentChatId);
                        console.log(`Chat room ${currentChatId} is now empty and removed.`);
                    }
                    currentChatId = null; // Reset current chat ID for this connection
                     // Optionally notify others
                    // broadcast(data.chatId, JSON.stringify({ type: 'user_leave', userId: 'some_user_id' }), ws);
                }
                break;

            default:
                console.log('Received unknown message type:', data.type);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        // Remove the client from the chat room they were in
        if (currentChatId && chatRooms.has(currentChatId)) {
            chatRooms.get(currentChatId).delete(ws);
             console.log(`Client removed from chat room ${currentChatId} due to disconnection.`);
             // Clean up empty room
            if (chatRooms.get(currentChatId).size === 0) {
                chatRooms.delete(currentChatId);
                console.log(`Chat room ${currentChatId} is now empty and removed.`);
            }
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
         // Ensure cleanup happens on error too
        if (currentChatId && chatRooms.has(currentChatId)) {
            chatRooms.get(currentChatId).delete(ws);
            console.log(`Client removed from chat room ${currentChatId} due to error.`);
            if (chatRooms.get(currentChatId).size === 0) {
                chatRooms.delete(currentChatId);
                 console.log(`Chat room ${currentChatId} is now empty and removed.`);
            }
        }
    });
});

// Helper function to broadcast messages to clients in a specific chat room
function broadcast(chatId, data, senderWs) {
    const room = chatRooms.get(chatId);
    if (room) {
        room.forEach((client) => {
            // Send to all clients in the room except the sender
            if (client !== senderWs && client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
} 