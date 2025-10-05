"use client";

import { useState } from "react";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { Header } from "../../components/Header";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  IconCloud,
  IconUser,
  IconChevronRight,
  IconMapPin,
  IconBell,
  IconSparkles,
} from "@tabler/icons-react";
import StaticUSChoropleth from "../map/components/StaticUSChoropleth";

const ModalAirQuality = dynamic(
  () => import("../map/components/D3USChoropleth"),
  { ssr: false }
);

export default function Home() {
  const [open, setOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50 animate-in fade-in duration-700">
        <Header />

        <main className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 animate-in slide-in-from-top-5 duration-700">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg ring-1 ring-blue-100 mb-4 sm:mb-6 transform transition-all duration-300 hover:scale-110 hover:rotate-3">
              <IconCloud className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 sm:mb-4 transition-all duration-300">
              Aeros
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto px-4 transition-all duration-300">
              Monitor environmental conditions and get real-time air quality
              insights for better health decisions
            </p>
          </div>

          <div className=" gap-3 sm:gap-6 mb-8 sm:mb-12 animate-in slide-in-from-bottom-5 duration-700 delay-500">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-3 sm:p-6 text-center transform transition-all duration-300 hover:shadow-lg hover:scale-105 group">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-300">
                Good
              </div>
              <div className="text-xs sm:text-sm text-slate-600 mb-2">
                Current Air Quality Status
              </div>
              <div className="w-full bg-green-100 rounded-full h-1.5 sm:h-2 group-hover:h-2 sm:group-hover:h-2.5 transition-all duration-300">
                <div className="bg-green-500 h-full rounded-full w-3/4 transition-all duration-500 group-hover:w-4/5"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-8 sm:mb-12 animate-in slide-in-from-bottom-5 duration-700 delay-300">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-4 sm:p-6 transform transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 group">
              <StaticUSChoropleth height="100%" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12 animate-in slide-in-from-bottom-5 duration-700 delay-300">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-4 sm:p-6 transform transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 group">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl mb-3 sm:mb-4 group-hover:bg-purple-200 transition-colors duration-300">
                <IconSparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-purple-600 transition-colors duration-300">
                AI Recommendations
              </h3>
              <p className="text-sm sm:text-base text-slate-600 mb-3 sm:mb-4 transition-colors duration-300">
                Get personalized air quality insights and location-based
                recommendations powered by artificial intelligence.
              </p>
              <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-pruple-700 transition-all duration-200 hover:scale-105 transform active:scale-95 text-sm cursor-pointer"
              >
                <IconChevronRight className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Get Recommendations
              </button>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-4 sm:p-6 transform transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 group">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-cyan-100 rounded-xl mb-3 sm:mb-4 group-hover:bg-cyan-200 transition-colors duration-300">
                <IconUser className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-cyan-600 transition-colors duration-300">
                Your Profile
              </h3>
              <p className="text-sm sm:text-base text-slate-600 mb-3 sm:mb-4 transition-colors duration-300">
                Customize your dashboard, manage notification preferences, and
                track your air quality monitoring history.
              </p>
              <Link
                href="/profile"
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 transition-all duration-200 hover:scale-105 transform active:scale-95 text-sm cursor-pointer"
              >
                <IconChevronRight className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                View Profile
              </Link>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-4 sm:p-6 animate-in slide-in-from-bottom-5 duration-700 delay-700">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4 transition-all duration-300">
              Quick Actions
            </h2>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <Link
                href="/map"
                className="inline-flex items-center justify-center sm:justify-start px-4 py-2.5 sm:py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-all duration-200 hover:scale-105 transform active:scale-95 text-sm"
              >
                <IconMapPin className="w-4 h-4 mr-2" />
                Explore by Location
              </Link>
              <button className="inline-flex items-center justify-center sm:justify-start px-4 py-2.5 sm:py-2 bg-yellow-50 text-yellow-700 font-medium rounded-lg hover:bg-yellow-100 transition-all duration-200 hover:scale-105 transform active:scale-95 text-sm cursor-pointer">
                <IconBell className="w-4 h-4 mr-2" />
                Set Alerts
              </button>
            </div>
          </div>
        </main>

        {open && <ModalAirQuality onClose={() => setOpen(false)} />}
      </div>
    </ProtectedRoute>
  );
}
