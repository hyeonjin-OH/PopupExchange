'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp, checkUsernameAvailability } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'user' | 'admin',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const username = e.target.value;
    setFormData({ ...formData, username });
    setUsernameAvailable(null);

    if (username.length < 3) {
      return;
    }

    setIsCheckingUsername(true);
    try {
      const isAvailable = await checkUsernameAvailability(username);
      setUsernameAvailable(isAvailable);
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setIsCheckingUsername(false);
    }
  };

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

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    const { user, error: signUpError } = await signUp(
      formData.username,
      formData.password,
      formData.role
    );

    if (signUpError) {
      setError(signUpError);
      setLoading(false);
      return;
    }

    router.push('/');
  };

  return (
    <main className="min-h-screen p-8" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-[480px] mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-12 text-center" style={{ color: 'var(--text)' }}>
          회원가입
        </h1>
        <div className="bg-white p-6 sm:p-10 rounded-xl shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={handleUsernameChange}
                required
                minLength={3}
              />
              {isCheckingUsername && (
                <p className="text-sm text-gray-500">확인 중...</p>
              )}
              {!isCheckingUsername && usernameAvailable === false && (
                <p className="text-sm text-red-500">이미 사용 중인 아이디입니다.</p>
              )}
              {!isCheckingUsername && usernameAvailable === true && (
                <p className="text-sm text-green-500">사용 가능한 아이디입니다.</p>
              )}
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
              <p className="text-sm text-gray-500">6자 이상 입력해주세요</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2 relative">
              <Label>계정 유형</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'user' | 'admin') => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="계정 유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent className="w-full z-50">
                  <SelectItem value="user" className="py-3 cursor-pointer hover:bg-gray-100">일반 사용자</SelectItem>
                  <SelectItem value="admin" className="py-3 cursor-pointer hover:bg-gray-100">관리자</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <div className="text-red-600 text-sm mt-4">{error}</div>
            )}
            <Button
              type="submit"
              className="w-full h-12 text-lg bg-[#E6E6E6] text-[#4C4C4C] hover:bg-[#FFE34F] hover:text-black transition-colors mt-6"
              disabled={loading || isCheckingUsername || usernameAvailable === false}
            >
              {loading ? '처리중...' : '가입하기'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              이미 계정이 있으신가요? 로그인하기
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
} 