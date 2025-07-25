import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();
  const router = useRouter();

  const signOut = useCallback(async () => {
    try {
      // Sign out from NextAuth
      await nextAuthSignOut({
        redirect: false,
      });

      // Redirect to login page
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      // Force redirect even if there's an error
      router.push('/auth/login');
    }
  }, [router]);

  return {
    user: session?.user || null,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading',
    accessToken: session?.accessToken || null,
    refreshToken: session?.refreshToken || null,
    signOut,
  };
}
