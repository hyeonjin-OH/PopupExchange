'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  createdAt: string;
  tradeType: string;
  tradeMethod: string;
  price?: number;
  images: string[];
}

export default function PostDetailPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postId = sessionStorage.getItem('currentPostId');
        if (!postId) {
          router.push('/posts');
          return;
        }
        
        const postDoc = await getDoc(doc(db, 'posts', postId));
        if (postDoc.exists()) {
          const data = postDoc.data();
          const authorId = data.authorId || (typeof data.author === 'string' && data.author.includes('_') ? data.author.split('_')[1] : data.author);
          setPost({
            id: postDoc.id,
            ...data,
            authorId: authorId,
          } as Post);
        } else {
          console.log("No such document!");
          router.push('/posts');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        router.push('/posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [router]);

  const handleChatClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!post || !post.authorId) {
        console.error('Post or author information is missing.');
        return;
    }
    if (user.uid === post.authorId) {
      console.log("Cannot chat with yourself.");
      return;
    }

    const user1Id = user.uid;
    const user2Id = post.authorId;
    const sortedUserIds = [user1Id, user2Id].sort();
    const chatId = `${post.id}_${sortedUserIds[0]}_${sortedUserIds[1]}`;

    sessionStorage.setItem('currentChatId', chatId);
    router.push('/chat');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">게시글을 찾을 수 없습니다</h1>
        <Button onClick={() => router.push('/posts')} variant="outline">
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          {post.images && post.images.length > 0 && (
            <div className="relative aspect-video bg-gray-100">
              <Image
                src={post.images[currentImageIndex]}
                alt={post.title}
                fill
                className="object-contain"
              />
              {post.images.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {post.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-[#FFE34F]' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
                <div className="flex items-center text-sm text-gray-500">
                  <span>작성자 : {post.author?.includes('@') ? post.author.split('@')[0] : post.author} &nbsp;&nbsp;&nbsp;</span>
                  <span>작성일 : {new Date(post.createdAt).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  }).replace(/\. /g, '-').replace(':', ':').replace(/-(\d{2}):/, ' $1:')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-sm rounded-full bg-gray-100">
                  {post.tradeType}
                </span>
                <span className="mx-2">&nbsp;&nbsp;/&nbsp;&nbsp;</span>
                <span className="px-3 py-1 text-sm rounded-full bg-gray-100">
                  {post.tradeMethod}
                </span>
              </div>
            </div>

            {post.price !== undefined && post.tradeType !== '교환' && (
              <div className="mb-6">
                <p className="text-2xl font-bold">
                  가격 : {post.price.toLocaleString()}원
                </p>
              </div>
            )}

            <div className="border-t pt-6">
              <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
            </div>

            <div className="mt-8 flex justify-between items-center border-t pt-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/posts')}
                    >
                        목록으로
                    </Button>
                </div>

                <div className="flex space-x-4">
                    {user?.uid === post.authorId && (
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/posts/${post.id}/edit`)}
                        >
                            수정하기
                        </Button>
                    )}

                    {user && user.uid !== post.authorId && (
                        <Button
                            className="bg-[#FFE34F] hover:bg-[#FFD700] text-black"
                            onClick={handleChatClick}
                        >
                            채팅하기
                        </Button>
                    )}
                    {!user && (
                        <Button
                            className="bg-[#FFE34F] hover:bg-[#FFD700] text-black"
                            onClick={() => router.push('/login')}
                        >
                            로그인 후 채팅하기
                        </Button>
                    )
                    }
                </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
} 