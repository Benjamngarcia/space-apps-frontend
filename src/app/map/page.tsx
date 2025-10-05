"use client";

import dynamic from "next/dynamic";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { Header } from "../../components/Header";

const D3USChoropleth = dynamic(() => import("./components/D3USChoropleth"), {
  ssr: false,
});

export default function Page() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50 animate-in fade-in duration-700">
        <Header />

        <main className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8 animate-in slide-in-from-top-5 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 transition-all duration-300">
                  Air Quality Map
                </h1>
                <p className="text-slate-600 text-sm sm:text-base">
                  Real-time environmental data visualization by state
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-3 sm:p-4 transform transition-all duration-300 hover:shadow-lg">
                  <h3 className="text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">
                    AQI Scale
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded mr-1"></div>
                      <span className="text-slate-600">Good</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-500 rounded mr-1"></div>
                      <span className="text-slate-600">Moderate</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-orange-500 rounded mr-1"></div>
                      <span className="text-slate-600">Unhealthy</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded mr-1"></div>
                      <span className="text-slate-600">Hazardous</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-purple-50/90 backdrop-blur-sm border border-purple-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 transform transition-all duration-300 hover:shadow-lg animate-in slide-in-from-left-5 delay-200">
            <div className="flex items-start">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mt-0.5 mr-2 sm:mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-purple-800 mb-1">
                  Data Source Information
                </h3>
                <p className="text-xs sm:text-sm text-purple-700">
                  Environmental data is sourced from the latest uploads in{" "}
                  <code className="bg-purple-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs">
                    data/uploads/
                  </code>{" "}
                  with filename format <strong>YYYYMMDD_hhmm.json</strong>{" "}
                  containing state-level pollutant maximums.
                </p>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-4 sm:p-6 transform transition-all duration-300 hover:shadow-xl animate-in slide-in-from-bottom-5 delay-300">
            <div className="mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2 transition-all duration-300">
                State-Level Pollution Data
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Click on any state to view detailed pollutant information (NO2,
                O3, PM, CH2O levels)
              </p>
            </div>

            {/* Map Component */}
            <div className="relative transform transition-all duration-500">
              <D3USChoropleth />
            </div>
          </div>

          {/* Pollutant Information Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mt-6 sm:mt-8 animate-in slide-in-from-bottom-5 delay-500">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-3 sm:p-6 text-center transform transition-all duration-300 hover:shadow-lg hover:scale-105 group">
              <div className="flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-xl mx-auto mb-2 sm:mb-4 group-hover:bg-purple-200 transition-colors duration-300">
                <svg
                  className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600 group-hover:scale-110 transition-transform duration-300"
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
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1 group-hover:text-purple-600 transition-colors duration-300">
                NO2
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Nitrogen Dioxide
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-3 sm:p-6 text-center transform transition-all duration-300 hover:shadow-lg hover:scale-105 group">
              <div className="flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 bg-cyan-100 rounded-xl mx-auto mb-2 sm:mb-4 group-hover:bg-cyan-200 transition-colors duration-300">
                <svg
                  className="w-4 h-4 sm:w-6 sm:h-6 text-cyan-600 group-hover:scale-110 transition-transform duration-300"
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
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1 group-hover:text-cyan-600 transition-colors duration-300">
                O3
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">Ozone</p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-3 sm:p-6 text-center transform transition-all duration-300 hover:shadow-lg hover:scale-105 group">
              <div className="flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-xl mx-auto mb-2 sm:mb-4 group-hover:bg-green-200 transition-colors duration-300">
                <svg
                  className="w-4 h-4 sm:w-6 sm:h-6 text-green-600 group-hover:scale-110 transition-transform duration-300"
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
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1 group-hover:text-green-600 transition-colors duration-300">
                PM
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Particulate Matter
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-3 sm:p-6 text-center transform transition-all duration-300 hover:shadow-lg hover:scale-105 group">
              <div className="flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 bg-orange-100 rounded-xl mx-auto mb-2 sm:mb-4 group-hover:bg-orange-200 transition-colors duration-300">
                <svg
                  className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600 group-hover:scale-110 transition-transform duration-300"
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
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-1 group-hover:text-orange-600 transition-colors duration-300">
                CH2O
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">Formaldehyde</p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
