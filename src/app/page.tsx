'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (formData.username.length < 3) {
      setError('아이디는 3자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    const { user, error: signInError } = await signIn(
      formData.username,
      formData.password
    );

    if (signInError) {
      setError(signInError);
      setLoading(false);
      return;
    }

    // Redirect based on user role
    if (user?.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/posts');
    }
  };

  return (
    <main className="min-h-screen p-8" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-[480px] mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-12 text-center" style={{ color: 'var(--text)' }}>
          팝업 굿즈 교환
        </h1>
        <div className="bg-white p-6 sm:p-10 rounded-xl shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                minLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <Button
              type="submit"
              className="w-full h-12 text-lg bg-[#E6E6E6] text-[#4C4C4C] hover:bg-[#FFE34F] hover:text-black transition-colors"
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link
              href="/signup"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              계정이 없으신가요? 회원가입하기
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
