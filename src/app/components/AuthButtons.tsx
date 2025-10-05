'use client';

import { useUser } from '../../contexts/UserContext';
import Link from 'next/link';

export function AuthButtons() {
  const { user, logout, loading } = useUser();

  if (loading) {
    return (
      <div className="flex gap-4 items-center flex-col sm:flex-row">
        <div className="h-10 w-24 bg-gray-200 animate-pulse rounded-full"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex gap-4 items-center flex-col sm:flex-row">
        <span className="text-sm text-gray-600">
          Welcome, {user.name}!
        </span>
        <Link
          href="/map"
          className="rounded-full border border-solid border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors font-medium text-sm sm:text-base h-10 sm:h-12 px-5 flex items-center justify-center"
        >
          Go to Map
        </Link>
        <button
          onClick={logout}
          className="rounded-full border border-solid border-red-500 text-red-600 hover:bg-red-500 hover:text-white transition-colors font-medium text-sm sm:text-base h-10 sm:h-12 px-5"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-4 items-center flex-col sm:flex-row">
      <Link
        href="/login"
        className="rounded-full border border-solid border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors font-medium text-sm sm:text-base h-10 sm:h-12 px-5 flex items-center justify-center"
      >
        Sign In
      </Link>
      <Link
        href="/register"
        className="rounded-full border border-solid border-green-500 text-green-600 hover:bg-green-500 hover:text-white transition-colors font-medium text-sm sm:text-base h-10 sm:h-12 px-5 flex items-center justify-center"
      >
        Sign Up
      </Link>
    </div>
  );
}
