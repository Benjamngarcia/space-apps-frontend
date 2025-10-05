"use client";

import { ProtectedRoute } from "../../components/ProtectedRoute";
import { Header } from "../../components/Header";
import { useUser } from "../../contexts/UserContext";
import Link from "next/link";
import { IconBell, IconMapPin } from "@tabler/icons-react";
import { Chip } from "../../components/Chip";

export default function Profile() {
  const { user } = useUser();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50 animate-in fade-in duration-700">
        <Header />

        <main className="max-w-4xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-4 sm:p-8 mb-6 sm:mb-8 transform transition-all duration-500 hover:shadow-lg animate-in slide-in-from-top-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl text-white text-lg sm:text-2xl font-bold transform transition-all duration-300 hover:scale-110 hover:rotate-3 shadow-lg">
                {user?.name?.[0]}
                {user?.surname?.[0]}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 transition-colors duration-200">
                  {user?.name} {user?.surname}
                </h1>
                <p className="text-slate-600 mt-1 text-sm sm:text-base">
                  {user?.email}
                </p>
                <div className="flex items-center justify-center sm:justify-start mt-2 text-xs sm:text-sm text-slate-500 transition-colors duration-200 hover:text-slate-700">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  ZIP: {user?.zipCode}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-4 sm:p-6 transform transition-all duration-500 hover:shadow-lg hover:scale-[1.02] animate-in slide-in-from-left-5">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4 sm:mb-6 flex items-center">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600 transition-transform duration-200 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Personal Information
              </h2>

              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-2 transition-colors duration-200 group-hover:text-blue-600">
                      First Name
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-slate-900 font-medium transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm">
                      {user?.name}
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-2 transition-colors duration-200 group-hover:text-blue-600">
                      Last Name
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-slate-900 font-medium transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm">
                      {user?.surname}
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-2 transition-colors duration-200 group-hover:text-blue-600">
                    Email Address
                  </label>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-slate-900 font-medium transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm break-all">
                    {user?.email}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-2 transition-colors duration-200 group-hover:text-blue-600">
                      Birth Date
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-slate-900 font-medium transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm">
                      {user?.birthdate
                        ? new Date(user.birthdate).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-2 transition-colors duration-200 group-hover:text-blue-600">
                      ZIP Code
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-slate-900 font-medium transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm">
                      {user?.zipCode}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-4 sm:p-6 transform transition-all duration-500 hover:shadow-lg hover:scale-[1.02] animate-in slide-in-from-right-5">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4 sm:mb-6 flex items-center">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-cyan-600 transition-transform duration-200 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-4v-4a2 2 0 10-4 0v4m1-5V7a1 1 0 011-1h1a1 1 0 011 1v1m-3 4h3m-6 0h1"
                  />
                </svg>
                Account Details
              </h2>

              <div className="space-y-4 sm:space-y-6">
                <div className="group">
                  <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-2 transition-colors duration-200 group-hover:text-cyan-600">
                    Member Since
                  </label>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-slate-900 font-medium transition-all duration-200 hover:bg-cyan-50 hover:border-cyan-300 hover:shadow-sm">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-2 transition-colors duration-200 group-hover:text-green-600">
                    Account Status
                  </label>
                  <div className="flex items-center">
                    <div className="flex items-center bg-green-50 border border-green-200 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-green-800 font-medium transition-all duration-200 hover:bg-green-100 hover:shadow-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      Active
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs sm:text-sm font-medium text-slate-600 mb-2 transition-colors duration-200 group-hover:text-purple-600">
                    Your Interests
                  </label>
                  <div className="space-y-3">
                    {user?.tags && user.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.tags.map((tag) => (
                          <Chip
                            key={tag.tagId}
                            tagId={tag.tagId}
                            tagName={tag.tagName}
                            tagType={tag.tagType}
                            isSelected={true}
                            isClickable={false}
                            size="sm"
                            variant="filled"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 sm:px-4 py-6 text-center transition-all duration-200 hover:bg-slate-100">
                        <div className="text-slate-400 mb-2">
                          <IconBell className="w-8 h-8 mx-auto" stroke={1} />
                        </div>
                        <p className="text-slate-600 text-sm mb-2">No interests selected yet</p>
                        <Link 
                          href="/register"
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors"
                        >
                          Add your interests →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 sm:mt-8 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-4 sm:p-6 transform transition-all duration-500 hover:shadow-lg animate-in slide-in-from-bottom-5">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4 flex items-center">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Link
                href="/map"
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-all duration-200 hover:scale-105 hover:shadow-sm transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <IconMapPin className="w-4 h-4 mr-2" />
                Check By Zone
              </Link>
              <button className="inline-flex items-center px-3 sm:px-4 py-2 bg-yellow-50 text-yellow-700 font-medium rounded-lg hover:bg-yellow-100 transition-all duration-200 hover:scale-105 hover:shadow-sm transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2">
                <IconBell className="w-4 h-4 mr-2" />
                Add Topics
              </button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
