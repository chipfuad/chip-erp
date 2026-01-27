import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Plus, Edit, Trash2, X, Folder, ArrowLeft, Box, Eye, Package, TrendingUp, Calendar, Save, Download, Upload } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- CONSTANTES ---
const MESES = [
  { val: '01', label: 'Enero' }, { val: '02', label: 'Febrero' },
  { val: '03', label: 'Marzo' }, { val: '04', label: 'Abril' },
  { val: '05', label: 'Mayo' }, { val: '06', label: 'Junio' },
  { val: '07', label: 'Julio' }, { val: '08', label: 'Agosto' },
  { val: '09', label: 'Septiembre' }, { val: '10', label: 'Octubre' },
  { val: '11', label: 'Noviembre' }, { val: '12', label: 'Diciembre' }
];
const ANIOS = [2023, 2024, 2025, 2026, 2027, 2028];

// --- INTERFACES ---
interface VentaHistorica { id: number; fecha: string; cantidad: number; }
interface Producto {
  id: number; sku: string; nombre: string; precioFOB: number | string; gramaje: string; paisOrigen: string;
  cantidadPorCaja: number; cantidadPorDisplay: number; moneda: string; duracion: string;
  ventaMensual: number; stockActual: number; proveedorId: number; ventasHistoricas?: VentaHistorica[];
}
interface Proveedor { id: number; nombre: string; pais: string; }

