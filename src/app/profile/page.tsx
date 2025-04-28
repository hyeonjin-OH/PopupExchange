'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatRoom from '@/components/chat/ChatRoom';
import { createPortal } from 'react-dom';

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  tradeType: string;
  tradeMethod: string;
  price?: number;
}

interface Chat {
  id: string;
  postId: string;
  postTitle: string;
  otherUserId: string;  // 채팅 상대방 ID
  otherUsername: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (!user) return;

    const fetchUserData = async () => {
      try {
        // 사용자의 게시글 가져오기
        console.log('Fetching posts for user:', user.uid);
        const postsQuery = query(
          collection(db, 'posts'),
          where('author', '==', user.uid)
        );
        const postsSnapshot = await getDocs(postsQuery);
        console.log('Posts snapshot:', postsSnapshot);
        console.log('Posts snapshot docs:', postsSnapshot.docs);
        
        const postsData = postsSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Post data:', data);
          return {
            id: doc.id,
            ...data
          };
        }) as Post[];
        console.log('Processed posts data:', postsData);
        setPosts(postsData);

        // 사용자의 채팅 목록 가져오기
        const chatsQuery = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', user.uid)
        );
        const chatsSnapshot = await getDocs(chatsQuery);
        
        const chatsData = await Promise.all(
          chatsSnapshot.docs.map(async chatDoc => {
            const chatData = chatDoc.data();
            
            // 게시글 정보 가져오기
            const postDoc = await getDoc(doc(db, 'posts', chatData.postId));
            const postData = postDoc.data() as { title: string } | undefined;
            const postTitle = postData?.title || '제목 없음';

            // 채팅 상대방 ID 찾기
            const otherUserId = chatData.participants.find((id: string) => id !== user.uid) || '';
            
            // 상대방 사용자 정보 가져오기
            let otherUsername = '익명';
            if (otherUserId) {
              const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
              const otherUserData = otherUserDoc.data() as { username: string } | undefined;
              otherUsername = otherUserData?.username || '익명';
            }

            return {
              id: chatDoc.id,
              postId: chatData.postId,
              postTitle,
              otherUserId,
              otherUsername
            };
          })
        );
        setChats(chatsData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, loading, router]);

  const handleChatClose = () => {
    setActiveChatId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null; // 로그인 페이지로 리다이렉트 중이므로 아무것도 렌더링하지 않음
  }

  return (
    <main className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-white p-6 sm:p-8 rounded-2xl">
          <div className="space-y-8">
            {/* 사용자 정보 */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user?.username}</h1>
              </div>
            </div>

            {/* 내 게시글 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">내 게시글</h2>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
                  <span className="ml-2 text-gray-600">게시글을 불러오는 중...</span>
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Card key={post.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{post.title}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/posts/${post.id}`)}
                        >
                          보기
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">등록된 게시글이 없습니다.</p>
              )}
            </div>

            {/* 구분선 */}
            <div className="border-t border-gray-200 my-12"></div>

            {/* 채팅 목록 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">채팅 목록</h2>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
                  <span className="ml-2 text-gray-600">채팅방을 불러오는 중...</span>
                </div>
              ) : chats.length > 0 ? (
                <div className="space-y-4">
                  {chats.map((chat) => (
                    <Card key={chat.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{chat.postTitle}</h3>
                          <p className="text-sm text-gray-500 mt-1">{chat.otherUsername}님과의 채팅</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            sessionStorage.setItem('currentChatId', chat.id);
                            router.push('/chat');
                          }}
                        >
                          채팅하기
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">진행 중인 채팅이 없습니다.</p>
              )}
            </div>
          </div>
        </Card>

        {/* 채팅방 */}
        {activeChatId && createPortal(
          <ChatRoom
            postId={chats.find(chat => chat.id === activeChatId)?.postId || ''}
            postAuthorId={chats.find(chat => chat.id === activeChatId)?.otherUserId || ''}
            onClose={handleChatClose}
          />,
          document.body
        )}
      </div>
    </main>
  );
} 