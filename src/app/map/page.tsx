// 'use client';

// import dynamic from 'next/dynamic';
// import { useState } from 'react';

// const D3USMap = dynamic(() => import('./components/D3USMap'), { ssr: false });

// export default function Page(){
//   const [zip, setZip] = useState('90001');
//   const [text, setText] = useState('Quiero salir a correr');
//   const [chat, setChat] = useState<{role:'user'|'bot'; text:string}[]>([]);

//   async function ask(z: string, t: string){
//     setChat(c=>[...c, {role:'user', text:`ZIP ${z}: ${t}`}]);
//     try{
//       const r = await fetch('/map/api/recommendations', {
//         method:'POST', headers:{'Content-Type':'application/json'},
//         body: JSON.stringify({ zip: z, user_text: t })
//       });
//       const d = await r.json();
//       if(d.error){
//         setChat(c=>[...c, {role:'bot', text:`Error: ${d.error}`}]);
//         return;
//       }
//       setChat(c=>[...c, {role:'bot', text:`AI=${d.AI ?? 'N/D'} NO2=${d.NO2 ?? 'N/D'} O3=${d.O3 ?? 'N/D'} PM=${d.PM ?? 'N/D'} CH2O=${d.CH2O ?? 'N/D'}\n${d.summary}`}]);
//       setText('');
//     }catch(e:any){
//       setChat(c=>[...c, {role:'bot', text:'Error: '+e.message}]);
//     }
//   }

//   return (
//     <main className="p-6 space-y-6">
//       <header>
//         <h1 className="text-2xl font-bold">Mapa (D3) — NASA App / carpeta <code>mapa</code></h1>
//         <p className="text-sm opacity-70">
//           Coloca el CSV más reciente en <code>data/uploads/</code> con columnas: <b>zip, NO2, O3, AI, CH2O, PM, lat, lon</b>.
//         </p>
//       </header>

//       <section className="space-y-3">
//         <D3USMap onSelectZip={(z)=> ask(z, text || 'Dame recomendaciones de actividades')} />
//         <div className="flex gap-2">
//           <input className="border px-3 py-2 rounded w-28" value={zip} onChange={e=>setZip(e.target.value)} placeholder="ZIP" />
//           <input className="border px-3 py-2 rounded flex-1" value={text} onChange={e=>setText(e.target.value)} placeholder="Intención (correr, bici, niños…)" />
//           <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={()=>ask(zip, text)}>Pedir recomendaciones</button>
//         </div>
//         <div className="border rounded p-3 h-64 overflow-auto bg-white">
//           {chat.map((m,i)=>(
//             <div key={i} className={`my-2 p-2 rounded max-w-[75%] ${m.role==='user' ? 'ml-auto bg-blue-600 text-white' : 'mr-auto bg-gray-100'}`}>
//               {m.text}
//             </div>
//           ))}
//         </div>
//       </section>
//     </main>
//   );
// }
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import StaticUSChoropleth from './components/StaticUSChoropleth';

// Modal (ssr off)
const ModalAirQuality = dynamic(() => import('./components/D3USChoropleth'), { ssr: false });

export default function Page() {
  const [open, setOpen] = useState(false);

  return (
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
  );
}
