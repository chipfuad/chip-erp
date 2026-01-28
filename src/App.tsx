import React, { useState } from 'react';
import { LayoutDashboard, Calculator, Package, Users, Database, Globe, RefreshCw } from 'lucide-react';
import { DashboardTab } from './components/DashboardTab';
import { SimuladorTab } from './components/SimuladorTab';
import { ProductosTab } from './components/ProductosTab';
import { ProveedoresTab } from './components/ProveedoresTab';
import { CargaVentasTab } from './components/CargaVentasTab';

function App() {
  const [activeTab, setActiveTab] = useState('DASHBOARD');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex overflow-hidden">
      {/* SIDEBAR FIJA ESTRECHA */}
      <aside className="w-24 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full z-50">
        <div className="p-4 flex flex-col items-center">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30 mb-10 shadow-lg shadow-emerald-500/5">
            <Package size={24} className="text-emerald-400" />
          </div>
          
          <nav className="w-full">
            {/* GRUPO COMEX CON MENU LATERAL FLOTANTE */}
            <div className="relative group px-2">
              {/* Botón Principal COMEX */}
              <div className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl cursor-pointer transition-all duration-300 border border-transparent group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30">
                <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase leading-none">COMEX</span>
                <Globe size={20} className="text-emerald-400" />
              </div>

              {/* PUENTE INVISIBLE: Evita que el menú desaparezca al mover el mouse a la derecha */}
              <div className="absolute left-full top-0 w-12 h-full bg-transparent -z-10" />

              {/* EL POP-UP (Aparece a la derecha donde marcaste el círculo) */}
              <div className="absolute left-[calc(100%-8px)] top-0 pl-6 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-500 translate-x-4 group-hover:translate-x-0 z-[100]">
                <div className="w-64 bg-slate-900 border border-slate-700/50 rounded-[2rem] shadow-[30px_0px_80px_rgba(0,0,0,0.9)] p-3 backdrop-blur-2xl">
                  <div className="px-4 py-3 border-b border-slate-800/50 mb-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Módulos Inteligentes</p>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <SidebarSubItem 
                      icon={<LayoutDashboard size={18} />} 
                      label="Dashboard Global" 
                      active={activeTab === 'DASHBOARD'} 
                      onClick={() => setActiveTab('DASHBOARD')} 
                    />
                    <SidebarSubItem 
                      icon={<Database size={18} />} 
                      label="Inventario" 
                      active={activeTab === 'PRODUCTOS'} 
                      onClick={() => setActiveTab('PRODUCTOS')} 
                    />
                    <SidebarSubItem 
                      icon={<Users size={18} />} 
                      label="Proveedores" 
                      active={activeTab === 'PROVEEDORES'} 
                      onClick={() => setActiveTab('PROVEEDORES')} 
                    />
                    <SidebarSubItem 
                      icon={<RefreshCw size={18} />} 
                      label="Carga de Ventas" 
                      active={activeTab === 'CARGA_VENTAS'} 
                      onClick={() => setActiveTab('CARGA_VENTAS')} 
                    />
                    <SidebarSubItem 
                      icon={<Calculator size={18} />} 
                      label="Simulador MRP" 
                      active={activeTab === 'SIMULADOR'} 
                      onClick={() => setActiveTab('SIMULADOR')} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>
        
        {/* INDICADOR ONLINE INFERIOR */}
        <div className="mt-auto p-8 flex justify-center border-t border-slate-800/20">
          <div className="relative">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <div className="w-2 h-2 bg-emerald-500 rounded-full absolute top-0 animate-ping opacity-60" />
          </div>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 ml-24 p-10 min-h-screen bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'DASHBOARD' && <DashboardTab />}
          {activeTab === 'PRODUCTOS' && <ProductosTab />}
          {activeTab === 'PROVEEDORES' && <ProveedoresTab />}
          {activeTab === 'CARGA_VENTAS' && <CargaVentasTab />}
          {activeTab === 'SIMULADOR' && <SimuladorTab />}
        </div>
      </main>
    </div>
  );
}

function SidebarSubItem({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 w-full group/item ${
        active 
          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 border border-emerald-400/30' 
          : 'text-slate-400 hover:bg-slate-800/80 hover:text-white border border-transparent hover:border-slate-700'
      }`}
    >
      <span className={`${active ? 'text-white' : 'text-slate-500 group-hover/item:text-emerald-400'} transition-colors shrink-0`}>
        {icon}
      </span>
      <span className="font-bold text-[11px] whitespace-nowrap tracking-tight">{label}</span>
    </button>
  );
}

export default App;