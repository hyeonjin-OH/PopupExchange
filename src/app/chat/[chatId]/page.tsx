'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getChatMessages, saveChatMessage, getUserById, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Message } from '@/types/chat';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Updated ChatHeader Props
interface ChatHeaderProps {
  chatId: string;
  ws: WebSocket | null;
  isConnected: boolean;
  router: AppRouterInstance;
}

// ChatHeader component updated to fetch and display info, and add Leave button
function ChatHeader({ chatId, ws, isConnected, router }: ChatHeaderProps) {
  const { user } = useAuth();
  const [opponentUsername, setOpponentUsername] = useState<string | null>(null);
  const [postTitle, setPostTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chatId || !user) return;

    const fetchHeaderInfo = async () => {
      setIsLoading(true);
      try {
        // 1. Parse chatId
        const parts = chatId.split('_');
        if (parts.length < 3) {
            console.error("Invalid chatId format");
            return;
        }
        const postId = parts[0];
        const userId1 = parts[1];
        const userId2 = parts[2];

        // 2. Fetch Post Title
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
          setPostTitle(postSnap.data().title || '게시글');
        }

        // 3. Identify opponent and fetch their username
        const opponentId = userId1 === user.uid ? userId2 : userId1;
        if (opponentId) {
           const opponentData = await getUserById(opponentId);
           // @ts-ignore - Assuming username exists on fetched data
           setOpponentUsername(opponentData?.username || '상대방');
        } else {
           setOpponentUsername('상대방'); // Fallback
        }

      } catch (error) {
        console.error("Error fetching chat header info:", error);
        // Set default values on error
        setPostTitle('채팅');
        setOpponentUsername('상대방');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeaderInfo();
  }, [chatId, user]);

  const handleLeaveChat = () => {
    if (ws && isConnected) {
      console.log('Leaving chat room and closing WebSocket');
      ws.send(JSON.stringify({ type: 'leave', chatId }));
      ws.close(); // Close the WebSocket connection
    }
    router.push('/posts'); // Navigate back to posts list
  };

  const handleGoToList = () => {
      router.push('/posts'); // Navigate to posts list
  };

  return (
    <header className="sticky top-0 z-10 bg-white border-b p-4 flex items-center justify-between">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={handleGoToList} className="mr-2" aria-label="Back to posts">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Button>
        <div>
            <h1 className="text-lg font-semibold leading-tight">
                {isLoading ? '로딩중...' : opponentUsername || '상대방'}
            </h1>
            {postTitle && !isLoading && (
                <p className="text-sm text-gray-500 leading-tight truncate max-w-xs">{postTitle}</p>
            )}
        </div>
      </div>
      <div className="flex flex-col space-y-1 items-end">
        <Button variant="outline" size="sm" onClick={handleLeaveChat}>
            채팅 나가기
        </Button>
        <Button variant="ghost" size="sm" onClick={handleGoToList} className="text-gray-600">
            목록으로
        </Button>
      </div>
    </header>
  );
}

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!chatId) return;
    const fetchMessages = async () => {
      const loadedMessages = await getChatMessages(chatId);
      setMessages(loadedMessages);
    };
    fetchMessages();
  }, [chatId]);

  useEffect(() => {
    if (!chatId || !user) return;

    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001';
    const socket = new WebSocket(wsUrl);
    setWs(socket);

    socket.onopen = () => {
      console.log('WebSocket 연결 성공');
      setIsConnected(true);
      socket.send(JSON.stringify({ type: 'join', chatId }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Message received:", data);
        if (data.type === 'message' && data.chatId === chatId) {
          if (data.senderId && data.sender && data.text && data.timestamp) {
             setMessages(prev => {
               if (data.id && prev.some(msg => msg.id === data.id)) {
                 return prev;
               }
               const newMessage = { ...data, id: data.id || 'ws-' + Date.now() } as Message;
               return [...prev, newMessage];
             });
          } else {
             console.warn("Received incomplete message structure:", data);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket 연결 종료');
      setIsConnected(false);
      setWs(null);
    };

    socket.onerror = (error) => {
      console.error('WebSocket 오류:', error);
      setIsConnected(false);
      setWs(null);
    };

    return () => {
      console.log('Cleaning up WebSocket connection for effect run');
      if (socket && socket.readyState === WebSocket.OPEN) {
        console.log('Closing WebSocket on cleanup');
        socket.close();
      }
      setIsConnected(false);
    };
  }, [chatId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !user || !ws || !isConnected) return;

    const localMessageText = newMessage.trim(); // Store text before clearing
    setNewMessage(''); // Clear input immediately for better UX

    const messageData: Omit<Message, 'id'> = {
      text: localMessageText,
      // @ts-ignore
      sender: user.username || user.email?.split('@')[0] || '익명',
      senderId: user.uid,
      timestamp: new Date().toISOString(),
    };

    try {
      // Send via WebSocket (others receive this)
      ws.send(JSON.stringify({
        type: 'message',
        chatId,
        ...messageData
      }));

      // Save message to Firestore and get the generated ID
      const savedMessageId = await saveChatMessage(chatId, messageData);

      // --- Optimistic Update for Sender --- 
      // Create the full message object including the ID from Firestore
      const messageForUI: Message = { 
          ...messageData, 
          id: savedMessageId 
      };
      // Add the message to the local state to display it immediately
      setMessages(prev => [...prev, messageForUI]);
      // --- End Optimistic Update ---

    } catch (error) {
      console.error('Error sending or saving message:', error);
      // Optional: Restore input field content if sending failed
      // setNewMessage(localMessageText);
      // TODO: Show error feedback to the user
    }
  };

  if (!user) {
    return <div className="p-4 text-center">로그인이 필요합니다.</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <ChatHeader chatId={chatId} ws={ws} isConnected={isConnected} router={router} />

      {/* Message List Area - Adjusted padding class */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message) => {
          const isSender = message.senderId === user.uid;
          return (
            // Row container - Using arbitrary value for padding
            <div key={message.id || message.timestamp} className="p-[4px]">
              {/* Alignment container */}
              <div className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                {/* Content container (timestamp + bubble) */}
                <div className={`inline-flex items-end gap-2`}> 
                  {/* Timestamp */}
                  <div className="text-[10px] text-gray-500 pb-0.5 whitespace-nowrap">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {/* Message Bubble */}
                  <div
                    className={`max-w-[calc(100%-4rem)] sm:max-w-[85%] p-3 rounded-lg shadow-sm ${isSender ? 'bg-[#FFE34F] text-black rounded-br-none' : 'bg-white text-black rounded-bl-none'}`}
                  >
                    <p className="text-base break-words">{message.text}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area (remains the same) */}
      <div className="bg-white p-4 border-t sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1"
            autoComplete="off"
            disabled={!isConnected}
          />
          <Button type="submit" disabled={!newMessage.trim() || !isConnected}>
            전송
          </Button>
        </form>
        {!isConnected && (
            <p className="text-xs text-red-500 mt-1 text-center">연결 중이거나 끊어졌습니다...</p>
        )}
      </div>
    </div>
  );
} 