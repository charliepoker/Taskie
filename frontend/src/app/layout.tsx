import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ConfigProvider } from 'antd';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { ReactQueryProvider } from '@/components/ReactQueryProvider';
import { taskieTheme } from '@/lib/theme';

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  import('@/lib/performance').then(({ measureWebVitals }) => {
    measureWebVitals();
  });
}

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Taskie - Modern Team Task Management',
  description:
    'A modern team task management system with DevOps best practices',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ReactQueryProvider>
          <ConfigProvider theme={taskieTheme}>
            <AuthProvider>{children}</AuthProvider>
          </ConfigProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
