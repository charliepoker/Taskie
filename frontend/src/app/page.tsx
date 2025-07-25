'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (session) {
      router.push('/dashboard');
    }
  }, [session, status, router]);
  return (
    <div className='min-h-screen flex flex-col'>
      {/* Header */}
      <header className='bg-primary-blue text-white p-4 shadow-md'>
        <div className='container mx-auto flex justify-between items-center'>
          <h1 className='text-2xl font-bold'>Taskie</h1>
          <nav>
            <ul className='flex space-x-4'>
              <li>
                <Link
                  href='/auth/login'
                  className='hover:text-accent-gold transition-colors'
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href='/auth/register'
                  className='hover:text-accent-gold transition-colors'
                >
                  Register
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className='bg-secondary-pink py-16'>
        <div className='container mx-auto px-4 text-center'>
          <h2 className='text-4xl md:text-5xl font-bold text-primary-blue mb-4'>
            Modern Team Task Management
          </h2>
          <p className='text-xl mb-8 max-w-2xl mx-auto text-text-dark'>
            A comprehensive project and task management system with DevOps best
            practices.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link
              href='/auth/register'
              className='bg-primary-blue text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors inline-block text-center'
            >
              Get Started
            </Link>
            <Link
              href='/auth/login'
              className='border border-primary-blue text-primary-blue px-6 py-3 rounded-md hover:bg-blue-50 transition-colors inline-block text-center'
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-16'>
        <div className='container mx-auto px-4'>
          <h2 className='text-3xl font-bold text-center mb-12'>Key Features</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow'>
              <h3 className='text-xl font-semibold mb-3 text-primary-blue'>
                Project Management
              </h3>
              <p className='text-text-light'>
                Create and manage projects with team collaboration features.
              </p>
            </div>
            <div className='p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow'>
              <h3 className='text-xl font-semibold mb-3 text-primary-blue'>
                Task Tracking
              </h3>
              <p className='text-text-light'>
                Track tasks with status updates, priorities, and assignments.
              </p>
            </div>
            <div className='p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow'>
              <h3 className='text-xl font-semibold mb-3 text-primary-blue'>
                Analytics Dashboard
              </h3>
              <p className='text-text-light'>
                Visualize project progress and team productivity metrics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-gray-100 py-8 mt-auto'>
        <div className='container mx-auto px-4 text-center'>
          <p className='text-text-light'>
            © 2025 Taskie. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
