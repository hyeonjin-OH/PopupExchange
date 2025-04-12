'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
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

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const postsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        setPosts(postsData);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">중고거래 게시글</h1>
          <Link href="/posts/new">
            <Button className="bg-[#FFE34F] hover:bg-[#FFD700] text-black">
              글쓰기
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          {posts.map((post) => (
            <Link href={`/posts/${post.id}`} key={post.id}>
              <Card className="flex p-4 hover:shadow-md transition-shadow cursor-pointer">
                {post.images && post.images.length > 0 ? (
                  <div className="relative w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={post.images[0]}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}
                <div className="ml-4 flex-grow">
                  <h2 className="text-lg font-medium mb-1">{post.title}</h2>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <span>{post.tradeMethod}</span>
                    <span className="mx-1">·</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  {post.price !== undefined && (
                    <p className="text-lg font-bold">
                      {post.price.toLocaleString()}원
                    </p>
                  )}
                  <div className="flex items-center mt-2">
                    <span className="px-2 py-1 text-sm rounded-full bg-gray-100 text-gray-600">
                      {post.tradeType}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
} 