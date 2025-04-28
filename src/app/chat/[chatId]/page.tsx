'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getChatMessages, saveChatMessage, getUserById, db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { Message } from '@/types/chat';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';

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
        <div>
          <h1 className="text-lg font-semibold leading-tight">
            {isLoading ? '로딩중...' : postTitle || '채팅'}
          </h1>
          {opponentUsername && !isLoading && (
            <p className="text-sm text-gray-500 leading-tight truncate max-w-xs">
              {opponentUsername}님과의 채팅
            </p>
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
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const addMessage = useCallback((message: Message) => {
    if (processedMessageIds.current.has(message.id)) {
      return;
    }
    processedMessageIds.current.add(message.id);
    setMessages(prev => [...prev, message]);
  }, []);

  useEffect(() => {
    if (!chatId || !user) return;
    const fetchMessages = async () => {
      try {
        const loadedMessages = await getChatMessages(chatId);
        loadedMessages.forEach(message => {
          processedMessageIds.current.add(message.id);
        });
        setMessages(loadedMessages);

        // 실시간 리스너 설정
        const chatRef = doc(db, 'chats', chatId);
        const messagesRef = collection(chatRef, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const newMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Message[];
          
          newMessages.forEach(message => {
            if (!processedMessageIds.current.has(message.id)) {
              addMessage(message);
            }
          });
        });

        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('Error fetching messages:', error);
        if (error instanceof Error && error.message.includes('auth/invalid-credential')) {
          router.push('/login');
        }
      }
    };
    fetchMessages();
  }, [chatId, user, router, addMessage]);

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
            // 내가 보낸 메시지는 이미 로컬 상태에 있으므로 무시합니다
            if (data.senderId === user.uid) return;
            
            const newMessage = { 
              ...data, 
              id: data.id || `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
            } as Message;
            
            addMessage(newMessage);
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
  }, [chatId, user, addMessage]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !user || !ws || !isConnected) return;

    const localMessageText = newMessage.trim();
    setNewMessage('');

    const messageData: Omit<Message, 'id'> = {
      text: localMessageText,
      sender: user.username || user.email?.split('@')[0] || '익명',
      senderId: user.uid,
      timestamp: new Date().toISOString(),
    };

    try {
      // Firestore에 먼저 저장하고 ID를 받아옵니다
      const savedMessageId = await saveChatMessage(chatId, messageData);
      const messageForUI: Message = { 
        ...messageData, 
        id: savedMessageId 
      };

      // 로컬 상태에 메시지를 추가합니다
      addMessage(messageForUI);

      // WebSocket으로 메시지를 보냅니다
      ws.send(JSON.stringify({
        type: 'message',
        chatId,
        ...messageForUI
      }));
    } catch (error) {
      console.error('Error sending or saving message:', error);
      if (error instanceof Error && error.message.includes('auth/invalid-credential')) {
        router.push('/login');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">로딩 중...</div>;
  }

  if (!user) {
    return <div className="p-4 text-center">로그인이 필요합니다.</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <ChatHeader chatId={chatId} ws={ws} isConnected={isConnected} router={router} />
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 flex flex-col">
        <Card className="bg-white shadow-lg rounded-lg flex-1 flex flex-col">
          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto p-4 max-h-[calc(100vh-16rem)]">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={`${message.id}-${message.timestamp}`}
                  className={`flex ${message.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.senderId === user.uid
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div>{message.text}</div>
                    <div className="text-xs mt-1 opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* 메시지 입력 */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                className="flex-1"
              />
              <Button onClick={handleSendMessage}>전송</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 