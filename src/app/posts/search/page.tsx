'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  images: string[];
  authorUsername: string;
  chatCount: number;
}

export default function SearchResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedTradeType, setSelectedTradeType] = useState(searchParams.get('tradeType') || '');
  const [selectedTradeMethod, setSelectedTradeMethod] = useState(searchParams.get('tradeMethod') || '');

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        const searchTerm = searchParams.get('q') || '';
        const tradeType = searchParams.get('tradeType') || '';
        const tradeMethod = searchParams.get('tradeMethod') || '';

        let postsQuery = query(collection(db, 'posts'));

        // 검색어가 있는 경우 제목으로 검색
        if (searchTerm) {
          postsQuery = query(
            collection(db, 'posts'),
            where('title', '>=', searchTerm),
            where('title', '<=', searchTerm + '\uf8ff')
          );
        }

        // 교환방식이 선택된 경우
        if (tradeType) {
          postsQuery = query(
            postsQuery,
            where('tradeType', '==', tradeType)
          );
        }

        // 거래방식이 선택된 경우
        if (tradeMethod) {
          postsQuery = query(
            postsQuery,
            where('tradeMethod', '==', tradeMethod)
          );
        }

        const postsSnapshot = await getDocs(postsQuery);
        
        const postsData = await Promise.all(
          postsSnapshot.docs.map(async (docSnapshot) => {
            const postData = docSnapshot.data();
            const authorId = postData.author as string;
            
            // 작성자 정보 가져오기
            const authorRef = doc(db, 'users', authorId);
            const authorDoc = await getDoc(authorRef);
            const authorData = authorDoc.data() as { username: string } | undefined;
            
            // 해당 게시글에 연결된 채팅방 수 가져오기
            const chatsQuery = query(
              collection(db, 'chats'),
              where('postId', '==', docSnapshot.id)
            );
            const chatsSnapshot = await getDocs(chatsQuery);
            const chatCount = chatsSnapshot.size;

            return {
              id: docSnapshot.id,
              ...postData,
              authorUsername: authorData?.username || '익명',
              chatCount
            } as Post;
          })
        );

        // 검색어가 있는 경우 클라이언트 측에서 추가 필터링
        const filteredPosts = searchTerm
          ? postsData.filter(post => 
              post.title.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : postsData;
        
        setPosts(filteredPosts);
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchParams]);

  // 검색 실행 핸들러
  const handleSearch = () => {
    const newSearchParams = new URLSearchParams();
    if (searchTerm) newSearchParams.set('q', searchTerm);
    if (selectedTradeType) newSearchParams.set('tradeType', selectedTradeType);
    if (selectedTradeMethod) newSearchParams.set('tradeMethod', selectedTradeMethod);
    router.push(`/posts/search?${newSearchParams.toString()}`);
  };

  // 엔터 키 이벤트 핸들러
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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
          <h1 className="text-2xl font-bold">검색 결과</h1>
          <Link href="/posts">
            <Button variant="outline">
              목록으로 돌아가기
            </Button>
          </Link>
        </div>

        {/* 검색 영역 */}
        <div className="mb-8 p-4 bg-white rounded-lg shadow">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <Input
                type="text"
                placeholder="게시글 제목 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                className="bg-[#FFE34F] hover:bg-[#FFD700] text-black"
              >
                검색
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedTradeType}
                onChange={(e) => setSelectedTradeType(e.target.value)}
                className="p-2 border rounded-md"
              >
                <option value="">교환방식 선택</option>
                <option value="판매">판매</option>
                <option value="구매">구매</option>
                <option value="교환">교환</option>
              </select>
              <select
                value={selectedTradeMethod}
                onChange={(e) => setSelectedTradeMethod(e.target.value)}
                className="p-2 border rounded-md"
              >
                <option value="">거래방식 선택</option>
                <option value="직거래">직거래</option>
                <option value="택배">택배</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
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
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 