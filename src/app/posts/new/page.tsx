'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { auth } from '@/lib/firebase';

interface PostFormData {
  title: string;
  content: string;
  tradeType: string;
  tradeMethod: string;
  price: number;
  storeId: string;
  images: string[];
}

export default function NewPostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    content: '',
    tradeType: '판매',
    tradeMethod: '직거래',
    price: 0,
    storeId: '',
    images: []
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imageFiles.length > 10) {
      alert('이미지는 최대 10개까지 업로드할 수 있습니다.');
      return;
    }

    const newFiles = files.filter(file => file.type.startsWith('image/'));
    setImageFiles(prev => [...prev, ...newFiles]);

    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index]);
      return newUrls;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const uploadedUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const imageRef = ref(storage, `posts/${Date.now()}-${file.name}`);
          const snapshot = await uploadBytes(imageRef, file);
          return getDownloadURL(snapshot.ref);
        })
      );

      // Get current user's email and extract ID part
      const currentUser = auth.currentUser;
      const userEmail = currentUser?.email || 'anonymous';
      const userId = userEmail.split('@')[0];  // Get the part before @

      const postData = {
        ...formData,
        images: uploadedUrls,
        createdAt: new Date().toISOString(),
        author: userId
      };

      await addDoc(collection(db, 'posts'), postData);
      router.push('/posts');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('게시글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-white p-6 sm:p-8 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Label className="text-lg font-semibold">이미지</Label>
                <span className="text-sm text-gray-500">({imageFiles.length}/10)</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={handleImageClick}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-[#FFE34F] transition-colors"
                >
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                {imagePreviewUrls.map((url, index) => (
                  <div key={url} className="relative aspect-square">
                    <Image
                      src={url}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-black bg-opacity-60 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-80"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="제목을 입력해주세요"
                className="text-lg py-6 border-0 border-b rounded-none focus-visible:ring-0 px-0"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-600">거래 유형</Label>
                <Select
                  value={formData.tradeType}
                  onValueChange={(value: string) => {
                    setFormData({ 
                      ...formData, 
                      tradeType: value,
                      price: value === '교환' ? 0 : formData.price 
                    });
                  }}
                >
                  <SelectTrigger className="bg-gray-50">
                    <SelectValue placeholder="거래 유형 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="교환">교환</SelectItem>
                    <SelectItem value="판매">판매</SelectItem>
                    <SelectItem value="구매">구매</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-600">거래 방법</Label>
                <Select
                  value={formData.tradeMethod}
                  onValueChange={(value: string) => 
                    setFormData({ ...formData, tradeMethod: value })
                  }
                >
                  <SelectTrigger className="bg-gray-50">
                    <SelectValue placeholder="거래 방법 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="직거래">직거래</SelectItem>
                    <SelectItem value="택배">택배</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.tradeType !== '교환' && (
              <div className="space-y-2">
                <Label className="text-gray-600">가격</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="pl-7 bg-gray-50"
                    min="0"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="게시글 내용을 작성해주세요."
                className="min-h-[300px] resize-none bg-gray-50"
                required
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="px-6"
              >
                취소
              </Button>
              <Button
                type="submit"
                className="px-6 bg-[#FFE34F] hover:bg-[#FFD700] text-black"
                disabled={isSubmitting}
              >
                {isSubmitting ? '등록 중...' : '작성완료'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
} 