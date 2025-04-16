'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth(); // Assuming useAuth provides a loading state

  useEffect(() => {
    // Wait until auth state is determined
    if (!loading) { 
      if (user) {
        // Redirect based on user role if needed, otherwise default to /posts
        if (user.role === 'admin') {
             router.replace('/admin'); // Use replace to avoid back button going to root
        } else {
             router.replace('/posts'); // Use replace
        }
      } else {
        // If not logged in, redirect to the login page
        router.replace('/login'); // Use replace
      }
    }
  }, [user, loading, router]);

  // Render a loading indicator or null while checking auth state
  // This prevents a flash of content before redirection
  return (
      <div className="flex items-center justify-center min-h-screen">
        {/* Optional: Add a better loading spinner */}
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
  );
}
