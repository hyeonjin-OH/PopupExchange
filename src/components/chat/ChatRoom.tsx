import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getChatRoom, createChatRoom, saveChatMessage, getChatMessages } from '@/lib/firebase';
import { Message } from '@/types/chat';

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

      // 채팅방 ID 생성 (게시글 ID와 현재 사용자 ID를 조합)
      const currentChatId = `${postId}_${user.uid}`;
      
      // 채팅방이 존재하는지 확인
      let existingChatId = await getChatRoom(postId, user.uid);
      
      if (!existingChatId) {
        // 채팅방이 없으면 새로 생성
        existingChatId = await createChatRoom(postId, user.uid);
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
  }, [postId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !user || !ws) return;

    const message: Message = {
      text: newMessage,
      sender: user.username || '익명',
      senderId: user.uid,
      timestamp: new Date().toISOString(),
    };

    // WebSocket으로 메시지 전송
    ws.send(JSON.stringify({
      type: 'message',
      chatId,
      ...message
    }));

    // Firebase에 메시지 저장
    await saveChatMessage(chatId, message);
    setMessages([...messages, message]);
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
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 border rounded-l-lg p-2"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600"
          >
            전송
          </button>
        </div>
      </form>
    </div>
  );
} 