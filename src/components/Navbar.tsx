'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, username, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const showAuthButtons = !user && pathname !== '/login' && pathname !== '/signup';

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/posts" className="text-xl font-bold text-gray-900">
              팝업스토어
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link href="/posts" className="text-sm text-gray-600 hover:text-gray-900">
                팝업스토어
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {username || '사용자'}님
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/profile')}
                  className="text-gray-600 hover:text-gray-900"
                  aria-label="Profile"
                >
                  <span className="material-symbols-outlined">person</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-900"
                  aria-label="Logout"
                >
                  <span className="material-symbols-outlined">logout</span>
                </Button>
              </div>
            ) : showAuthButtons ? (
              <>
                <Link href="/login">
                  <Button variant="outline" className="text-sm">
                    로그인
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="text-sm">
                    회원가입
                  </Button>
                </Link>
              </>
            ) : (
              null
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 