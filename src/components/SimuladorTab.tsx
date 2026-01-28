import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, ArrowLeft, Folder, AlertTriangle, CheckCircle, Package, Clock, AlertCircle, Flame, Snowflake, Minus, Ship, Factory, Plus, X, Trash2 } from 'lucide-react';

// --- INTERFACES ---
interface VentaHistorica { id: number; fecha: string; cantidad: number; }
interface OrdenTransito { id: number; cantidad: number; estado: string; fechaPedido: string; }
interface Proveedor { id: number; nombre: string; leadTime: number; }
interface Producto { id: number; sku: string; nombre: string; stockActual: number; ventaMensual: number; proveedorId: number; cantidadPorCaja: number; proveedor?: Proveedor; ventasHistoricas?: VentaHistorica[]; ordenesEnTransito?: OrdenTransito[]; }

export function SimuladorTab() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null);
  const [modalPedido, setModalPedido] = useState<{producto: Producto | null, abierto: boolean}>({producto: null, abierto: false});
  
  const [formCantidad, setFormCantidad] = useState('');
  const [formEstado, setFormEstado] = useState('PRODUCCION');
  const [editandoOrdenId, setEditandoOrdenId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resProd, resProv] = await Promise.all([
        fetch('http://localhost:3000/api/productos'),
        fetch('http://localhost:3000/api/proveedores')
      ]);
      if (resProd.ok) setProductos(await resProd.json());
      if (resProv.ok) setProveedores(await resProv.json());
    } catch (error) { console.error("Error cargando datos", error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleGuardarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPedido.producto || !formCantidad) return;

    const url = editandoOrdenId 
        ? `http://localhost:3000/api/productos/transito/${editandoOrdenId}`
        : 'http://localhost:3000/api/productos/transito';
    
    const metodo = editandoOrdenId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productoId: modalPedido.producto.id,
                cantidad: Number(formCantidad),
                estado: formEstado,
                fechaPedido: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            cerrarModal();
            await fetchData(); 
        }
    } catch (error) { alert('Error al procesar la orden'); }
  };

  const handleBorrarPedido = async () => {
    if (!editandoOrdenId || !window.confirm("¿Seguro que quieres borrar este pedido?")) return;
    try {
        const response = await fetch(`http://localhost:3000/api/productos/transito/${editandoOrdenId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            cerrarModal();
            fetchData();
        }
    } catch (error) { alert("Error al borrar"); }
  };

  const cerrarModal = () => {
    setModalPedido({ producto: null, abierto: false });
    setFormCantidad('');
    setEditandoOrdenId(null);
    setFormEstado('PRODUCCION');
  };

  const getEstadoProveedor = (provId: number, leadTime: number) => {
    const prods = productos.filter(p => p.proveedorId === provId);
    let hayRojos = false;
    let hayAmarillos = false;

    prods.forEach(prod => {
        const stockEntrante = prod.ordenesEnTransito?.reduce((acc, o) => acc + o.cantidad, 0) || 0;
        const stockTotal = prod.stockActual + stockEntrante;
        if (prod.ventaMensual > 0) {
            const ventaDiaria = prod.ventaMensual / 30;
            const diasDeStock = stockTotal / ventaDiaria;
            const diasRestantes = diasDeStock - leadTime;
            if (diasRestantes <= 0) hayRojos = true;
            else if (diasRestantes <= 7) hayAmarillos = true;
        }
    });
    if (hayRojos) return 'ROJO';
    if (hayAmarillos) return 'AMARILLO';
    return 'VERDE';
  };

  const analizarTendencia = (historial: VentaHistorica[] | undefined) => {
    if (!historial || historial.length < 4) return { tipo: 'ESTABLE', factor: 1, icono: <Minus size={14} className="text-slate-500"/> };
    const ventasOrdenadas = [...historial].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    const avgReciente = ventasOrdenadas.slice(0, 3).reduce((sum, v) => sum + v.cantidad, 0) / 3;
    const avgBase = ventasOrdenadas.slice(3, 12).reduce((sum, v) => sum + v.cantidad, 0) / (ventasOrdenadas.length - 3);
    if (avgBase === 0) return { tipo: 'ESTABLE', factor: 1, icono: <Minus size={14} className="text-slate-500"/> };
    const diferencia = avgReciente / avgBase;
    if (diferencia >= 1.15) return { tipo: 'ALZA', factor: 1.10, icono: <div className="text-amber-500 text-[10px] font-bold">HOT</div> };
    if (diferencia <= 0.85) return { tipo: 'BAJA', factor: 0.90, icono: <div className="text-cyan-400 text-[10px] font-bold">COLD</div> };
    return { tipo: 'ESTABLE', factor: 1, icono: <div className="text-slate-500 text-[10px] font-bold">ESTABLE</div> };
  };

  const productosFiltrados = useMemo(() => {
    if (!proveedorSeleccionado) return [];
    return productos.filter(p => p.proveedorId === proveedorSeleccionado.id);
  }, [productos, proveedorSeleccionado]);

  return (
    <div className="animate-fade-in pb-10 relative">
      <div className="flex items-center gap-4 mb-8">
        {proveedorSeleccionado && (
            <button onClick={() => setProveedorSeleccionado(null)} className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-full"><ArrowLeft size={20} /></button>
        )}
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Calculator className="text-emerald-400" />
            {proveedorSeleccionado ? `Planificación: ${proveedorSeleccionado.nombre}` : 'Planificador de Compras (MRP)'}
        </h2>
      </div>

      {!proveedorSeleccionado ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6">
            {proveedores.map(prov => {
                const estado = getEstadoProveedor(prov.id, prov.leadTime);
                let colorClass = estado === 'ROJO' ? 'border-red-500/50' : estado === 'AMARILLO' ? 'border-amber-500/50' : 'border-emerald-500/50';
                let iconColor = estado === 'ROJO' ? 'text-red-500' : estado === 'AMARILLO' ? 'text-amber-500' : 'text-emerald-500';
                let tagColor = estado === 'ROJO' ? 'bg-red-500/20 text-red-400' : estado === 'AMARILLO' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400';

                return (
                    <div key={prov.id} onClick={() => setProveedorSeleccionado(prov)} className={`bg-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center border-2 ${colorClass} cursor-pointer hover:-translate-y-1 transition-all shadow-lg`}>
                        <Folder size={60} className={`${iconColor} mb-2`} />
                        <h3 className="text-xl font-bold text-white">{prov.nombre}</h3>
                        <div className={`px-3 py-1 rounded-full ${tagColor} text-xs font-bold mt-2`}>
                            {estado === 'ROJO' ? 'ATENCIÓN' : estado === 'AMARILLO' ? 'PLANIFICAR' : 'OK'}
                        </div>
                    </div>
                );
            })}
        </div>
      ) : (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-900 text-slate-200 uppercase font-bold text-xs tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Producto</th>
                        <th className="px-6 py-4 text-center">Stock Físico</th>
                        <th className="px-6 py-4 text-center w-48">Entrantes</th>
                        <th className="px-6 py-4 text-center">Venta Mensual</th>
                        <th className="px-6 py-4 text-center text-emerald-400">Sugerencia Compra</th>
                        <th className="px-6 py-4 text-center">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {productosFiltrados.map(prod => {
                        const tendencia = analizarTendencia(prod.ventasHistoricas);
                        const ventaDiaria = prod.ventaMensual / 30;
                        const stockFuturo = prod.ordenesEnTransito?.reduce((acc, o) => acc + o.cantidad, 0) || 0;
                        const stockTotal = prod.stockActual + stockFuturo;
                        const sugerencia = Math.max(0, Math.ceil(((ventaDiaria * proveedorSeleccionado.leadTime) - stockTotal) * tendencia.factor));
                        
                        const diasDeStock = ventaDiaria > 0 ? stockTotal / ventaDiaria : 999;
                        const diasAtraso = Math.ceil(proveedorSeleccionado.leadTime - diasDeStock);

                        return (
                            <tr key={prod.id} className="hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-white text-base">{prod.nombre}</div>
                                    <div className="text-xs text-slate-500">{prod.sku}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Package size={16} className="text-slate-500"/>
                                        <span className="text-white font-mono text-lg">{prod.stockActual.toLocaleString('es-CL')}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col gap-1">
                                        {prod.ordenesEnTransito?.map(orden => (
                                            <button 
                                                key={orden.id}
                                                onClick={() => {
                                                    setEditandoOrdenId(orden.id);
                                                    setFormCantidad(orden.cantidad.toString());
                                                    setFormEstado(orden.estado);
                                                    setModalPedido({ producto: prod, abierto: true });
                                                }}
                                                className={`flex items-center gap-2 text-[10px] font-bold px-2 py-1 rounded border hover:scale-105 transition-all ${orden.estado === 'TRANSITO' ? 'text-blue-400 border-blue-400/30 bg-blue-500/10' : 'text-amber-500 border-amber-500/30 bg-amber-500/10'}`}
                                            >
                                                {orden.estado === 'TRANSITO' ? <Ship size={10}/> : <Factory size={10}/>}
                                                {orden.cantidad.toLocaleString('es-CL')}
                                            </button>
                                        ))}
                                        <button 
                                            onClick={() => { setEditandoOrdenId(null); setModalPedido({producto: prod, abierto: true}); }}
                                            className="mt-1 text-slate-500 hover:text-emerald-400 text-[10px] border border-slate-700 px-2 py-1 rounded-lg"
                                        >
                                            <Plus size={10}/> {stockFuturo > 0 ? 'Añadir más' : 'Registrar'}
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="text-white font-mono">{prod.ventaMensual.toLocaleString('es-CL')}</span>
                                        {tendencia.icono}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {sugerencia > 0 ? (
                                        <span className={`text-2xl font-bold ${tendencia.tipo === 'ALZA' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            {sugerencia.toLocaleString('es-CL')}
                                        </span>
                                    ) : (<span className="text-slate-600 font-bold flex items-center justify-center gap-1"><CheckCircle size={14}/> Cubierto</span>)}
                                </td>
                                <td className="px-6 py-4">
                                    {stockTotal === 0 && prod.ventaMensual > 0 ? (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20"><AlertTriangle size={12}/> Quiebre</span>
                                    ) : diasAtraso > 0 && prod.ventaMensual > 0 ? (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20"><AlertCircle size={12}/> Tarde {diasAtraso}d</span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle size={12}/> OK</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      )}

      {modalPedido.abierto && modalPedido.producto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-600 shadow-2xl p-6 relative">
                <button onClick={cerrarModal} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-700/50 p-1 rounded-full"><X size={16}/></button>
                <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><Package className="text-emerald-400"/> {editandoOrdenId ? 'Editar Orden' : 'Registrar Stock Entrante'}</h3>
                <p className="text-sm text-slate-400 mb-6">Producto: {modalPedido.producto.nombre}</p>
                <form onSubmit={handleGuardarPedido} className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Estado del pedido</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => setFormEstado('PRODUCCION')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${formEstado === 'PRODUCCION' ? 'bg-amber-500/10 border-amber-500 text-amber-400 ring-1 ring-amber-500' : 'bg-slate-700 border-slate-600 text-slate-400'}`}><Factory size={24}/>En Fábrica</button>
                            <button type="button" onClick={() => setFormEstado('TRANSITO')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${formEstado === 'TRANSITO' ? 'bg-blue-500/10 border-blue-500 text-blue-400 ring-1 ring-blue-500' : 'bg-slate-700 border-slate-600 text-slate-400'}`}><Ship size={24}/>En Tránsito</button>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Cantidad</label>
                        <input type="number" autoFocus required value={formCantidad} onChange={(e) => setFormCantidad(e.target.value)} className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl p-3 font-mono text-lg" placeholder="0"/>
                    </div>
                    <div className="flex gap-3">
                        {editandoOrdenId && (
                            <button type="button" onClick={handleBorrarPedido} className="bg-red-500/20 hover:bg-red-500/40 text-red-500 p-3.5 rounded-xl transition-all shadow-lg"><Trash2 size={20}/></button>
                        )}
                        <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                            {editandoOrdenId ? 'Actualizar Orden' : 'Guardar Orden'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}