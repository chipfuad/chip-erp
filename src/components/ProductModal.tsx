import React, { useState, useMemo } from 'react';
import { X, Package, TrendingUp, Box, Calendar, Plus, Save, Edit } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- CONSTANTES LOCALES ---
const MESES = [
  { val: '01', label: 'Enero' }, { val: '02', label: 'Febrero' },
  { val: '03', label: 'Marzo' }, { val: '04', label: 'Abril' },
  { val: '05', label: 'Mayo' }, { val: '06', label: 'Junio' },
  { val: '07', label: 'Julio' }, { val: '08', label: 'Agosto' },
  { val: '09', label: 'Septiembre' }, { val: '10', label: 'Octubre' },
  { val: '11', label: 'Noviembre' }, { val: '12', label: 'Diciembre' }
];
const ANIOS = [2023, 2024, 2025, 2026, 2027, 2028];

// --- INTERFACES (AQUÍ FALTABA PROVEEDOR) ---
export interface VentaHistorica { id: number; fecha: string; cantidad: number; }

// AGREGADA ESTA INTERFAZ QUE FALTABA:
export interface Proveedor { id: number; nombre: string; pais: string; }

export interface Producto {
  id: number; sku: string; nombre: string; precioFOB: number | string; gramaje: string; paisOrigen: string;
  cantidadPorCaja: number; cantidadPorDisplay: number; moneda: string; duracion: string;
  ventaMensual: number; stockActual: number; proveedorId: number; ventasHistoricas?: VentaHistorica[];
}

interface ProductModalProps {
  producto: Producto | null;
  nombreProveedor: string;
  onClose: () => void;
  onEdit: (prod: Producto) => void;
  onRefresh: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ producto, nombreProveedor, onClose, onEdit, onRefresh }) => {
  const [mesSeleccionado, setMesSeleccionado] = useState('01');
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [cantidadVenta, setCantidadVenta] = useState('');
  const [loadingVenta, setLoadingVenta] = useState(false);

  // --- LÓGICA DEL GRÁFICO CORREGIDA ---
  const chartData = useMemo(() => {
    if (!producto?.ventasHistoricas || producto.ventasHistoricas.length === 0) return [];

    // Ordenamos por fecha para asegurar que el gráfico tenga sentido cronológico
    const historialOrdenado = [...producto.ventasHistoricas].sort((a, b) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    return historialOrdenado.map(v => {
      // Usamos UTC para evitar que "2025-08-01" se convierta en "31 de Julio" por la zona horaria
      const date = new Date(v.fecha);
      const label = new Intl.DateTimeFormat('es-ES', { 
        month: 'short', 
        year: '2-digit', 
        timeZone: 'UTC' 
      }).format(date);
      
      // Capitalizar primera letra (ago -> Ago)
      const labelCapitalized = label.charAt(0).toUpperCase() + label.slice(1);

      return {
        name: labelCapitalized,
        ventas: v.cantidad
      };
    });
  }, [producto]);

  // --- AGREGAR VENTA MANUALMENTE ---
  const handleAgregarVentaHistorica = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!producto || !cantidadVenta) return;

    setLoadingVenta(true);
    try {
      // Construimos fecha día 01 para consistencia
      const fechaConstruida = `${anioSeleccionado}-${mesSeleccionado}-01`;
      
      const res = await fetch('http://localhost:3000/api/productos/historial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productoId: producto.id, 
          fecha: fechaConstruida, 
          cantidad: Number(cantidadVenta) 
        })
      });

      if (res.ok) {
        setCantidadVenta(''); // Limpiar input
        onRefresh(); // Recargar datos en el padre
      } else {
        alert('Error al guardar venta');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setLoadingVenta(false);
    }
  };

  if (!producto) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-slate-800 w-full max-w-5xl rounded-2xl border border-slate-600 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="bg-slate-900 p-6 flex gap-4 items-center border-b border-slate-700 shrink-0">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg shadow-cyan-500/20">
            <Package size={32} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-cyan-400 font-bold text-sm tracking-wide">{producto.sku}</div>
            <h2 className="text-2xl font-bold text-white leading-tight">{producto.nombre}</h2>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* COLUMNA IZQUIERDA: DATOS */}
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Información General</h4>
              <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                <div className="flex justify-between border-b border-slate-700/50 pb-2"><span className="text-slate-400">Proveedor</span><span className="text-white font-medium">{nombreProveedor}</span></div>
                <div className="flex justify-between border-b border-slate-700/50 pb-2"><span className="text-slate-400">Origen</span><span className="text-white font-medium">{producto.paisOrigen || '-'}</span></div>
                <div className="flex justify-between pb-1"><span className="text-slate-400">Configuración</span><span className="text-slate-200 text-sm">{producto.cantidadPorDisplay} x Display / {producto.cantidadPorCaja} x Caja</span></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                <div className="text-xs text-slate-500 uppercase font-bold">Stock Actual</div>
                <div className="text-2xl font-bold text-white mt-1">{producto.stockActual} <span className="text-sm font-normal text-slate-500">un.</span></div>
              </div>
              <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/20">
                <div className="text-xs text-cyan-400 uppercase font-bold flex items-center gap-1"><TrendingUp size={12}/> Venta Promedio</div>
                <div className="text-2xl font-bold text-white mt-1">{producto.ventaMensual} <span className="text-sm font-normal text-cyan-500/50">un.</span></div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: GRÁFICO Y ACCIONES */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-5 flex flex-col">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Calendar size={14}/> Comportamiento Histórico</h4>
            
            {/* GRÁFICO */}
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
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/50">
                  <TrendingUp size={32} className="mb-2 opacity-50"/>
                  <p>No hay datos históricos.</p>
                </div>
              )}
            </div>

            {/* INPUT MANUAL */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-xs text-cyan-400 font-bold uppercase mb-3 flex items-center gap-2"><Plus size={12}/> Agregar Venta Mensual</div>
              <form onSubmit={handleAgregarVentaHistorica} className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">Mes</label>
                  <select className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:border-cyan-500 outline-none appearance-none" value={mesSeleccionado} onChange={e => setMesSeleccionado(e.target.value)}>
                    {MESES.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                  </select>
                </div>
                <div className="w-24 space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">Año</label>
                  <select className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:border-cyan-500 outline-none appearance-none" value={anioSeleccionado} onChange={e => setAnioSeleccionado(Number(e.target.value))}>
                    {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="w-24 space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">Cantidad</label>
                  <input type="number" required placeholder="0" className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs focus:border-cyan-500 outline-none" value={cantidadVenta} onChange={e => setCantidadVenta(e.target.value)} />
                </div>
                <button type="submit" disabled={loadingVenta} className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 rounded-lg px-4 py-2 h-[34px] flex items-center justify-center transition-colors font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50">
                  <Save size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-slate-900 p-4 flex justify-end border-t border-slate-800 shrink-0">
          <button onClick={() => onEdit(producto)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-medium transition-colors border border-slate-700">
            <Edit size={16} /> Editar Ficha Completa
          </button>
        </div>
      </div>
    </div>
  );
};