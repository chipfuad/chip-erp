import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, ArrowLeft, Folder, AlertTriangle, CheckCircle, TrendingUp, Clock, AlertCircle, Flame, Snowflake, Minus, Ship, Factory, Plus, X, Package } from 'lucide-react';

// --- INTERFACES ---
interface VentaHistorica {
  id: number;
  fecha: string;
  cantidad: number;
}

interface OrdenTransito {
  id: number;
  cantidad: number;
  estado: string; // 'PRODUCCION' | 'TRANSITO'
  fechaPedido: string;
}

interface Proveedor {
  id: number;
  nombre: string;
  leadTime: number; 
}

interface Producto {
  id: number;
  sku: string;
  nombre: string;
  stockActual: number;
  ventaMensual: number;
  proveedorId: number;
  cantidadPorCaja: number;
  proveedor?: Proveedor;
  ventasHistoricas?: VentaHistorica[];
  ordenesEnTransito?: OrdenTransito[]; 
}

export function SimuladorTab() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Navegación y Modales
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null);
  const [modalPedido, setModalPedido] = useState<{producto: Producto | null, abierto: boolean}>({producto: null, abierto: false});
  
  // Formulario Pedido
  const [formCantidad, setFormCantidad] = useState('');
  const [formEstado, setFormEstado] = useState('PRODUCCION'); // Por defecto entra a Producción

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
    } catch (error) {
      console.error("Error cargando datos", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- GUARDAR PEDIDO (API) ---
  const handleGuardarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPedido.producto || !formCantidad) return;

    try {
        await fetch('http://localhost:3000/api/productos/transito', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productoId: modalPedido.producto.id,
                cantidad: Number(formCantidad),
                fechaPedido: new Date().toISOString(),
                estado: formEstado // Aquí enviamos si es PRODUCCION o TRANSITO
            })
        });
        
        setModalPedido({ producto: null, abierto: false });
        setFormCantidad('');
        setFormEstado('PRODUCCION'); // Resetear al default
        fetchData(); 
    } catch (error) {
        alert('Error al guardar');
    }
  };

  // --- HELPERS ---
  const conteoPorProveedor = useMemo(() => {
    const cuenta: Record<number, number> = {};
    productos.forEach(p => { cuenta[p.proveedorId] = (cuenta[p.proveedorId] || 0) + 1; });
    return cuenta;
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    if (!proveedorSeleccionado) return [];
    return productos.filter(p => p.proveedorId === proveedorSeleccionado.id);
  }, [productos, proveedorSeleccionado]);

  // --- CÁLCULO DE TENDENCIA ---
  const analizarTendencia = (historial: VentaHistorica[] | undefined) => {
    if (!historial || historial.length < 4) return { tipo: 'ESTABLE', factor: 1, icono: <Minus size={14} className="text-slate-500"/> };
    
    const ventasOrdenadas = [...historial].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    const ultimos3Meses = ventasOrdenadas.slice(0, 3);
    const mesesAnteriores = ventasOrdenadas.slice(3, 12);
    
    if (mesesAnteriores.length === 0) return { tipo: 'ESTABLE', factor: 1, icono: <Minus size={14} className="text-slate-500"/> };

    const avgReciente = ultimos3Meses.reduce((sum, v) => sum + v.cantidad, 0) / ultimos3Meses.length;
    const avgBase = mesesAnteriores.reduce((sum, v) => sum + v.cantidad, 0) / mesesAnteriores.length;

    if (avgBase === 0) return { tipo: 'ESTABLE', factor: 1, icono: <Minus size={14} className="text-slate-500"/> };

    const diferencia = avgReciente / avgBase;
    if (diferencia >= 1.15) return { tipo: 'ALZA', factor: 1.10, icono: <div className="flex items-center text-amber-500 gap-1 text-[10px] font-bold"><Flame size={12}/> HOT</div> };
    if (diferencia <= 0.85) return { tipo: 'BAJA', factor: 0.90, icono: <div className="flex items-center text-cyan-400 gap-1 text-[10px] font-bold"><Snowflake size={12}/> COLD</div> };
    return { tipo: 'ESTABLE', factor: 1, icono: <div className="flex items-center text-slate-500 gap-1 text-[10px] font-bold"><Minus size={12}/> ESTABLE</div> };
  };

  // --- SEMÁFORO GLOBAL ---
  const getEstadoProveedor = (provId: number, leadTime: number) => {
    const prods = productos.filter(p => p.proveedorId === provId);
    let hayRojos = false;
    let hayAmarillos = false;

    prods.forEach(prod => {
        if (prod.ventaMensual > 0) {
            const stockTransito = prod.ordenesEnTransito?.reduce((acc, o) => acc + o.cantidad, 0) || 0;
            const stockTotal = prod.stockActual + stockTransito;
            
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

  const obtenerFechaHace = (dias: number) => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dias);
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="animate-fade-in pb-10 relative">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        {proveedorSeleccionado && (
            <button onClick={() => setProveedorSeleccionado(null)} className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-full transition-colors"><ArrowLeft size={20} /></button>
        )}
        <div>
            <h2 className="text-3xl font-bold text-white m-0 flex items-center gap-3">
                <Calculator className="text-emerald-400" />
                {proveedorSeleccionado ? `Planificación: ${proveedorSeleccionado.nombre}` : 'Planificador de Compras (MRP)'}
            </h2>
            <p className="text-slate-400 mt-1">Gestión de stock, pedidos en curso y sugerencias inteligentes.</p>
        </div>
      </div>

      {/* VISTA 1: CARPETAS */}
      {!proveedorSeleccionado && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6">
            {proveedores.map(prov => {
                const estado = getEstadoProveedor(prov.id, prov.leadTime);
                let color = estado === 'ROJO' ? 'red' : estado === 'AMARILLO' ? 'amber' : 'emerald';
                return (
                    <div key={prov.id} onClick={() => setProveedorSeleccionado(prov)} className={`bg-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center border-2 border-${color}-500/50 cursor-pointer hover:-translate-y-1 transition-all shadow-lg`}>
                        <Folder size={60} className={`text-${color}-500 mb-2`} />
                        <h3 className="text-xl font-bold text-white">{prov.nombre}</h3>
                        <div className={`px-3 py-1 rounded-full bg-${color}-500/20 text-${color}-400 text-xs font-bold mt-2`}>
                            {estado === 'ROJO' ? 'ATENCIÓN' : estado === 'AMARILLO' ? 'PLANIFICAR' : 'OK'}
                        </div>
                    </div>
                );
            })}
        </div>
      )}

      {/* VISTA 2: TABLA */}
      {proveedorSeleccionado && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-900 text-slate-200 uppercase font-bold text-xs tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Producto</th>
                            <th className="px-6 py-4 text-center">Stock Físico</th>
                            <th className="px-6 py-4 text-center w-40">Entrantes</th>
                            <th className="px-6 py-4 text-center">Venta Mensual</th>
                            <th className="px-6 py-4 text-center text-emerald-400">Sugerencia Compra</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {productosFiltrados.map(prod => {
                            const tendencia = analizarTendencia(prod.ventasHistoricas);
                            const ventaDiaria = prod.ventaMensual / 30;
                            const leadTime = proveedorSeleccionado.leadTime;
                            
                            // --- CÁLCULO SEPARADO ---
                            // Filtramos qué es producción y qué es tránsito
                            const cantProduccion = prod.ordenesEnTransito?.filter(o => o.estado === 'PRODUCCION').reduce((acc, o) => acc + o.cantidad, 0) || 0;
                            const cantTransito = prod.ordenesEnTransito?.filter(o => o.estado === 'TRANSITO').reduce((acc, o) => acc + o.cantidad, 0) || 0;
                            
                            // Para el cálculo matemático, ambos cuentan
                            const stockFuturo = cantProduccion + cantTransito;
                            const stockTotalCalculo = prod.stockActual + stockFuturo;

                            // CÁLCULO SUGERENCIA
                            const consumoEnEspera = ventaDiaria * leadTime;
                            let sugerenciaBase = consumoEnEspera - stockTotalCalculo; 
                            if (sugerenciaBase < 0) sugerenciaBase = 0;
                            
                            const sugerenciaFinal = Math.ceil(sugerenciaBase * tendencia.factor);
                            
                            // ESTADOS
                            const diasDeStock = ventaDiaria > 0 ? stockTotalCalculo / ventaDiaria : 9999;
                            const diasAtraso = Math.ceil(leadTime - diasDeStock);
                            const voyTarde = diasAtraso > 0 && prod.ventaMensual > 0;
                            const esCritico = stockTotalCalculo === 0 && prod.ventaMensual > 0;
                            
                            return (
                                <tr key={prod.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white text-base">{prod.nombre}</div>
                                        <div className="text-xs text-slate-500">{prod.sku}</div>
                                    </td>
                                    
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Package size={16} className="text-slate-500"/>
                                            <span className="text-white font-mono text-lg">{prod.stockActual}</span>
                                        </div>
                                    </td>
                                    
                                    {/* COLUMNA ENTRANTES (SEPARADA) */}
                                    <td className="px-6 py-4 text-center">
                                        {stockFuturo > 0 ? (
                                            <div className="flex flex-col gap-1 items-start justify-center pl-4">
                                                {cantTransito > 0 && (
                                                    <div className="flex items-center gap-2 text-xs text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded w-full">
                                                        <Ship size={12}/> {cantTransito} <span className="text-[10px] opacity-70 ml-auto">Viajando</span>
                                                    </div>
                                                )}
                                                {cantProduccion > 0 && (
                                                    <div className="flex items-center gap-2 text-xs text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded w-full">
                                                        <Factory size={12}/> {cantProduccion} <span className="text-[10px] opacity-70 ml-auto">Fábrica</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => setModalPedido({producto: prod, abierto: true})}
                                                className="mx-auto text-slate-500 hover:text-emerald-400 transition-colors flex items-center gap-1 text-[10px] border border-slate-700 hover:border-emerald-500 px-2 py-1 rounded-lg opacity-50 hover:opacity-100"
                                            >
                                                <Plus size={10}/> Agregar
                                            </button>
                                        )}
                                        {/* Botón pequeño para sumar más si ya hay stock */}
                                        {stockFuturo > 0 && (
                                            <div className="text-center mt-1">
                                                <button onClick={() => setModalPedido({producto: prod, abierto: true})} className="text-[10px] text-slate-600 hover:text-white underline">
                                                    + Agregar más
                                                </button>
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-white font-mono">{prod.ventaMensual}</span>
                                            {tendencia.icono}
                                        </div>
                                    </td>
                                    
                                    <td className="px-6 py-4 text-center">
                                        {sugerenciaFinal > 0 ? (
                                            <div className="inline-flex flex-col items-center group relative">
                                                <span className={`text-2xl font-bold ${tendencia.tipo === 'ALZA' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                    {sugerenciaFinal.toLocaleString('es-CL')}
                                                </span>
                                                <div className="absolute -top-8 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                    Base: {Math.ceil(sugerenciaBase)} {'→'} Ajuste: {sugerenciaFinal}
                                                </div>
                                            </div>
                                        ) : (<span className="text-slate-600 font-bold flex items-center justify-center gap-1"><CheckCircle size={14}/> Cubierto</span>)}
                                    </td>
                                    
                                    <td className="px-6 py-4">
                                        {esCritico ? (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20"><AlertTriangle size={12}/> Quiebre</span>
                                        ) : voyTarde ? (
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
        </div>
      )}

      {/* MODAL PARA AGREGAR PEDIDO - AHORA SÍ COMPLETO */}
      {modalPedido.abierto && modalPedido.producto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-600 shadow-2xl p-6 relative">
                
                <button 
                    onClick={() => setModalPedido({producto: null, abierto: false})} 
                    className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-700/50 p-1 rounded-full"
                >
                    <X size={16}/>
                </button>

                <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    <Package className="text-emerald-400"/> Registrar Stock Entrante
                </h3>
                <p className="text-sm text-slate-400 mb-6">Agrega órdenes que ya emitiste para ajustar el cálculo.</p>
                
                <div className="mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Producto</p>
                    <p className="text-lg font-bold text-white">{modalPedido.producto.nombre}</p>
                    <p className="text-sm text-slate-400 font-mono">{modalPedido.producto.sku}</p>
                </div>

                <form onSubmit={handleGuardarPedido} className="space-y-6">
                    {/* SELECTOR DE ESTADO */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">¿Dónde está el pedido?</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                type="button" 
                                onClick={() => setFormEstado('PRODUCCION')} 
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${formEstado === 'PRODUCCION' ? 'bg-amber-500/10 border-amber-500 text-amber-400 ring-1 ring-amber-500' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}
                            >
                                <Factory size={24}/>
                                <span className="font-bold text-sm">En Producción</span>
                            </button>

                            <button 
                                type="button" 
                                onClick={() => setFormEstado('TRANSITO')} 
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${formEstado === 'TRANSITO' ? 'bg-blue-500/10 border-blue-500 text-blue-400 ring-1 ring-blue-500' : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'}`}
                            >
                                <Ship size={24}/>
                                <span className="font-bold text-sm">En Tránsito</span>
                            </button>
                        </div>
                    </div>

                    {/* INPUT CANTIDAD */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Cantidad Solicitada</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                autoFocus
                                required
                                min="1"
                                value={formCantidad}
                                onChange={(e) => setFormCantidad(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl p-3 pl-4 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-mono text-lg"
                                placeholder="Ej: 5000"
                            />
                            <div className="absolute right-4 top-3.5 text-slate-500 text-sm font-bold">UN</div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={20}/> Guardar Orden
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}