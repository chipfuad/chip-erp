import React, { useState, useEffect } from 'react';
import { Calculator, ArrowLeft, Folder, Plus, Trash2, Send, X, Package } from 'lucide-react';

export function SimuladorTab() {
  const [productos, setProductos] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [provSel, setProvSel] = useState<any>(null);
  const [tendencia, setTendencia] = useState(1.0);
  const [showEditor, setShowEditor] = useState<number | null>(null);
  
  const [nuevaCant, setNuevaCant] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState("PRODUCCION");

  const fetchData = () => {
    fetch('http://localhost:3000/api/productos').then(r => r.json()).then(setProductos);
    fetch('http://localhost:3000/api/proveedores').then(r => r.json()).then(setProveedores);
  };

  useEffect(() => { fetchData(); }, []);

  // Lógica de cierre por tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowEditor(null);
        setNuevaCant("");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const registrarTransito = async (productoId: number) => {
    if (!nuevaCant) return;
    await fetch('http://localhost:3000/api/productos/transito', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        productoId, 
        cantidad: Number(nuevaCant), 
        estado: nuevoEstado,
        fechaPedido: new Date() 
      })
    });
    setNuevaCant("");
    setShowEditor(null);
    fetchData();
  };

  const eliminarTransito = async (id: number) => {
    await fetch(`http://localhost:3000/api/productos/transito/${id}`, { method: 'DELETE' });
    fetchData();
  };

  if (provSel) {
    const productosFabrica = productos.filter(p => p.proveedorId === provSel.id);
    
    return (
      <div className="animate-in fade-in duration-500">
        <button onClick={() => setProvSel(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 font-bold uppercase text-xs tracking-widest transition-colors">
          <ArrowLeft size={16}/> Volver a Fábricas
        </button>
        
        <div className="mb-8">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Planificación: {provSel.nombre}</h2>
          <p className="text-emerald-500 text-xs font-bold uppercase tracking-widest mt-1 italic">Lead Time: {provSel.leadTime} días</p>
        </div>

        <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 overflow-hidden shadow-2xl relative">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-6">Producto</th>
                <th className="px-6 py-6 text-center">Stock Físico</th>
                <th className="px-6 py-6 text-center text-blue-400">En Tránsito / Pedidos</th>
                <th className="px-6 py-6 text-center">Venta Prom.</th>
                <th className="px-6 py-6 text-center">Cobertura</th>
                <th className="px-6 py-6 text-center text-emerald-400">Sugerencia (Ciclo {provSel.leadTime}d)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {productosFabrica.map((p: any) => {
                const enTransito = p.ordenesEnTransito || [];
                const ventaD = p.ventaMensual / 30;
                const totalTransito = enTransito.reduce((acc: number, o: any) => acc + o.cantidad, 0);
                const totalStock = p.stockActual + totalTransito;
                const cobertura = ventaD > 0 ? totalStock / ventaD : 999;
                
                const puntoReorden = provSel.leadTime + 10;
                let sugerencia = 0;
                if (cobertura <= puntoReorden) {
                  sugerencia = Math.ceil((ventaD * provSel.leadTime) * tendencia);
                }

                return (
                  <React.Fragment key={p.id}>
                    <tr className="hover:bg-slate-700/20 transition-all group">
                      <td className="px-8 py-6">
                        <div className="text-white font-bold">{p.nombre}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-tighter">{p.sku}</div>
                      </td>
                      <td className="px-6 py-6 text-center font-mono text-slate-200 font-bold">
                        {p.stockActual.toLocaleString()}
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="flex flex-col items-center gap-2">
                          {enTransito.map((o: any) => (
                            <div key={o.id} className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg">
                              <span className="text-[9px] font-black text-blue-300 uppercase">{o.estado}</span>
                              <span className="text-blue-400 font-bold text-xs">{o.cantidad.toLocaleString()}</span>
                              <button onClick={() => eliminarTransito(o.id)} className="text-red-400/50 hover:text-red-400"><Trash2 size={12}/></button>
                            </div>
                          ))}
                          <button onClick={() => setShowEditor(p.id)} className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase mt-2 flex items-center gap-1">
                            <Plus size={12}/> Registrar
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center text-slate-300 font-bold">
                        {Math.round(p.ventaMensual).toLocaleString()}
                      </td>
                      <td className="px-6 py-6 text-center font-black">
                        <span className={cobertura < provSel.leadTime ? 'text-red-500' : 'text-emerald-500'}>{Math.floor(cobertura)} DÍAS</span>
                      </td>
                      <td className="px-6 py-6 text-center font-black text-emerald-400 text-lg">
                        {sugerencia > 0 ? sugerencia.toLocaleString() : '-'}
                      </td>
                    </tr>
                    
                    {showEditor === p.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowEditor(null)} />
                        <tr className="bg-slate-900/80 relative z-50 animate-in slide-in-from-top-2">
                          <td colSpan={6} className="px-8 py-6 border-l-4 border-blue-500">
                            <div className="flex items-end gap-6">
                              <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase">Cantidad</span>
                                <input type="number" className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 w-40" value={nuevaCant} onChange={e => setNuevaCant(e.target.value)} autoFocus />
                              </div>
                              <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase">Estado</span>
                                <select className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 text-xs font-bold" value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)}>
                                  <option value="PRODUCCION">En Producción</option>
                                  <option value="TRANSITO">En Tránsito</option>
                                </select>
                              </div>
                              <button onClick={() => registrarTransito(p.id)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2">
                                <Send size={14}/> Confirmar
                              </button>
                              <button onClick={() => setShowEditor(null)} className="text-slate-500 hover:text-white p-2.5 bg-slate-800 rounded-xl">
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </>
                    )}
                  </React.Fragment>
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
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Planificador MRP</h2>
        <p className="text-slate-500 mt-2 font-bold text-xs uppercase tracking-widest text-center">Fábricas por Ciclo de Suministro</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {proveedores.map((p: any) => {
          const prodProv = productos.filter(pr => pr.proveedorId === p.id);
          const tieneAlerta = prodProv.some(pr => {
            const vD = pr.ventaMensual / 30;
            const t = pr.stockActual + (pr.ordenesEnTransito?.reduce((acc: any, o: any) => acc + o.cantidad, 0) || 0);
            return vD > 0 && (t / vD) <= (p.leadTime + 10);
          });

          return (
            <div key={p.id} onClick={() => setProvSel(p)} className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] hover:bg-slate-800 transition-all cursor-pointer group flex flex-col items-center shadow-2xl relative text-center">
              <Folder className={tieneAlerta ? "text-red-500" : "text-slate-600 group-hover:text-emerald-400"} size={40} />
              <h3 className="text-white font-black text-xl uppercase mt-4 tracking-tighter">{p.nombre}</h3>
              <span className="text-[10px] text-emerald-500 font-bold mt-2 italic uppercase">LT: {p.leadTime} días</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}