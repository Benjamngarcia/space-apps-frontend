'use client';

import { useUser } from '../contexts/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to home page
        router.push('/home');
      } else {
        // User is not authenticated, redirect to login page
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-xl shadow-lg ring-1 ring-blue-100 mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Aeros</h1>
          <p className="text-slate-600">Loading your air quality dashboard...</p>
        </div>
      </div>
    );
  }

  // This should not be reached due to the redirect, but keep as fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-xl shadow-lg ring-1 ring-blue-100 mb-6">
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Aeros</h1>
        <p className="text-slate-600 mb-4">Redirecting to your dashboard...</p>
        <div className="animate-pulse bg-blue-100 rounded-lg h-2 w-48 mx-auto"></div>
      </div>
    </div>
  );
}
