'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import StaticUSChoropleth from './components/StaticUSChoropleth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Header } from '@/components/Header';
import { IconSearch } from '@tabler/icons-react';

const ModalAirQuality = dynamic(() => import('./components/D3USChoropleth'), { ssr: false });

export default function Page() {
  const [open, setOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50 animate-in fade-in duration-700">
        <Header />

        <main className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8 animate-in slide-in-from-top-5 duration-700">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">
                Air Quality Map
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
                Interactive visualization of air quality data across US states
              </p>
            </div>
          </div>
          {/* Search Section - More compact */}
          <div className="mb-6 animate-in slide-in-from-top-5 duration-700">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                    Explore Air Quality Data
                  </h2>
                  <p className="text-sm text-slate-600">
                    Click on any state to view detailed information and get recommendations.
                  </p>
                </div>
                <button
                  onClick={() => setOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-all duration-200 hover:scale-105 transform active:scale-95 text-sm whitespace-nowrap"
                >
                  <IconSearch className="w-4 h-4 mr-2" />
                  Search & Recommend
                </button>
              </div>
            </div>
          </div>

          {/* Map Section - Larger and more prominent */}
          <div className="mb-8 sm:mb-12 animate-in slide-in-from-bottom-5 duration-700 delay-300">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
              <div
                className="w-full"
                style={{
                  height: 'clamp(500px, 80vh, 1000px)', // Increased minimum height and max height
                }}
              >
                <StaticUSChoropleth height="100%" />
              </div>
            </div>
          </div>

          {/* Information Cards - More compact layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 animate-in slide-in-from-bottom-5 duration-700 delay-500">
            {/* AQI Legend Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-4">
              <h3 className="text-base font-semibold text-slate-900 mb-3">Air Quality Index</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded bg-green-500 mr-2"></div>
                    <span className="text-slate-700">Good</span>
                  </div>
                  <span className="text-slate-500">0-50</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded bg-yellow-500 mr-2"></div>
                    <span className="text-slate-700">Moderate</span>
                  </div>
                  <span className="text-slate-500">51-100</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded bg-orange-500 mr-2"></div>
                    <span className="text-slate-700">Unhealthy</span>
                  </div>
                  <span className="text-slate-500">101-150</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded bg-purple-500 mr-2"></div>
                    <span className="text-slate-700">Very Unhealthy</span>
                  </div>
                  <span className="text-slate-500">151+</span>
                </div>
              </div>
            </div>

            {/* Pollutants Info Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-4">
              <h3 className="text-base font-semibold text-slate-900 mb-3">Key Pollutants</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-700 font-medium">NO₂</span>
                  <span className="text-slate-500">Nitrogen Dioxide</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 font-medium">O₃</span>
                  <span className="text-slate-500">Ozone</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 font-medium">PM</span>
                  <span className="text-slate-500">Particulate Matter</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 font-medium">CH₂O</span>
                  <span className="text-slate-500">Formaldehyde</span>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-4">
              <h3 className="text-base font-semibold text-slate-900 mb-3">Health Tips</h3>
              <div className="space-y-1 text-xs text-slate-600">
                <p>• Check AQI before outdoor activities</p>
                <p>• Limit exposure on unhealthy days</p>
                <p>• Use air purifiers when needed</p>
                <p>• Stay hydrated and wear masks</p>
              </div>
            </div>
          </div>

          {/* Notice - Compact */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-4 animate-in slide-in-from-bottom-5 duration-700 delay-700">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
                  <span className="text-amber-600 text-xs">⚠️</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-xs font-medium text-slate-900 mb-1">Important Notice</h3>
                <p className="text-xs text-slate-600">
                  These visualizations are estimates based on climatological data and do not replace professional medical advice.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Air Quality Search Modal */}
        {open && <ModalAirQuality onClose={() => setOpen(false)} />}
      </div>
    </ProtectedRoute>
  );
}
