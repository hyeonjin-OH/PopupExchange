'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tradeType: '',
    tradeMethod: '',
    price: '',
  });

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postDoc = await getDoc(doc(db, 'posts', params.id as string));
        if (postDoc.exists()) {
          const data = postDoc.data();
          const postData = {
            id: postDoc.id,
            ...data,
            authorId: data.authorId || data.author,
          } as Post;

          if (postData.authorId !== user?.uid) {
            router.push(`/posts/${params.id}`);
            return;
          }

          setPost(postData);
          setFormData({
            title: postData.title,
            content: postData.content,
            tradeType: postData.tradeType,
            tradeMethod: postData.tradeMethod,
            price: postData.price?.toString() || '',
          });
        }
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.id, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;

    try {
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        title: formData.title,
        content: formData.content,
        tradeType: formData.tradeType,
        tradeMethod: formData.tradeMethod,
        price: formData.price ? Number(formData.price) : null,
        updatedAt: new Date().toISOString(),
      });

      router.push(`/posts/${post.id}`);
    } catch (error) {
      console.error('Error updating post:', error);
    }
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
        <Card className="max-w-4xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-6">게시글 수정</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                제목
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                내용
              </label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                className="min-h-[200px]"
              />
            </div>

            <div>
              <label htmlFor="tradeType" className="block text-sm font-medium text-gray-700 mb-1">
                거래 유형
              </label>
              <Select
                value={formData.tradeType}
                onValueChange={(value) => setFormData({ ...formData, tradeType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="거래 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="판매">판매</SelectItem>
                  <SelectItem value="구매">구매</SelectItem>
                  <SelectItem value="교환">교환</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="tradeMethod" className="block text-sm font-medium text-gray-700 mb-1">
                거래 방식
              </label>
              <Select
                value={formData.tradeMethod}
                onValueChange={(value) => setFormData({ ...formData, tradeMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="거래 방식 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="직접거래">직접거래</SelectItem>
                  <SelectItem value="택배거래">택배거래</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                가격 (원)
              </label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="가격을 입력하세요"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/posts/${post.id}`)}
              >
                취소
              </Button>
              <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white">
                수정하기
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
} 