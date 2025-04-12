'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Post {
  id: string;  // Keep this for internal use only
  title: string;
  content: string;
  author: string;
  createdAt: string;
  tradeType: string;
  tradeMethod: string;
  price?: number;
  images: string[];
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postDoc = await getDoc(doc(db, 'posts', params.id as string));
        if (postDoc.exists()) {
          setPost({
            id: postDoc.id,
            ...postDoc.data()
          } as Post);
        }
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.id]);

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
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-white overflow-hidden">
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
                  <span>{post.author.includes('@') ? post.author.split('@')[0] : post.author}</span>
                  <span className="mx-2">·</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-sm rounded-full bg-gray-100">
                  {post.tradeType}
                </span>
                <span className="px-3 py-1 text-sm rounded-full bg-gray-100">
                  {post.tradeMethod}
                </span>
              </div>
            </div>

            {post.price !== undefined && (
              <div className="mb-6">
                <p className="text-2xl font-bold">
                  {post.price.toLocaleString()}원
                </p>
              </div>
            )}

            <div className="border-t pt-6">
              <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button
                variant="outline"
                onClick={() => router.push('/posts')}
              >
                목록으로
              </Button>
              <Button
                className="bg-[#FFE34F] hover:bg-[#FFD700] text-black"
                onClick={() => {}} // TODO: 채팅하기 기능 구현
              >
                채팅하기
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
} 