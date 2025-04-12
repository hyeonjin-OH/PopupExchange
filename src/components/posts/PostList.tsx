"use client";

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  tradeType: string;
  tradeMethod: string;
  price?: number;
  storeId: string;
  storeName?: string;
}

interface PostListProps {
  storeId?: string;
}

export default function PostList({ storeId }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        let q = collection(db, 'posts');
        if (storeId) {
          q = query(q, where('storeId', '==', storeId));
        }
        const querySnapshot = await getDocs(q);
        const postsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];

        // Fetch store names for posts
        const storeIds = [...new Set(postsData.map(post => post.storeId))];
        const storeSnapshots = await Promise.all(
          storeIds.map(id => getDocs(query(collection(db, 'popupStores'), where('id', '==', id))))
        );
        
        const storeNames = new Map();
        storeSnapshots.forEach(snapshot => {
          snapshot.docs.forEach(doc => {
            storeNames.set(doc.id, doc.data().name);
          });
        });

        const postsWithStoreNames = postsData.map(post => ({
          ...post,
          storeName: storeNames.get(post.storeId) || '알 수 없는 스토어'
        }));

        setPosts(postsWithStoreNames);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [storeId]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (posts.length === 0) {
    return <div className="text-center py-8">No posts found.</div>;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Link href={`/posts/${post.id}`} key={post.id}>
          <div className="border border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-colors duration-200 cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{post.title}</h3>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700">
                  {post.tradeType}
                </span>
                {!storeId && (
                  <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700">
                    {post.storeName}
                  </span>
                )}
              </div>
            </div>
            <p className="text-gray-600 mb-4 line-clamp-2">{post.content}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <span>{post.author}</span>
                <span>{post.tradeMethod}</span>
                {post.price && <span>{post.price.toLocaleString()}원</span>}
              </div>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 