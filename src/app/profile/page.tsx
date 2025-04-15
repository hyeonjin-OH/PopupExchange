'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  lastMessage: string;
  lastMessageTime: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        // 사용자의 게시글 가져오기
        const postsQuery = query(
          collection(db, 'posts'),
          where('authorId', '==', user.uid)
        );
        const postsSnapshot = await getDocs(postsQuery);
        const postsData = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        setPosts(postsData);

        // 사용자의 채팅 목록 가져오기
        const chatsQuery = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', user.uid)
        );
        const chatsSnapshot = await getDocs(chatsQuery);
        const chatsData = await Promise.all(
          chatsSnapshot.docs.map(async doc => {
            const chatData = doc.data();
            const postDoc = await getDocs(query(
              collection(db, 'posts'),
              where('id', '==', chatData.postId)
            ));
            const postTitle = postDoc.docs[0]?.data().title || '제목 없음';
            
            return {
              id: doc.id,
              postId: chatData.postId,
              postTitle,
              lastMessage: chatData.lastMessage || '',
              lastMessageTime: chatData.lastMessageTime || ''
            };
          })
        );
        setChats(chatsData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-white p-6 sm:p-8 rounded-2xl">
          <div className="space-y-8">
            {/* 사용자 정보 */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl text-gray-600">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user?.username}</h1>
                <p className="text-gray-500">{user?.email}</p>
              </div>
            </div>

            {/* 내 게시글 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">내 게시글</h2>
              {posts.length > 0 ? (
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
              {chats.length > 0 ? (
                <div className="space-y-4">
                  {chats.map((chat) => (
                    <Card key={chat.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{chat.postTitle}</h3>
                          <p className="text-sm text-gray-500">
                            마지막 메시지: {new Date(chat.lastMessage?.timestamp || chat.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/posts/${chat.postId}`)}
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
      </div>
    </main>
  );
} 