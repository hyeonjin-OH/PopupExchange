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
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-6">내 정보</h1>
          
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="posts">내 게시글</TabsTrigger>
              <TabsTrigger value="chats">채팅 목록</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="mt-6">
              {posts.length === 0 ? (
                <p className="text-gray-500">작성한 게시글이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {posts.map(post => (
                    <Card key={post.id} className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/posts/${post.id}`)}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{post.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                            {post.tradeType}
                          </span>
                          {post.price && (
                            <span className="font-semibold">
                              {post.price.toLocaleString()}원
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="chats" className="mt-6">
              {chats.length === 0 ? (
                <p className="text-gray-500">진행 중인 채팅이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {chats.map(chat => (
                    <Card key={chat.id} className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/posts/${chat.postId}`)}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{chat.postTitle}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {chat.lastMessage}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(chat.lastMessageTime).toLocaleTimeString()}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </main>
  );
} 