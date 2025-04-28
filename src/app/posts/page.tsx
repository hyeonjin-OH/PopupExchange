'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, getDoc, doc, DocumentData, QueryDocumentSnapshot, DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

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
  authorUsername: string;
  chatCount: number;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc')
        );
        const postsSnapshot = await getDocs(postsQuery);
        
        const postsData = await Promise.all(
          postsSnapshot.docs.map(async (docSnapshot: QueryDocumentSnapshot) => {
            const postData = docSnapshot.data() as DocumentData;
            const authorId = postData.author as string;
            
            // 작성자 정보 가져오기
            const authorRef = doc(db, 'users', authorId) as DocumentReference;
            const authorDoc = await getDoc(authorRef);
            const authorData = authorDoc.data() as { username: string } | undefined;
            
            // 해당 게시글에 연결된 채팅방 수 가져오기
            const chatsQuery = query(
              collection(db, 'chats'),
              where('postId', '==', docSnapshot.id)
            );
            const chatsSnapshot = await getDocs(chatsQuery);
            const chatCount = chatsSnapshot.size;

            const post = {
              id: docSnapshot.id,
              ...postData,
              authorUsername: authorData?.username || '익명',
              chatCount
            } as Post;

            console.log('Post data:', post);
            return post;
          })
        );
        
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
          <h1 className="text-2xl font-bold">게시글</h1>
          <Link href="/posts/new">
            <Button className="bg-[#FFE34F] hover:bg-[#FFD700] text-black">
              글쓰기
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          {posts.map((post) => (
            <Card 
              key={post.id} 
              className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => {
                sessionStorage.setItem('currentPostId', post.id);
                router.push('/posts/detail');
              }}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">{post.title}</h2>
                    <p className="text-sm text-gray-500">
                      {post.authorUsername}님 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;작성일 : {new Date(post.createdAt).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      }).replace(/\. /g, '-').replace(':', ':').replace(/-(\d{2}):/, ' $1:')}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {post.chatCount}개의 채팅방
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>교환방식: {post.tradeType}&nbsp;&nbsp;&nbsp;/</span>
                  <span>&nbsp;&nbsp;&nbsp;거래방식: {post.tradeMethod}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
} 