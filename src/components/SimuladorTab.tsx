import React, { useState, useEffect } from 'react';
import { Calculator, ArrowLeft, Folder, TrendingUp, Minus, TrendingDown, Clock, AlertTriangle } from 'lucide-react';

export function SimuladorTab() {
  const [productos, setProductos] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [provSel, setProvSel] = useState<any>(null);
  const [tendencia, setTendencia] = useState(1.0);

  useEffect(() => {
    fetch('http://localhost:3000/api/productos').then(r => r.json()).then(setProductos);
    fetch('http://localhost:3000/api/proveedores').then(r => r.json()).then(setProveedores);
  }, []);

  if (provSel) {
    const productosFabrica = productos.filter(p => p.proveedorId === provSel.id);
    return (
      <div className="animate-in fade-in duration-500">
        <button onClick={() => setProvSel(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={18}/> Volver a Fábricas
        </button>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Planificación: {provSel.nombre}</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Lead Time: {provSel.leadTime} días</p>
          </div>
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
             {[0.8, 1.0, 1.3].map(f => (
               <button key={f} onClick={() => setTendencia(f)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tendencia === f ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                 {f === 0.8 ? 'Baja' : f === 1.0 ? 'Estable' : 'Hot'}
               </button>
             ))}
          </div>
        </div>

        <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-6">Producto</th>
                <th className="px-6 py-6 text-center">Stock Físico</th>
                <th className="px-6 py-6 text-center">En Tránsito</th>
                <th className="px-6 py-6 text-center">Cobertura (Días)</th>
                <th className="px-6 py-6 text-center text-emerald-400">Sugerencia (5 Meses)</th>
                <th className="px-6 py-6 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {productosFabrica.map(p => {
                const ventaD = p.ventaMensual / 30;
                const transito = p.ordenesEnTransito?.reduce((acc: any, o: any) => acc + o.cantidad, 0) || 0;
                const total = p.stockActual + transito;
                const cobertura = ventaD > 0 ? total / ventaD : 999;
                
                // PUNTO REORDEN = Lead Time del proveedor + 10 días de margen
                const puntoReorden = provSel.leadTime + 10;
                let sugerencia = 0;
                let estado = "OK";

                if (cobertura <= puntoReorden) {
                  sugerencia = Math.ceil(p.ventaMensual * 5 * tendencia);
                  estado = cobertura < provSel.leadTime ? "CRÍTICO" : "REORDEN";
                }

                return (
                  <tr key={p.id} className="hover:bg-slate-700/30 transition-all group">
                    <td className="px-8 py-5">
                      <div className="text-white font-bold">{p.nombre}</div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase">{p.sku}</div>
                    </td>
                    <td className="px-6 py-5 text-center text-slate-300 font-mono">{p.stockActual.toLocaleString()}</td>
                    <td className="px-6 py-5 text-center text-blue-400 font-mono">{transito > 0 ? transito.toLocaleString() : '-'}</td>
                    <td className="px-6 py-5 text-center font-bold text-xs">
                      <span className={estado === 'OK' ? 'text-emerald-500' : estado === 'REORDEN' ? 'text-amber-500' : 'text-red-500'}>
                        {Math.floor(cobertura)} días
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {sugerencia > 0 ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 py-2 px-4 rounded-xl inline-block">
                          <span className="text-emerald-400 font-black text-base">{sugerencia.toLocaleString()}</span>
                        </div>
                      ) : <span className="text-slate-600 text-[10px] font-black uppercase">Cubierto</span>}
                    </td>
                    <td className="px-6 py-5 text-center font-black text-[9px]">
                       <span className={`px-3 py-1 rounded-full border ${estado === 'OK' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-red-500/20 text-red-500 bg-red-500/5'}`}>
                         {estado}
                       </span>
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

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-12">
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Planificador MRP</h2>
        <p className="text-slate-500 mt-2 font-bold text-xs uppercase tracking-widest">Selecciona una fábrica para analizar ciclos de 5 meses</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {proveedores.map(p => {
          const prodsCount = productos.filter(pr => pr.proveedorId === p.id).length;
          return (
            <div key={p.id} onClick={() => setProvSel(p)} className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] hover:border-emerald-500/50 hover:bg-slate-800 transition-all cursor-pointer group flex flex-col items-center text-center shadow-xl">
              <div className="p-4 bg-slate-800 rounded-2xl mb-6 group-hover:bg-emerald-500/10 transition-colors">
                <Folder className="text-slate-600 group-hover:text-emerald-400" size={32} />
              </div>
              <h3 className="text-white font-black text-xl uppercase tracking-tighter">{p.nombre}</h3>
              <div className="mt-4 flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{prodsCount} productos</span>
                <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">LT: {p.leadTime} días</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}