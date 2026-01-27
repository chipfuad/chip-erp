import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, RefreshCw, AlertTriangle, CheckCircle, Truck } from 'lucide-react';

interface Proveedor {
  id: number;
  nombre: string;
  leadTime: number; // Días que tarda en llegar
}

interface Producto {
  id: number;
  sku: string;
  nombre: string;
  stockActual: number;
  ventaMensual: number;
  proveedorId: number;
  proveedor?: Proveedor; // Para acceder al leadTime
}

export function SimuladorTab() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos frescos
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/productos');
      const data = await res.json();
      setProductos(data);
    } catch (error) {
      console.error("Error cargando datos para simulación", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- EL CEREBRO (LÓGICA MRP) ---
  const calculos = useMemo(() => {
    return productos.map(prod => {
      const leadTime = prod.proveedor?.leadTime || 0;
      // Venta Diaria = Venta Mensual / 30
      const ventaDiaria = prod.ventaMensual / 30;
      
      // Stock Necesario = (Lo que vendo al día * Los días que tarda en llegar el barco)
      const stockNecesario = Math.ceil(ventaDiaria * leadTime);
      
      // Sugerencia = Lo que necesito - Lo que tengo. (Si da negativo, es 0)
      const sugerenciaCompra = Math.max(0, stockNecesario - prod.stockActual);
      
      // Estados de Alerta
      let estado: 'CRITICO' | 'ADVERTENCIA' | 'OK' = 'OK';
      if (prod.stockActual <= 0) estado = 'CRITICO'; // Quiebre de stock
      else if (prod.stockActual < stockNecesario) estado = 'ADVERTENCIA'; // No alcanzo a reponer

      return {
        ...prod,
        leadTime,
        ventaDiaria,
        stockNecesario,
        sugerenciaCompra,
        estado
      };
    }).sort((a, b) => b.sugerenciaCompra - a.sugerenciaCompra); // Ordenar: Más urgente primero
  }, [productos]);

  // Totales para el resumen
  const totalAComprar = calculos.reduce((acc, item) => acc + item.sugerenciaCompra, 0);
  const itemsCriticos = calculos.filter(i => i.estado === 'CRITICO' || i.sugerenciaCompra > 0).length;

  return (
    <div className="animate-fade-in space-y-6">
      
      {/* 1. HEADER CON RESUMEN (DASHBOARD) */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
            <h2 className="text-3xl font-bold text-white m-0">Planificador de Compras (MRP)</h2>
            <p className="text-slate-400 mt-1">
                El sistema calcula cuándo pedir basándose en tu <strong>Venta Mensual</strong> y el <strong>Lead Time</strong> del proveedor.
            </p>
        </div>
        <div className="flex gap-4">
             {/* Tarjeta de Alertas */}
             <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4 shadow-lg">
                <div className={`p-3 rounded-lg ${itemsCriticos > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {itemsCriticos > 0 ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
                </div>
                <div>
                    <div className="text-xs text-slate-500 uppercase font-bold">Items a Pedir</div>
                    <div className="text-2xl font-bold text-white">{itemsCriticos}</div>
                </div>
             </div>
             
             {/* Tarjeta de Volumen */}
             <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4 shadow-lg">
                <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-lg">
                    <ShoppingCart size={24} />
                </div>
                <div>
                    <div className="text-xs text-slate-500 uppercase font-bold">Volumen Total</div>
                    <div className="text-2xl font-bold text-white">{totalAComprar} <span className="text-sm font-normal text-slate-500">un.</span></div>
                </div>
             </div>
             
             {/* Botón Recalcular */}
             <button 
                onClick={fetchData} 
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-4 rounded-xl border border-slate-700 transition-colors h-full flex items-center justify-center hover:text-cyan-400 hover:border-cyan-500/30"
                title="Actualizar Datos"
             >
                <RefreshCw size={24} />
             </button>
        </div>
      </div>

      {/* 2. TABLA INTELIGENTE */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-slate-400 uppercase text-xs tracking-wider">
                <tr>
                    <th className="p-5 font-bold border-b border-slate-700">Producto</th>
                    <th className="p-5 font-bold border-b border-slate-700 text-center">Datos Clave</th>
                    <th className="p-5 font-bold border-b border-slate-700 text-center">Análisis de Cobertura</th>
                    <th className="p-5 font-bold border-b border-slate-700 text-right bg-slate-900/50">Sugerencia</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
                {loading ? (
                   <tr><td colSpan={4} className="p-10 text-center text-slate-500 animate-pulse">Analizando inventario y ventas...</td></tr> 
                ) : calculos.length === 0 ? (
                   <tr><td colSpan={4} className="p-10 text-center text-slate-500">No hay productos registrados para analizar.</td></tr> 
                ) : (
                    calculos.map(item => (
                        <tr key={item.id} className={`group transition-colors ${item.sugerenciaCompra > 0 ? 'hover:bg-red-500/5' : 'hover:bg-emerald-500/5'}`}>
                            
                            {/* COLUMNA 1: PRODUCTO */}
                            <td className="p-5">
                                <div className="flex items-center gap-3">
                                    {/* Indicador visual de estado */}
                                    <div className={`w-1.5 h-12 rounded-full ${item.sugerenciaCompra > 0 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-emerald-500/50'}`}></div>
                                    <div>
                                        <div className="font-bold text-white text-lg">{item.nombre}</div>
                                        <div className="text-cyan-400 text-xs font-bold bg-cyan-500/10 px-2 py-0.5 rounded w-fit mt-1 border border-cyan-500/20">{item.sku}</div>
                                        <div className="text-slate-500 text-xs mt-1.5 flex items-center gap-1">
                                            <Truck size={10}/> {item.proveedor?.nombre || 'Sin Proveedor Asignado'}
                                        </div>
                                    </div>
                                </div>
                            </td>

                            {/* COLUMNA 2: VARIABLES */}
                            <td className="p-5">
                                <div className="flex justify-center gap-6 text-sm">
                                    <div className="text-center">
                                        <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Stock Hoy</div>
                                        <div className={`font-bold text-lg ${item.stockActual === 0 ? 'text-red-500' : 'text-white'}`}>
                                            {item.stockActual}
                                        </div>
                                    </div>
                                    
                                    <div className="w-px bg-slate-700 h-10 self-center"></div>
                                    
                                    <div className="text-center">
                                        <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Venta/Mes</div>
                                        <div className="font-bold text-lg text-cyan-400">{item.ventaMensual}</div>
                                    </div>
                                    
                                    <div className="w-px bg-slate-700 h-10 self-center"></div>
                                    
                                    <div className="text-center">
                                        <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Lead Time</div>
                                        <div className="font-bold text-lg text-amber-400">{item.leadTime} <span className="text-xs text-slate-500 font-normal">días</span></div>
                                    </div>
                                </div>
                            </td>

                            {/* COLUMNA 3: ANÁLISIS */}
                            <td className="p-5 bg-slate-800/50">
                                <div className="space-y-2 text-sm max-w-[250px] mx-auto">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">Stock Mínimo Necesario:</span>
                                        <span className="text-white font-bold">{item.stockNecesario} un.</span>
                                    </div>
                                    
                                    {/* Barra de Progreso */}
                                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-500 ${item.stockActual >= item.stockNecesario ? 'bg-emerald-500' : 'bg-red-500'}`}
                                            style={{ width: `${Math.min(100, (item.stockActual / (item.stockNecesario || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                    
                                    <div className="text-[11px] text-center">
                                        {item.stockActual >= item.stockNecesario 
                                            ? <span className="text-emerald-400 flex items-center justify-center gap-1"><CheckCircle size={10}/> Cobertura OK</span> 
                                            : <span className="text-red-400 flex items-center justify-center gap-1">⚠️ Faltan {(item.stockNecesario - item.stockActual)} para cubrir la espera</span>
                                        }
                                    </div>
                                </div>
                            </td>

                            {/* COLUMNA 4: SUGERENCIA */}
                            <td className={`p-5 text-right font-mono border-l border-slate-700 ${item.sugerenciaCompra > 0 ? 'bg-red-500/10' : ''}`}>
                                {item.sugerenciaCompra > 0 ? (
                                    <div className="animate-in slide-in-from-right-2">
                                        <div className="text-[10px] text-red-300 font-bold uppercase mb-1 flex items-center justify-end gap-1">
                                            PEDIDO SUGERIDO <ShoppingCart size={12}/>
                                        </div>
                                        <div className="text-3xl font-bold text-red-400 tracking-tighter">
                                            +{item.sugerenciaCompra}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="opacity-40">
                                        <div className="text-[10px] text-emerald-400 font-bold uppercase mb-1 flex items-center justify-end gap-1">
                                            NO PEDIR <CheckCircle size={12}/>
                                        </div>
                                        <div className="text-2xl font-bold text-emerald-500 tracking-tighter">
                                            0
                                        </div>
                                    </div>
                                )}
                            </td>

                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
}