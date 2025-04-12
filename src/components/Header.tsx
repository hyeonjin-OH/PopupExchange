'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Button } from './ui/button';

export default function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
      const currentUserId = user?.email?.split('@')[0] || null;
      setUserId(currentUserId);
      setIsAdmin(currentUserId === 'admin');
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold">
            PopupSite
          </Link>
          
          {isAdmin && (
            <nav className="flex items-center gap-6">
              <Link href="/admin/popup" className="text-gray-600 hover:text-gray-900">
                팝업스토어 관리
              </Link>
              <Link href="/posts" className="text-gray-600 hover:text-gray-900">
                중고거래
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{userId}님</span>
              <Button
                variant="ghost"
                className="text-sm"
                onClick={handleLogout}
              >
                로그아웃
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="text-sm">
                  로그인
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="ghost" className="text-sm">
                  회원가입
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 