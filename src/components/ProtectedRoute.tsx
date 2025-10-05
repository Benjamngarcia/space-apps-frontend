"use client";

import { useUser } from "../contexts/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-violet-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-xl shadow-lg ring-1 ring-purple-100 mb-6">
            <svg
              className="w-10 h-10 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
              />
            </svg>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Securing your access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-xl shadow-lg ring-1 ring-blue-100 mb-6">
              <svg
                className="w-10 h-10 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-4a4 4 0 00-4-4v-4m4 4h4m-6 4V7a1 1 0 011-1h1a1 1 0 011 1v4h4"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Access Required
            </h1>
            <p className="text-slate-600 mb-6">
              You need to sign in to access.
            </p>
            <div className="space-y-3">
              <a
                href="/login"
                className="block w-full bg-purple-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Sign In
              </a>
              <a
                href="/register"
                className="block w-full bg-white hover:bg-slate-50 text-slate-700 font-medium py-3 px-4 rounded-lg border border-slate-300 transition-colors"
              >
                Create Account
              </a>
            </div>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
