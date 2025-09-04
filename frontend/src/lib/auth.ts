import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';

interface ExtendedUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  accessToken: string;
  refreshToken: string;
}

// Use different URLs for client-side vs server-side requests
const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    // Server-side (inside Docker) - hardcode for now to test
    return 'http://backend:5000/api';
  } else {
    // Client-side
    const publicUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return publicUrl.endsWith('/api') ? publicUrl : publicUrl + '/api';
  }
};

async function refreshAccessToken(token: JWT) {
  try {
    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.data.accessToken,
      accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      refreshToken: refreshedTokens.data.refreshToken ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          return null;
        }

        try {
          const isServerSide = typeof window === 'undefined';
          const backendUrl = process.env.BACKEND_URL;
          const publicUrl = process.env.NEXT_PUBLIC_API_URL;
          console.log('Environment check:', {
            isServerSide,
            backendUrl,
            publicUrl,
          });

          const apiBaseUrl = getApiBaseUrl();
          console.log('Attempting login with API_BASE_URL:', apiBaseUrl);
          const response = await fetch(`${apiBaseUrl}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          console.log('Response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Login failed:', response.status, errorText);
            return null;
          }

          const data = await response.json();
          console.log('Login response:', data.success ? 'Success' : 'Failed');

          if (data.success && data.data.user && data.data.tokens) {
            return {
              id: data.data.user.id,
              email: data.data.user.email,
              username: data.data.user.username,
              firstName: data.data.user.firstName,
              lastName: data.data.user.lastName,
              avatar: data.data.user.avatar,
              accessToken: data.data.tokens.accessToken,
              refreshToken: data.data.tokens.refreshToken,
            };
          }

          return null;
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        const extendedUser = user as ExtendedUser;
        return {
          ...token,
          accessToken: extendedUser.accessToken,
          refreshToken: extendedUser.refreshToken,
          accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          user: {
            id: user.id,
            email: user.email!,
            username: extendedUser.username,
            firstName: extendedUser.firstName,
            lastName: extendedUser.lastName,
            avatar: extendedUser.avatar,
          },
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to update it
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        session.user = {
          ...session.user,
          id: token.user?.id as string,
          email: token.user?.email as string,
          username: token.user?.username as string,
          firstName: token.user?.firstName as string,
          lastName: token.user?.lastName as string,
          avatar: token.user?.avatar as string | null,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  debug: process.env.NODE_ENV === 'development',
});
