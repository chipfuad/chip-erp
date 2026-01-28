import React, { useEffect, useState, useMemo } from 'react';
import { DollarSign, Package, ShoppingCart, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface OrdenTransito { id: number; cantidad: number; estado: string; }
interface Producto {
  id: number;
  sku: string;
  nombre: string;
  stockActual: number;
  ventaMensual: number;
  precioFOB: number | string;
  moneda: string;
  ordenesEnTransito?: OrdenTransito[];
}

export function DashboardTab() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/productos')
      .then(res => res.json())
      .then(data => {
        setProductos(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const kpis = useMemo(() => {
    let totalValorInventario = 0;
    let totalPedidosPendientes = 0;
    let totalItemsEnTransito = 0;
    let productosEnQuiebre = 0;

    productos.forEach(p => {
      const precio = typeof p.precioFOB === 'string' ? parseFloat(p.precioFOB) : p.precioFOB;
      totalValorInventario += p.stockActual * (precio || 0);
      
      if (p.ordenesEnTransito) {
        totalPedidosPendientes += p.ordenesEnTransito.length;
        totalItemsEnTransito += p.ordenesEnTransito.reduce((acc, o) => acc + o.cantidad, 0);
      }

      if (p.stockActual === 0 && p.ventaMensual > 0) {
        productosEnQuiebre++;
      }
    });

    return {
      valorInventario: totalValorInventario,
      pedidosPendientes: totalPedidosPendientes,
      itemsEnTransito: totalItemsEnTransito,
      quiebres: productosEnQuiebre
    };
  }, [productos]);

  const topProductos = useMemo(() => {
    return [...productos]
      .sort((a, b) => b.ventaMensual - a.ventaMensual)
      .slice(0, 5)
      .map(p => ({
        name: p.nombre.length > 15 ? p.nombre.substring(0, 15) + '...' : p.nombre,
        ventas: p.ventaMensual
      }));
  }, [productos]);

  if (loading) return <div className="text-white p-10 animate-pulse">Cargando Dashboard...</div>;

  return (
    <div className="animate-fade-in pb-10">
      <h2 className="text-3xl font-bold text-white mb-6">Dashboard General</h2>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg hover:border-emerald-500/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Valor Inventario</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                ${kpis.valorInventario.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400"><DollarSign size={24} /></div>
          </div>
          <p className="text-xs text-slate-500">Costo FOB Total (USD)</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg hover:border-blue-500/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">En Tránsito</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {kpis.itemsEnTransito.toLocaleString()} <span className="text-sm font-normal text-slate-500">un.</span>
              </h3>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><ShoppingCart size={24} /></div>
          </div>
          <p className="text-xs text-slate-500">{kpis.pedidosPendientes} órdenes activas</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg hover:border-amber-500/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Top Venta</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {topProductos[0]?.ventas.toLocaleString() || 0} <span className="text-sm font-normal text-slate-500">/mes</span>
              </h3>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400"><TrendingUp size={24} /></div>
          </div>
          <p className="text-xs text-slate-500 truncate">Producto: {topProductos[0]?.name || 'N/A'}</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg hover:border-red-500/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Alertas Stock</p>
              <h3 className="text-2xl font-bold text-white mt-1">{kpis.quiebres}</h3>
            </div>
            <div className="p-3 bg-red-500/20 rounded-xl text-red-400"><AlertTriangle size={24} /></div>
          </div>
          <p className="text-xs text-slate-500">Productos sin stock con venta</p>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Activity size={20} className="text-cyan-400"/> Top 5 Productos Más Vendidos
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductos} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }} 
                  cursor={{fill: '#334155', opacity: 0.4}}
                />
                <Bar dataKey="ventas" fill="#4cc9f0" radius={[0, 4, 4, 0]} barSize={20}>
                  {topProductos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#4cc9f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col justify-center items-center text-center">
            <div className="p-4 bg-slate-700/50 rounded-full mb-4">
                <Package size={40} className="text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Gestión de Inventario</h3>
            <p className="text-slate-400 text-sm max-w-xs">
                Utiliza el módulo de productos para mantener tu catálogo actualizado y el simulador para prever tus próximas compras.
            </p>
        </div>
      </div>
    </div>
  );
}
