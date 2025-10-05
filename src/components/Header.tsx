"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "../contexts/UserContext";
import { useRouter } from "next/navigation";
import {
  IconCloud,
  IconMenu2,
  IconX,
  IconLogout,
  IconUser,
  IconMap,
  IconDashboard,
} from "@tabler/icons-react";

export function Header() {
  const { user, logout } = useUser();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/");
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-600 rounded-lg transform transition-transform duration-200 hover:scale-110">
              <IconCloud className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Aeros</h1>
          </div>

          <div className="hidden sm:flex items-center space-x-4">
            <Link
              href="/home"
              className="text-slate-600 hover:text-purple-600 font-medium transition-all duration-200 hover:scale-105 px-2 py-1 rounded-md hover:bg-purple-50"
            >
              Home
            </Link>
            <Link
              href="/profile"
              className="text-slate-600 hover:text-purple-600 font-medium transition-all duration-200 hover:scale-105 px-2 py-1 rounded-md hover:bg-purple-50"
            >
              Profile
            </Link>
            <span className="text-sm text-slate-600">
              Welcome, {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm"
            >
              Sign out
            </button>
          </div>

          <div className="sm:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <IconMenu2 className="h-6 w-6" />
              ) : (
                <IconX className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        <div
          className={`sm:hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen
              ? "max-h-96 opacity-100 visible"
              : "max-h-0 opacity-0 invisible"
          } overflow-hidden`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white/90 backdrop-blur-sm border-t border-slate-200 animate-in slide-in-from-top-3 duration-300">
            <div className="px-3 py-2 rounded-md text-sm text-slate-600 bg-slate-50">
              Welcome, {user?.name}
            </div>

            <Link
              href="/home"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors duration-200"
            >
              <IconDashboard className="h-5 w-5 mr-3" />
              Dashboard
            </Link>

            <Link
              href="/map"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors duration-200"
            >
              <IconMap className="h-5 w-5 mr-3" />
              Map
            </Link>

            <Link
              href="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors duration-200"
            >
              <IconUser className="h-5 w-5 mr-3" />
              Profile
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
            >
              <IconLogout className="h-5 w-5 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
