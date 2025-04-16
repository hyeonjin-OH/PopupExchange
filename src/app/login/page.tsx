'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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

    if (user?.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/posts');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-[450px]">
        <CardHeader className="text-center pt-8 pb-4">
          <CardTitle className="text-2xl font-bold">로그인</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 flex flex-col items-center">
              <Label htmlFor="username" className="w-[95%] px-1 text-left">아이디</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                minLength={3}
                autoComplete="username"
                placeholder="아이디 입력"
                className="w-[95%]"
              />
            </div>
            <div className="space-y-1.5 flex flex-col items-center">
              <Label htmlFor="password" className="w-[95%] px-1 text-left">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                autoComplete="current-password"
                placeholder="비밀번호 입력"
                className="w-[95%]"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
            <div className="pt-4 flex justify-center">
              <Button
                type="submit"
                className="w-[95%] text-base h-11"
                disabled={loading}
              >
                {loading ? '로그인 중...' : '로그인'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center pb-8 pt-0">
           <Link
              href="/signup"
              className="text-sm text-blue-600 hover:underline"
            >
              회원가입
           </Link>
        </CardFooter>
      </Card>
    </main>
  );
} 