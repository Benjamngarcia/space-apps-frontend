'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import StaticUSChoropleth from './components/StaticUSChoropleth';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const ModalAirQuality = dynamic(() => import('./components/D3USChoropleth'), { ssr: false });

export default function Page() {
  const [open, setOpen] = useState(false);

  return (
    <ProtectedRoute>
      <main className="relative min-h-screen" style={{ background: '#6ec9f4' }}>
        {/* Top bar sticky en desktop */}
        <header
          className="sticky top-0 z-20"
          style={{
            background: 'rgba(110,201,244,0.85)',
            backdropFilter: 'blur(6px)',
            borderBottom: '1px solid rgba(255,255,255,0.35)',
          }}
        >
          <div className="mx-auto max-w-7xl px-4 lg:px-8 py-4 flex items-center justify-between">
            <h1 className="text-lg md:text-2xl font-semibold text-white">
              US Air Quality by State
            </h1>

            <button
              onClick={() => setOpen(true)}
              className="px-4 py-2 rounded-full border text-sm md:text-base"
              style={{
                borderColor: '#FFFFFF',
                color: '#6ec9f4',
                background: '#FFFFFF',
              }}
              aria-haspopup="dialog"
            >
              Search
            </button>
          </div>
        </header>

        {/* Contenido principal: mapa grande y centrado */}
    
  <section className="mx-auto max-w-[102rem] px-4 lg:px-8 pt-6 lg:pt-10">
    <div
      className="w-full"
      style={{
        // Alto GRANDE en desktop: mínimo 640px, usa 82vh y no pasa de 1100px
        height: 'clamp(648px, 900vh, 105px)',
      }}
    >
      <StaticUSChoropleth
        height="100%"          // usa el alto del contenedor de arriba
      />
      
    </div>

    <div
      className="mt-6 lg:mt-8 rounded-xl px-4 py-3 text-xs sm:text-sm"
      style={{
        background: '#FFFFFF',
        color: '#6ec9f4',
        border: '1px solid #FFFFFF',
        boxShadow: '0 8px 26px rgba(0,0,0,0.10)',
      }}
    >
      <span className="font-semibold">⚠️ Notice:</span>{' '}
      These visualizations and recommendations are estimates based on climatological and air quality information.
      They do not replace professional advice or official confirmations.
    </div>
  </section>



        {/* Modal de búsqueda */}
        {open && <ModalAirQuality onClose={() => setOpen(false)} />}
      </main>
    </ProtectedRoute>
  );
}
