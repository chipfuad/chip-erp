import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Calendar } from 'lucide-react';

export function CargaVentasTab() {
  const [productos, setProductos] = useState<any[]>([]);
  // SOLUCIÓN AL ERROR: Definimos el tipo del objeto para que acepte índices numéricos
  const [ventasData, setVentasData] = useState<Record<number, string>>({});
  const [diaActual] = useState(new Date().getDate());
  const [loading, setLoading] = useState(false);

  const fetchProds = () => fetch('http://localhost:3000/api/productos').then(r => r.json()).then(setProductos);
  useEffect(() => { fetchProds(); }, []);

  const handleGuardar = async (id: number) => {
    if (!ventasData[id]) return;
    setLoading(true);
    try {
      await fetch(`http://localhost:3000/api/productos/venta-parcial/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventaActual: Number(ventasData[id]), diaDelMes: diaActual })
      });
      alert("Proyección Actualizada");
      fetchProds();
    } finally { setLoading(false); }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      <header className="mb-8">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Actualizar Ventas</h2>
        <div className="mt-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700 w-fit flex items-center gap-3">
          <Calendar className="text-emerald-500" size={18} />
          <span className="text-white font-bold text-xs uppercase tracking-widest">Corte: Día {diaActual} del mes</span>
        </div>
      </header>
      <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-slate-500 uppercase text-[10px] font-black tracking-widest">
            <tr><th className="px-8 py-5">Producto</th><th className="px-6 py-5 text-center">Venta Real Hoy</th><th className="px-6 py-5 text-center">Proyección</th><th className="px-6 py-5 text-center">Acción</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {productos.map((p: any) => {
              const val = ventasData[p.id] || "";
              const proj = val ? Math.ceil((Number(val) / diaActual) * 30) : 0;
              return (
                <tr key={p.id} className="hover:bg-slate-700/20 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="font-bold text-white text-base">{p.nombre}</div>
                    <div className="text-[10px] text-slate-500 font-mono tracking-tighter">{p.sku}</div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <input 
                      type="number" 
                      className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white w-32 text-center outline-none focus:border-emerald-500 transition-all" 
                      value={val}
                      onChange={e => setVentasData({...ventasData, [p.id]: e.target.value})} 
                    />
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-xl font-black text-emerald-400">{proj > 0 ? proj.toLocaleString() : '---'}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button onClick={() => handleGuardar(p.id)} disabled={!val || loading} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-[10px] uppercase hover:bg-emerald-600 disabled:opacity-30 transition-all">
                      Actualizar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}