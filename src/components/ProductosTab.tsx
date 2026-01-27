import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, X, Folder, ArrowLeft, Box, Eye, Package, Clock, TrendingUp } from 'lucide-react';

// --- INTERFACES ---
interface Producto {
  id: number;
  sku: string;
  nombre: string;
  precioFOB: number | string;
  gramaje: string;
  paisOrigen: string;
  cantidadPorCaja: number;
  cantidadPorDisplay: number;
  moneda: string;
  duracion: string;
  ventaMensual: number; // NUEVO CAMPO
  proveedorId: number;
}

interface Proveedor {
  id: number;
  nombre: string;
  pais: string;
}

export function ProductosTab() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState<'CARPETAS' | 'LISTA'>('CARPETAS');
  const [proveedorActivo, setProveedorActivo] = useState<Proveedor | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [verDetalle, setVerDetalle] = useState<Producto | null>(null);
  
  // Estado inicial del formulario
  const [formData, setFormData] = useState<Producto>({
    id: 0, sku: '', nombre: '', precioFOB: '', gramaje: '', paisOrigen: '',
    cantidadPorCaja: 0, cantidadPorDisplay: 0, moneda: 'USD', duracion: '', 
    ventaMensual: 0, 
    proveedorId: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resProd, resProv] = await Promise.all([
        fetch('http://localhost:3000/api/productos'),
        fetch('http://localhost:3000/api/proveedores')
      ]);
      if (resProd.ok) setProductos(await resProd.json());
      if (resProv.ok) setProveedores(await resProv.json());
    } catch (error) { console.error("Error cargando datos", error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const conteoPorProveedor = useMemo(() => {
    const cuenta: Record<number, number> = {};
    productos.forEach(p => { cuenta[p.proveedorId] = (cuenta[p.proveedorId] || 0) + 1; });
    return cuenta;
  }, [productos]);

  const productosVisibles = productos.filter(p => {
    if (busqueda !== '') return p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.sku.toLowerCase().includes(busqueda.toLowerCase());
    if (proveedorActivo) return p.proveedorId === proveedorActivo.id;
    return true;
  });

  const abrirCarpeta = (prov: Proveedor) => { setProveedorActivo(prov); setVista('LISTA'); setBusqueda(''); };
  const volverACarpetas = () => { setProveedorActivo(null); setVista('CARPETAS'); setBusqueda(''); };

  const handleNuevo = () => {
    setFormData({
      id: 0, sku: '', nombre: '', precioFOB: '', gramaje: '', paisOrigen: '',
      cantidadPorCaja: 0, cantidadPorDisplay: 0, moneda: 'USD', duracion: '',
      ventaMensual: 0,
      proveedorId: proveedorActivo ? proveedorActivo.id : 0
    });
    setMostrarModal(true);
  };

  const handleEditar = (prod: Producto) => { setFormData(prod); setMostrarModal(true); };
  const handleVer = (prod: Producto) => { setVerDetalle(prod); };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let precioFinal = formData.precioFOB.toString().replace(',', '.');
      const precioNumerico = parseFloat(precioFinal) || 0;
      
      const dataToSend = { 
        ...formData, 
        precioFOB: precioNumerico,
        ventaMensual: Number(formData.ventaMensual) || 0,
        cantidadPorCaja: Number(formData.cantidadPorCaja) || 0,
        cantidadPorDisplay: Number(formData.cantidadPorDisplay) || 0
      };

      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id ? `http://localhost:3000/api/productos/${formData.id}` : 'http://localhost:3000/api/productos';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSend) });
      if (res.ok) { setMostrarModal(false); fetchData(); } else { alert('Error al guardar'); }
    } catch (error) { alert('Error de conexión'); }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Borrar este producto?')) return;
    try { await fetch(`http://localhost:3000/api/productos/${id}`, { method: 'DELETE' }); fetchData(); } catch (error) { alert('Error al eliminar'); }
  };

  const getGramajeValues = () => {
    const valor = parseFloat(formData.gramaje) || '';
    const unidad = formData.gramaje.replace(/[0-9.]/g, '').trim() || 'g'; 
    return { valor, unidad };
  };
  const updateGramaje = (valor: string | number, unidad: string) => { setFormData({ ...formData, gramaje: `${valor} ${unidad}` }); };
  const getNombreProveedor = (id: number) => { const p = proveedores.find(pr => pr.id === id); return p ? p.nombre : 'Sin Asignar'; };

  return (
    <div className="animate-fade-in">
      {/* 1. ENCABEZADO */}
      <div className="flex flex-wrap justify-between items-center mb-8 gap-5">
        <div className="flex items-center gap-4">
           {vista === 'LISTA' && (
               <button onClick={volverACarpetas} className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-full transition-colors">
                 <ArrowLeft size={20} />
               </button>
           )}
           <div>
               <h2 className="text-3xl font-bold text-white m-0">
                 {vista === 'CARPETAS' && busqueda === '' ? 'Catálogo por Proveedor' : (proveedorActivo ? proveedorActivo.nombre : 'Resultados')}
               </h2>
               <p className="text-slate-400 mt-1">
                 {vista === 'CARPETAS' && busqueda === '' ? 'Selecciona una carpeta para ver sus productos' : `${productosVisibles.length} productos encontrados`}
               </p>
           </div>
        </div>
        <div className="flex gap-4 flex-1 justify-end">
          <div className="relative min-w-[250px]">
            <Search className="absolute left-4 top-3 text-slate-400" size={20} />
            <input 
              placeholder="🔍 Buscar SKU o Nombre..." 
              value={busqueda} 
              onChange={e => { 
                setBusqueda(e.target.value); 
                if(e.target.value) setVista('LISTA'); 
                else if(!proveedorActivo) setVista('CARPETAS'); 
              }} 
              className="w-full py-3 px-4 pl-12 rounded-full bg-slate-800 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none transition-colors" 
            />
          </div>
          <button 
            onClick={handleNuevo} 
            className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-cyan-500/20"
          >
            <Plus size={20} /> Crear
          </button>
        </div>
      </div>

      {/* 2. VISTA DE CARPETAS */}
      {vista === 'CARPETAS' && busqueda === '' && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
            {proveedores.map(prov => (
                <div 
                  key={prov.id} 
                  onClick={() => abrirCarpeta(prov)} 
                  className="bg-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center border border-slate-700 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-cyan-400 group text-center gap-2"
                >
                    <Folder size={50} className="text-cyan-400 fill-cyan-400/20 group-hover:scale-110 transition-transform" />
                    <h3 className="mt-2 text-xl font-semibold text-white">{prov.nombre}</h3>
                    <span className="bg-slate-900 py-1 px-3 rounded-lg text-sm text-slate-400 border border-slate-800">
                      {conteoPorProveedor[prov.id] || 0} Items
                    </span>
                </div>
            ))}
            {conteoPorProveedor[0] > 0 && (
                <div 
                  onClick={() => abrirCarpeta({ id: 0, nombre: 'Sin Asignar', pais: '-' })}
                  className="bg-slate-800/50 rounded-2xl p-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-600 cursor-pointer hover:bg-slate-800 hover:border-slate-500 transition-all gap-2"
                >
                    <Box size={50} className="text-slate-500" />
                    <h3 className="mt-2 text-xl font-semibold text-slate-500">Sin Asignar</h3>
                    <span className="bg-slate-900 py-1 px-3 rounded-lg text-sm text-slate-500">
                      {conteoPorProveedor[0]} Items
                    </span>
                </div>
            )}
        </div>
      )}

      {/* 3. VISTA DE LISTA (TARJETAS) */}
      {(vista === 'LISTA' || busqueda !== '') && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
            {productosVisibles.map(prod => (
            <div key={prod.id} className="bg-slate-800 rounded-2xl p-5 flex flex-col justify-between border border-slate-700 hover:border-slate-600 transition-colors relative group">
                <div className="mb-4">
                    <div className="flex justify-between items-start mb-3">
                        <span className="bg-slate-900 px-2 py-1 rounded-md text-xs font-bold text-cyan-400 border border-slate-700">
                          {prod.sku}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleVer(prod)} className="p-1.5 rounded bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"><Eye size={16} /></button>
                            <button onClick={() => handleEditar(prod)} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white"><Edit size={16} /></button>
                            <button onClick={() => handleEliminar(prod.id)} className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"><Trash2 size={16} /></button>
                        </div>
                    </div>
                    <h3 
                      onClick={() => handleVer(prod)} 
                      className="text-xl font-medium text-white mb-3 cursor-pointer hover:text-cyan-400 transition-colors underline decoration-transparent hover:decoration-cyan-400 underline-offset-4"
                    >
                      {prod.nombre}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-400">
                         <div className="flex items-center gap-1.5"><Box size={14}/> {prod.cantidadPorCaja} x Caja</div>
                         <div className="flex items-center gap-1.5"><Clock size={14}/> {prod.duracion || 'N/A'}</div>
                    </div>
                </div>
                
                <div className="bg-slate-900 rounded-xl p-4 flex justify-between items-center border border-slate-800">
                    <div>
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">FOB</div>
                      <div className="text-lg font-bold text-emerald-400">{prod.moneda} {prod.precioFOB}</div>
                    </div>
                    {/* Indicador de Ventas */}
                    {prod.ventaMensual > 0 && (
                        <div className="text-right border-l border-slate-800 pl-4">
                            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Venta/Mes</div>
                            <div className="text-base font-bold text-cyan-400 flex items-center justify-end gap-1">
                                {prod.ventaMensual} <span className="text-xs font-normal text-slate-600">un.</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            ))}
        </div>
      )}

      {/* 4. MODAL FORMULARIO */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
            <div className="sticky top-0 bg-slate-800 p-6 border-b border-slate-700 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-white">{formData.id ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button onClick={() => setMostrarModal(false)} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleGuardar} className="p-6 grid grid-cols-2 gap-6">
                
                {/* SECCIÓN 1 */}
                <div className="col-span-2 text-cyan-400 text-sm font-bold border-b border-slate-700 pb-2 mt-2 uppercase tracking-wider">1. Identificación</div>
                
                <div className="space-y-1">
                  <label className="text-slate-400 text-sm">SKU</label>
                  <input required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-sm">Artículo</label>
                  <input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-sm">Proveedor</label>
                  <select value={formData.proveedorId} onChange={e => setFormData({...formData, proveedorId: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none">
                    <option value={0}>-- Seleccionar --</option>
                    {proveedores.map(prov => (<option key={prov.id} value={prov.id}>{prov.nombre}</option>))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-sm">Origen</label>
                  <input value={formData.paisOrigen} onChange={e => setFormData({...formData, paisOrigen: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none" />
                </div>

                {/* SECCIÓN 2 */}
                <div className="col-span-2 text-cyan-400 text-sm font-bold border-b border-slate-700 pb-2 mt-4 uppercase tracking-wider">2. Logística y Vida Útil</div>
                
                <div className="space-y-1">
                  <label className="text-slate-400 text-sm">Peso / Vol</label>
                  <div className="flex gap-2">
                    <input type="number" value={getGramajeValues().valor} onChange={e => updateGramaje(e.target.value, getGramajeValues().unidad)} className="w-2/3 bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none" />
                    <select value={getGramajeValues().unidad} onChange={e => updateGramaje(getGramajeValues().valor, e.target.value)} className="w-1/3 bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none">
                      <option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="L">L</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-sm">Duración (Vida Útil)</label>
                  <input value={formData.duracion || ''} onChange={e => setFormData({...formData, duracion: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none" placeholder="Ej: 12 meses" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-sm">Und x Display</label>
                  <input type="number" value={formData.cantidadPorDisplay} onChange={e => setFormData({...formData, cantidadPorDisplay: parseInt(e.target.value) || 0})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-sm">Und x Caja</label>
                  <input type="number" value={formData.cantidadPorCaja} onChange={e => setFormData({...formData, cantidadPorCaja: parseInt(e.target.value) || 0})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none" />
                </div>

                {/* SECCIÓN 3 */}
                <div className="col-span-2 text-cyan-400 text-sm font-bold border-b border-slate-700 pb-2 mt-4 uppercase tracking-wider">3. Económico</div>
                
                <div className="space-y-1">
                  <label className="text-slate-400 text-sm">Moneda</label>
                  <select value={formData.moneda} onChange={e => setFormData({...formData, moneda: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none">
                    <option value="USD">USD</option><option value="CNY">CNY</option><option value="EUR">EUR</option><option value="CLP">CLP</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-sm">Valor FOB</label>
                  <input type="text" value={formData.precioFOB} onChange={e => { const val = e.target.value; if (/^[\d.,]*$/.test(val)) setFormData({...formData, precioFOB: val}); }} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none" />
                </div>
                
                {/* --- NUEVA SECCIÓN 4: MRP --- */}
                <div className="col-span-2 bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 mt-4">
                    <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold uppercase tracking-wider mb-3">
                        <TrendingUp size={16}/> 4. Planificación de Compras (MRP)
                    </div>
                    <div>
                        <label className="text-slate-400 text-sm block mb-1">Venta Promedio Mensual (Unidades)</label>
                        <div className="flex items-center gap-3 bg-slate-900 border border-slate-600 rounded-lg px-3 focus-within:border-cyan-500 transition-colors">
                            <TrendingUp size={18} className="text-cyan-500" />
                            <input 
                                type="number" 
                                min="0"
                                value={formData.ventaMensual} 
                                onChange={e => setFormData({...formData, ventaMensual: parseInt(e.target.value) || 0})} 
                                className="w-full bg-transparent border-none text-white p-2.5 focus:ring-0"
                                placeholder="0"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Este dato se usará junto con el Lead Time del proveedor para calcular cuándo reabastecer stock.
                        </p>
                    </div>
                </div>

                {/* BOTONES */}
                <div className="col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-700 mt-2">
                    <button type="button" onClick={() => setMostrarModal(false)} className="px-5 py-2.5 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 font-medium transition-colors">Cancelar</button>
                    <button type="submit" className="px-6 py-2.5 rounded-lg bg-cyan-500 text-slate-900 hover:bg-cyan-400 font-bold transition-colors shadow-lg shadow-cyan-500/20">Guardar Producto</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL DETALLE */}
      {verDetalle && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setVerDetalle(null)}>
            <div className="bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-600 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-slate-900 p-6 flex gap-4 items-center border-b border-slate-700 relative overflow-hidden">
                    {/* Efecto decorativo de fondo */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg shadow-cyan-500/20 z-10">
                        <Package size={32} strokeWidth={2.5} />
                    </div>
                    <div className="z-10">
                        <div className="text-cyan-400 font-bold text-sm tracking-wide">{verDetalle.sku}</div>
                        <h2 className="text-2xl font-bold text-white leading-tight">{verDetalle.nombre}</h2>
                    </div>
                    <button onClick={() => setVerDetalle(null)} className="ml-auto text-slate-500 hover:text-white transition-colors z-10"><X size={24} /></button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">General</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-slate-700/50 pb-2">
                                <span className="text-slate-400">Proveedor</span>
                                <span className="text-white font-medium">{getNombreProveedor(verDetalle.proveedorId)}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-700/50 pb-2">
                                <span className="text-slate-400">Origen</span>
                                <span className="text-white font-medium">{verDetalle.paisOrigen}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Logística</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-slate-700/50 pb-2">
                                <span className="text-slate-400">Peso / Vol</span>
                                <span className="text-white font-medium">{verDetalle.gramaje || '-'}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-700/50 pb-2">
                                <span className="text-slate-400 flex items-center gap-2"><Clock size={14}/> Vida Útil</span>
                                <span className="text-amber-400 font-medium">{verDetalle.duracion || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-700/50 pb-2">
                                <span className="text-slate-400">Configuración</span>
                                <span className="text-white font-medium">{verDetalle.cantidadPorDisplay} x Display / {verDetalle.cantidadPorCaja} x Caja</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                             <div className="text-xs text-slate-500 uppercase font-bold">Costo FOB</div>
                             <div className="text-xl font-bold text-emerald-400 mt-1">{verDetalle.moneda} {verDetalle.precioFOB}</div>
                        </div>
                        <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/20">
                             <div className="text-xs text-cyan-400 uppercase font-bold flex items-center gap-1"><TrendingUp size={12}/> Venta Mensual</div>
                             <div className="text-xl font-bold text-white mt-1">{verDetalle.ventaMensual} <span className="text-sm font-normal text-slate-400">un.</span></div>
                        </div>
                    </div>
                </div>
                
                <div className="bg-slate-900 p-4 flex justify-center border-t border-slate-800">
                    <button 
                        onClick={() => { setMostrarModal(true); setFormData(verDetalle); setVerDetalle(null); }} 
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors border border-slate-700"
                    >
                        <Edit size={18} /> Editar Producto
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}