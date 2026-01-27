import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, ArrowLeft, Folder, AlertTriangle, CheckCircle, TrendingUp, Package, Clock } from 'lucide-react';

// --- INTERFACES ---
interface Proveedor {
  id: number;
  nombre: string;
  leadTime: number; // Tiempo de reposición en días
}

interface Producto {
  id: number;
  sku: string;
  nombre: string;
  stockActual: number;
  ventaMensual: number; // Promedio histórico
  proveedorId: number;
  cantidadPorCaja: number;
  proveedor?: Proveedor; // Para leer el leadTime
}

export function SimuladorTab() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado de navegación
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null);

  // --- CARGA DE DATOS ---
  useEffect(() => {
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
    fetchData();
  }, []);

  // --- HELPERS ---
  const conteoPorProveedor = useMemo(() => {
    const cuenta: Record<number, number> = {};
    productos.forEach(p => { cuenta[p.proveedorId] = (cuenta[p.proveedorId] || 0) + 1; });
    return cuenta;
  }, [productos]);

  // Filtrar productos del proveedor activo
  const productosFiltrados = useMemo(() => {
    if (!proveedorSeleccionado) return [];
    return productos.filter(p => p.proveedorId === proveedorSeleccionado.id);
  }, [productos, proveedorSeleccionado]);

  // --- LÓGICA MRP (CÁLCULOS) ---
  const calcularSugerencia = (prod: Producto, leadTime: number) => {
    // 1. Venta Diaria
    const ventaDiaria = prod.ventaMensual / 30;
    
    // 2. Consumo durante el Lead Time (¿Cuánto voy a vender mientras llega el barco?)
    const consumoEnEspera = ventaDiaria * leadTime;
    
    // 3. Stock de Seguridad (Opcional: Por ahora usaremos el consumo como base)
    //    Si quieres ser más conservador, multiplicas esto por 1.2 o 1.5
    const stockNecesario = consumoEnEspera;

    // 4. ¿Cuánto pedir?
    let sugerencia = stockNecesario - prod.stockActual;
    
    // Si la sugerencia es negativa (tengo de sobra), es 0
    if (sugerencia < 0) sugerencia = 0;

    // 5. Redondear a Cajas (Opcional pero útil)
    // Si vendes por cajas, aquí podríamos dividir por prod.cantidadPorCaja y redondear hacia arriba
    
    return Math.ceil(sugerencia);
  };

  return (
    <div className="animate-fade-in pb-10">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        {proveedorSeleccionado && (
            <button 
                onClick={() => setProveedorSeleccionado(null)} 
                className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-full transition-colors"
            >
                <ArrowLeft size={20} />
            </button>
        )}
        <div>
            <h2 className="text-3xl font-bold text-white m-0 flex items-center gap-3">
                <Calculator className="text-emerald-400" />
                {proveedorSeleccionado ? `Planificación: ${proveedorSeleccionado.nombre}` : 'Planificador de Compras (MRP)'}
            </h2>
            <p className="text-slate-400 mt-1">
                {proveedorSeleccionado 
                    ? `Lead Time configurado: ${proveedorSeleccionado.leadTime} días`
                    : 'Selecciona un proveedor para calcular sus necesidades de reposición.'}
            </p>
        </div>
      </div>

      {/* VISTA 1: LISTA DE CARPETAS (PROVEEDORES) */}
      {!proveedorSeleccionado && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
            {proveedores.map(prov => (
                <div 
                  key={prov.id} 
                  onClick={() => setProveedorSeleccionado(prov)} 
                  className="bg-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center border border-slate-700 cursor-pointer hover:-translate-y-1 hover:border-emerald-400 group text-center gap-2 transition-all shadow-lg"
                >
                    <Folder size={50} className="text-emerald-400 fill-emerald-400/20 group-hover:scale-110 transition-transform" />
                    <h3 className="mt-2 text-xl font-semibold text-white">{prov.nombre}</h3>
                    <div className="flex gap-2 text-xs mt-1">
                        <span className="bg-slate-900 px-2 py-1 rounded text-slate-400 border border-slate-700">
                             {conteoPorProveedor[prov.id] || 0} Items
                        </span>
                        <span className="bg-slate-900 px-2 py-1 rounded text-emerald-400 border border-slate-700 flex items-center gap-1">
                             <Clock size={10}/> {prov.leadTime} días
                        </span>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* VISTA 2: TABLA DE CÁLCULO (MRP) */}
      {proveedorSeleccionado && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-900 text-slate-200 uppercase font-bold text-xs tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Producto</th>
                            <th className="px-6 py-4 text-center">Stock Actual</th>
                            <th className="px-6 py-4 text-center">Venta Mensual</th>
                            <th className="px-6 py-4 text-center text-emerald-400">Sugerencia Compra</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {productosFiltrados.map(prod => {
                            const sugerencia = calcularSugerencia(prod, proveedorSeleccionado.leadTime);
                            const esCritico = prod.stockActual === 0 && prod.ventaMensual > 0;
                            const esUrgente = sugerencia > 0;

                            return (
                                <tr key={prod.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white text-base">{prod.nombre}</div>
                                        <div className="text-xs text-slate-500">{prod.sku}</div>
                                    </td>
                                    
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Package size={16} />
                                            <span className="text-white font-mono text-lg">{prod.stockActual}</span>
                                        </div>
                                    </td>
                                    
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <TrendingUp size={16} />
                                            <span className="text-white font-mono text-lg">{prod.ventaMensual}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        {esUrgente ? (
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-2xl font-bold text-emerald-400">{sugerencia} un.</span>
                                                {prod.cantidadPorCaja > 0 && (
                                                    <span className="text-[10px] text-slate-500">
                                                        ({Math.ceil(sugerencia / prod.cantidadPorCaja)} Cajas aprox)
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-slate-600 font-bold">-</span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        {esCritico ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                                <AlertTriangle size={12}/> Quiebre
                                            </span>
                                        ) : esUrgente ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                <Clock size={12}/> Reponer
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                <CheckCircle size={12}/> OK
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {productosFiltrados.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                                    No hay productos asociados a este proveedor.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* FOOTER DEL SIMULADOR */}
            <div className="bg-slate-900/50 p-4 border-t border-slate-700 flex justify-between items-center text-xs text-slate-500">
                <p>Cálculo basado en: (Venta Mensual / 30) × Lead Time - Stock Actual.</p>
                <div className="flex gap-4">
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Stock OK</div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Sugerencia Compra</div>
                     <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Sin Stock</div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}