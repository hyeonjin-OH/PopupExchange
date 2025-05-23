import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getChatRoom, createChatRoom, saveChatMessage, getChatMessages } from '@/lib/firebase';
import { Message } from '@/types/chat';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ChatRoomProps {
  postId: string;
  postAuthorId: string;
  onClose: () => void;
}

export default function ChatRoom({ postId, postAuthorId, onClose }: ChatRoomProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeChat = async () => {
      if (!user) return;

      // Check if postAuthorId is the same as the current user's ID
      if (user.uid === postAuthorId) {
        console.log("Cannot initiate chat with oneself.");
        // Optionally close the chat window or show a message
        // onClose(); 
        return; // Prevent further execution
      }

      // 채팅방 조회 또는 생성
      let existingChatId = await getChatRoom(postId, user.uid, postAuthorId);
      
      if (!existingChatId) {
        // 채팅방이 없으면 새로 생성
        existingChatId = await createChatRoom(postId, user.uid, postAuthorId);
      }
      
      setChatId(existingChatId);
      
      // 기존 메시지 로드
      const loadedMessages = await getChatMessages(existingChatId);
      setMessages(loadedMessages);

      // WebSocket 연결
      const socket = new WebSocket('ws://localhost:3001');
      setWs(socket);

      socket.onopen = () => {
        console.log('WebSocket 연결 성공');
        // 채팅방 참여 메시지 전송
        socket.send(JSON.stringify({
          type: 'join',
          chatId: existingChatId
        }));
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          setMessages(prev => [...prev, data]);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket 연결 종료');
      };

      return () => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'leave',
            chatId: existingChatId
          }));
          socket.close();
        }
      };
    };

    initializeChat();
  }, [postId, user, postAuthorId, onClose]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !user || !ws) return;

    const messageData: Omit<Message, 'id'> = {
      text: newMessage,
      // @ts-ignore - user 객체에 username이 있다고 사용자가 확인
      sender: user.username || '익명',
      senderId: user.uid,
      timestamp: new Date().toISOString(),
    };

    // WebSocket으로 메시지 전송 (메시지 구조 확인 필요)
    ws.send(JSON.stringify({
      type: 'message',
      chatId,
      ...messageData
    }));

    // Firebase에 메시지 저장 (ID는 Firebase에서 생성)
    await saveChatMessage(chatId, messageData);

    // Optimistic update (assuming WebSocket will deliver)
    // setMessages(prev => [...prev, { ...messageData, id: 'temp-id-' + Date.now() }]); // Consider adding temp message

    setNewMessage('');
  };

  return (
    <div className="fixed bottom-0 right-0 w-96 h-96 bg-white shadow-lg rounded-t-lg flex flex-col">
      <div className="bg-gray-800 text-white p-4 rounded-t-lg flex justify-between items-center">
        <h3 className="font-semibold">채팅방</h3>
        <button onClick={onClose} className="text-white hover:text-gray-300">
          ✕
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${
              message.senderId === user?.uid ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                message.senderId === user?.uid
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <div className="text-xs text-gray-400 mb-1">
                {message.sender}
              </div>
              <div>{message.text}</div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 border rounded-l-lg p-2 rounded-r-none"
          />
          <Button
            type="submit"
            className="rounded-l-none"
          >
            전송
          </Button>
        </div>
      </form>
    </div>
  );
} 