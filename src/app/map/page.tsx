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

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useUser } from '../../contexts/UserContext';

const D3USChoropleth = dynamic(() => import('./components/D3USChoropleth'), { ssr: false });

export default function Page(){
  const { user, logout } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header with user info and logout */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-semibold text-gray-900">Space Apps Dashboard</h1>
              <div className="flex items-center space-x-4">
                <Link
                  href="/profile"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Profile
                </Link>
                <span className="text-sm text-gray-700">
                  Welcome, {user?.name} {user?.surname}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-6">
          <h1 className="text-2xl font-bold">Coropleta por estado (JSON) — Máximo de NO2/O3/PM/CH2O</h1>
          <p className="text-sm opacity-70">
            Coloca el archivo más reciente en <code>data/uploads/</code> con nombre <b>YYYYMMDD_hhmm.json</b> y el esquema indicado.
          </p>
          <D3USChoropleth />
        </main>
      </div>
    </ProtectedRoute>
  );
}
