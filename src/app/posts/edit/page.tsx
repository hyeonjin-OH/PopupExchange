'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

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
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [tradeType, setTradeType] = useState('');
  const [tradeMethod, setTradeMethod] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

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
          setPost({
            id: postDoc.id,
            ...data,
          } as Post);
          setTitle(data.title);
          setContent(data.content);
          setPrice(data.price);
          setTradeType(data.tradeType);
          setTradeMethod(data.tradeMethod);
          setExistingImages(data.images || []);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setImages([...images, ...newImages]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleRemoveExistingImage = async (index: number) => {
    if (!post) return;
    
    try {
      const imageUrl = existingImages[index];
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      
      const newExistingImages = [...existingImages];
      newExistingImages.splice(index, 1);
      setExistingImages(newExistingImages);
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !user) return;

    try {
      setUploading(true);
      const postRef = doc(db, 'posts', post.id);

      // Upload new images
      const newImageUrls = await Promise.all(
        images.map(async (image) => {
          const imageRef = ref(storage, `posts/${post.id}/${image.name}`);
          await uploadBytes(imageRef, image);
          return await getDownloadURL(imageRef);
        })
      );

      // Update post
      await updateDoc(postRef, {
        title,
        content,
        price,
        tradeType,
        tradeMethod,
        images: [...existingImages, ...newImageUrls],
        updatedAt: new Date().toISOString(),
      });

      sessionStorage.setItem('currentPostId', post.id);
      router.push('/posts/detail');
    } catch (error) {
      console.error('Error updating post:', error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!post || user?.uid !== post.authorId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">접근 권한이 없습니다</h1>
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
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">제목</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">내용</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="내용을 입력하세요"
                  required
                  className="min-h-[200px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">거래 유형</label>
                <select
                  value={tradeType}
                  onChange={(e) => setTradeType(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">선택하세요</option>
                  <option value="판매">판매</option>
                  <option value="교환">교환</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">거래 방식</label>
                <select
                  value={tradeMethod}
                  onChange={(e) => setTradeMethod(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">선택하세요</option>
                  <option value="직접 거래">직접 거래</option>
                  <option value="택배 거래">택배 거래</option>
                </select>
              </div>

              {tradeType === '판매' && (
                <div>
                  <label className="block text-sm font-medium mb-2">가격 (원)</label>
                  <Input
                    type="number"
                    value={price || ''}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="가격을 입력하세요"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">이미지</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {existingImages.map((image, index) => (
                    <div key={index} className="relative aspect-square">
                      <Image
                        src={image}
                        alt={`Image ${index + 1}`}
                        fill
                        className="object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {images.map((image, index) => (
                    <div key={index} className="relative aspect-square">
                      <Image
                        src={URL.createObjectURL(image)}
                        alt={`New image ${index + 1}`}
                        fill
                        className="object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="mt-2"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    sessionStorage.setItem('currentPostId', post.id);
                    router.push('/posts/detail');
                  }}
                >
                  취소
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? '수정 중...' : '수정하기'}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
} 