export function ProductosTab() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState<'CARPETAS' | 'LISTA'>('CARPETAS');
  const [proveedorActivo, setProveedorActivo] = useState<Proveedor | null>(null);
  const [busqueda, setBusqueda] = useState('');
  
  // Modales
  const [mostrarModalForm, setMostrarModalForm] = useState(false);
  const [verDetalle, setVerDetalle] = useState<Producto | null>(null);
  
  // BI Inputs
  const [mesSeleccionado, setMesSeleccionado] = useState('01');
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [cantidadVenta, setCantidadVenta] = useState('');

  // Referencia para el input de archivo (Excel)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formulario
  const [formData, setFormData] = useState<Producto>({
    id: 0, sku: '', nombre: '', precioFOB: '', gramaje: '', paisOrigen: '',
    cantidadPorCaja: 0, cantidadPorDisplay: 0, moneda: 'USD', duracion: '', 
    ventaMensual: 0, stockActual: 0, proveedorId: 0
  });

  // --- CARGA DE DATOS ---
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

  // --- EXCEL: DESCARGAR PLANTILLA ---
  const handleDescargarPlantilla = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/productos/plantilla');
        if (!response.ok) throw new Error('Error al generar plantilla');
        
        // Convertir la respuesta en un Blob (archivo)
        const blob = await response.blob();
        
        // Crear un enlace invisible para descargarlo
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "Plantilla_Ventas_Maestra.xlsx"; // Nombre del archivo
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        alert('No se pudo descargar la plantilla.');
        console.error(error);
    }
  };

  // --- EXCEL: SUBIR ARCHIVO (IMPORTAR) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        const file = files[0];
        const formData = new FormData();
        formData.append('archivo', file);

        setLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/productos/importar', {
                method: 'POST',
                body: formData 
            });
            
            const data = await res.json();
            if (res.ok) {
                alert(`✅ Archivo recibido. (Nota: La lógica de procesamiento se activará en el próximo paso).`);
                fetchData(); 
            } else {
                alert(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            alert('Error de conexión al subir archivo');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; 
        }
    }
  };

  // --- HELPERS ---
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
    setFormData({ id: 0, sku: '', nombre: '', precioFOB: '', gramaje: '', paisOrigen: '', cantidadPorCaja: 0, cantidadPorDisplay: 0, moneda: 'USD', duracion: '', ventaMensual: 0, stockActual: 0, proveedorId: proveedorActivo ? proveedorActivo.id : 0 });
    setMostrarModalForm(true);
  };

  const handleEditar = (prod: Producto) => { setFormData(prod); setMostrarModalForm(true); setVerDetalle(null); };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = { 
        ...formData, 
        precioFOB: parseFloat(formData.precioFOB.toString().replace(',', '.')) || 0,
        ventaMensual: Number(formData.ventaMensual) || 0,
        stockActual: Number(formData.stockActual) || 0,
        cantidadPorCaja: Number(formData.cantidadPorCaja) || 0,
        cantidadPorDisplay: Number(formData.cantidadPorDisplay) || 0,
        proveedorId: Number(formData.proveedorId)
      };
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id ? `http://localhost:3000/api/productos/${formData.id}` : 'http://localhost:3000/api/productos';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSend) });
      if (res.ok) { setMostrarModalForm(false); fetchData(); }
    } catch (error) { alert('Error de conexión'); }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Borrar este producto?')) return;
    try { await fetch(`http://localhost:3000/api/productos/${id}`, { method: 'DELETE' }); fetchData(); } catch (error) { alert('Error al eliminar'); }
  };

  const handleAgregarVentaHistorica = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verDetalle || !cantidadVenta) return;
    try {
        const fechaConstruida = `${anioSeleccionado}-${mesSeleccionado}-01`;
        const res = await fetch('http://localhost:3000/api/productos/historial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productoId: verDetalle.id, fecha: fechaConstruida, cantidad: cantidadVenta })
        });
        if (res.ok) {
            fetchData();
            const refreshRes = await fetch('http://localhost:3000/api/productos');
            const refreshData = await refreshRes.json();
            const productoActualizado = refreshData.find((p: any) => p.id === verDetalle.id);
            if (productoActualizado) { setVerDetalle(productoActualizado); setCantidadVenta(''); }
        }
    } catch (error) { console.error(error); }
  };

  const getNombreProveedor = (id: number) => { const p = proveedores.find(pr => pr.id === id); return p ? p.nombre : 'Sin Asignar'; };

  const chartData = verDetalle?.ventasHistoricas?.map(v => ({
    name: new Date(v.fecha).toLocaleDateString('es-ES', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
    ventas: v.cantidad
  })) || [];

  return (
    <div className="animate-fade-in pb-10">
      {/* 1. ENCABEZADO CON BOTONES EXCEL */}
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
        
        <div className="flex gap-3 flex-1 justify-end items-center">
          <div className="relative min-w-[200px] flex-1 max-w-[300px]">
            <Search className="absolute left-4 top-3 text-slate-400" size={20} />
            <input 
              placeholder="Buscar..." 
              value={busqueda} 
              onChange={e => { setBusqueda(e.target.value); if(e.target.value) setVista('LISTA'); else if(!proveedorActivo) setVista('CARPETAS'); }} 
              className="w-full py-3 px-4 pl-12 rounded-full bg-slate-800 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none transition-colors" 
            />
          </div>

          {/* BOTONES EXCEL */}
          <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-full border border-slate-700 ml-2">
              <button 
                onClick={handleDescargarPlantilla}
                className="p-2.5 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-colors"
                title="Descargar Plantilla Excel"
              >
                <Download size={20} />
              </button>
              
              <div className="w-px h-6 bg-slate-700"></div>

              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-full text-slate-400 hover:text-emerald-400 hover:bg-slate-700 transition-colors"
                title="Importar Ventas Excel"
              >
                <Upload size={20} />
              </button>
          </div>

          <button onClick={handleNuevo} className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 px-5 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-transform hover:scale-105">
            <Plus size={20} /> <span className="hidden md:inline">Crear</span>
          </button>
        </div>
      </div>

      {/* 2. VISTA CARPETAS */}
      {vista === 'CARPETAS' && busqueda === '' && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
            {proveedores.map(prov => (
                <div key={prov.id} onClick={() => abrirCarpeta(prov)} className="bg-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center border border-slate-700 cursor-pointer hover:-translate-y-1 hover:border-cyan-400 group text-center gap-2 transition-all">
                    <Folder size={50} className="text-cyan-400 fill-cyan-400/20 group-hover:scale-110 transition-transform" />
                    <h3 className="mt-2 text-xl font-semibold text-white">{prov.nombre}</h3>
                    <span className="bg-slate-900 py-1 px-3 rounded-lg text-sm text-slate-400 border border-slate-800">{conteoPorProveedor[prov.id] || 0} Items</span>
                </div>
            ))}
        </div>
      )}

      {/* 3. VISTA LISTA */}
      {(vista === 'LISTA' || busqueda !== '') && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
            {productosVisibles.map(prod => (
            <div key={prod.id} className="bg-slate-800 rounded-2xl p-5 flex flex-col justify-between border border-slate-700 hover:border-slate-600 relative group transition-colors">
                <div className="mb-4">
                    <div className="flex justify-between items-start mb-3">
                        <span className="bg-slate-900 px-2 py-1 rounded-md text-xs font-bold text-cyan-400 border border-slate-700">{prod.sku}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setVerDetalle(prod)} className="p-1.5 rounded bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"><Eye size={16} /></button>
                            <button onClick={() => handleEditar(prod)} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white"><Edit size={16} /></button>
                            <button onClick={() => handleEliminar(prod.id)} className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"><Trash2 size={16} /></button>
                        </div>
                    </div>
                    <h3 onClick={() => setVerDetalle(prod)} className="text-xl font-medium text-white mb-3 cursor-pointer hover:text-cyan-400 underline decoration-transparent hover:decoration-cyan-400 underline-offset-4 transition-all">
                      {prod.nombre}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm text-slate-400">
                         <div className="flex items-center gap-1.5"><Box size={14}/> {prod.stockActual} en Stock</div>
                         <div className="flex items-center gap-1.5"><TrendingUp size={14}/> {prod.ventaMensual} Prom/Mes</div>
                    </div>
                </div>
                <div className="bg-slate-900 rounded-xl p-4 flex justify-between items-center border border-slate-800">
                    <div>
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">FOB</div>
                      <div className="text-lg font-bold text-emerald-400">{prod.moneda} {prod.precioFOB}</div>
                    </div>
                </div>
            </div>
            ))}
        </div>
      )}

      {/* 4. MODAL DETALLE */}
      {verDetalle && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setVerDetalle(null)}>
            <div className="bg-slate-800 w-full max-w-5xl rounded-2xl border border-slate-600 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="bg-slate-900 p-6 flex gap-4 items-center border-b border-slate-700 shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg shadow-cyan-500/20">
                        <Package size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-cyan-400 font-bold text-sm tracking-wide">{verDetalle.sku}</div>
                        <h2 className="text-2xl font-bold text-white leading-tight">{verDetalle.nombre}</h2>
                    </div>
                    <button onClick={() => setVerDetalle(null)} className="ml-auto text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                </div>
                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Información General</h4>
                            <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                                <div className="flex justify-between border-b border-slate-700/50 pb-2"><span className="text-slate-400">Proveedor</span><span className="text-white font-medium">{getNombreProveedor(verDetalle.proveedorId)}</span></div>
                                <div className="flex justify-between border-b border-slate-700/50 pb-2"><span className="text-slate-400">Origen</span><span className="text-white font-medium">{verDetalle.paisOrigen || '-'}</span></div>
                                <div className="flex justify-between pb-1"><span className="text-slate-400">Configuración</span><span className="text-slate-200 text-sm">{verDetalle.cantidadPorDisplay} x Display / {verDetalle.cantidadPorCaja} x Caja</span></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900 rounded-xl p-4 border border-slate-700"><div className="text-xs text-slate-500 uppercase font-bold">Stock Físico</div><div className="text-2xl font-bold text-white mt-1">{verDetalle.stockActual} <span className="text-sm font-normal text-slate-500">un.</span></div></div>
                            <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/20"><div className="text-xs text-cyan-400 uppercase font-bold flex items-center gap-1"><TrendingUp size={12}/> Venta Promedio Histórica</div><div className="text-2xl font-bold text-white mt-1">{verDetalle.ventaMensual} <span className="text-sm font-normal text-cyan-500/50">un.</span></div></div>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-5 flex flex-col">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Calendar size={14}/> Comportamiento Histórico</h4>
                        <div className="flex-1 min-h-[200px] mb-6 relative">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc', borderRadius: '8px' }} cursor={{fill: '#334155', opacity: 0.4}} />
                                        <Bar dataKey="ventas" fill="#4cc9f0" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (<div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/50"><TrendingUp size={32} className="mb-2 opacity-50"/><p>No hay datos históricos.</p></div>)}
                        </div>
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <div className="text-xs text-cyan-400 font-bold uppercase mb-3 flex items-center gap-2"><Plus size={12}/> Agregar Venta Mensual</div>
                            <form onSubmit={handleAgregarVentaHistorica} className="flex gap-2 items-end">
                                <div className="flex-1 space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold">Mes</label><select className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:border-cyan-500 outline-none appearance-none" value={mesSeleccionado} onChange={e => setMesSeleccionado(e.target.value)}>{MESES.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}</select></div>
                                <div className="w-24 space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold">Año</label><select className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:border-cyan-500 outline-none appearance-none" value={anioSeleccionado} onChange={e => setAnioSeleccionado(Number(e.target.value))}>{ANIOS.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                                <div className="w-24 space-y-1"><label className="text-[10px] text-slate-500 uppercase font-bold">Cantidad</label><input type="number" required placeholder="0" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:border-cyan-500 outline-none" value={cantidadVenta} onChange={e => setCantidadVenta(e.target.value)} /></div>
                                <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 rounded-lg px-4 py-2 h-[34px] flex items-center justify-center transition-colors font-bold shadow-lg shadow-cyan-500/20"><Save size={16} /></button>
                            </form>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900 p-4 flex justify-end border-t border-slate-800 shrink-0">
                    <button onClick={() => handleEditar(verDetalle)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium transition-colors border border-slate-700"><Edit size={16} /> Editar Ficha Completa</button>
                </div>
            </div>
        </div>
      )}

      {/* 5. MODAL FORMULARIO */}
      {mostrarModalForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
             <div className="sticky top-0 bg-slate-800 p-6 border-b border-slate-700 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-white">{formData.id ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button onClick={() => setMostrarModalForm(false)} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleGuardar} className="p-6 grid grid-cols-2 gap-6">
                 <div className="col-span-2 text-cyan-400 text-xs font-bold border-b border-slate-700 pb-2 uppercase tracking-wider">Identificación</div>
                 <div className="space-y-1"><label className="text-slate-400 text-xs font-bold uppercase">SKU</label><input required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 outline-none" /></div>
                 <div className="space-y-1"><label className="text-slate-400 text-xs font-bold uppercase">Nombre</label><input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 outline-none" /></div>
                 <div className="space-y-1"><label className="text-slate-400 text-xs font-bold uppercase">Proveedor</label><select value={formData.proveedorId} onChange={e => setFormData({...formData, proveedorId: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 outline-none"><option value={0}>-- Seleccionar --</option>{proveedores.map(prov => (<option key={prov.id} value={prov.id}>{prov.nombre}</option>))}</select></div>
                 <div className="space-y-1"><label className="text-slate-400 text-xs font-bold uppercase">Origen</label><input value={formData.paisOrigen} onChange={e => setFormData({...formData, paisOrigen: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 outline-none" /></div>
                 <div className="col-span-2 text-cyan-400 text-xs font-bold border-b border-slate-700 pb-2 mt-4 uppercase tracking-wider">Logística & Costos</div>
                 <div className="space-y-1"><label className="text-slate-400 text-xs font-bold uppercase">Stock Actual</label><input type="number" value={formData.stockActual} onChange={e => setFormData({...formData, stockActual: parseInt(e.target.value) || 0})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 outline-none" /></div>
                 <div className="space-y-1"><label className="text-slate-400 text-xs font-bold uppercase">FOB ({formData.moneda})</label><input type="text" value={formData.precioFOB} onChange={e => setFormData({...formData, precioFOB: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 outline-none" /></div>
                 <div className="space-y-1"><label className="text-slate-400 text-xs font-bold uppercase">Un. por Display</label><input type="number" value={formData.cantidadPorDisplay} onChange={e => setFormData({...formData, cantidadPorDisplay: parseInt(e.target.value) || 0})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 outline-none" /></div>
                 <div className="space-y-1"><label className="text-slate-400 text-xs font-bold uppercase">Un. por Caja</label><input type="number" value={formData.cantidadPorCaja} onChange={e => setFormData({...formData, cantidadPorCaja: parseInt(e.target.value) || 0})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 outline-none" /></div>
                 <div className="col-span-2 flex justify-end gap-3 pt-6 border-t border-slate-700 mt-2">
                    <button type="button" onClick={() => setMostrarModalForm(false)} className="px-5 py-2.5 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600">Cancelar</button>
                    <button type="submit" className="px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold">Guardar</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}