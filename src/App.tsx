import React, { useState } from 'react';
import { Package, Users, BarChart3, ChevronRight, Globe, LayoutGrid, TrendingUp, Bell } from 'lucide-react';
import { ProductosTab } from './components/ProductosTab';
import { ProveedoresTab } from './components/ProveedoresTab';
import { SimuladorTab } from './components/SimuladorTab';

// --- COMPONENTE INTERNO: BOTÓN DEL MENÚ ---
interface MenuButtonProps {
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}

const MenuButton = ({ label, icon: Icon, isActive, onClick }: MenuButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
        ${isActive 
          ? 'bg-cyan-500/15 text-cyan-400 font-semibold' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }
      `}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
      )}
      <Icon size={16} className={isActive ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};

// --- APP PRINCIPAL ---
function App() {
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [hoverComex, setHoverComex] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 text-sm overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-[240px] flex flex-col border-r border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 relative z-50 shadow-2xl">
        
        {/* LOGO AREA */}
        <div className="p-5 mb-1 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <LayoutGrid size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-white text-lg font-bold tracking-tight leading-tight">CERP</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enterprise</p>
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex-1 px-3 space-y-1 overflow-visible">
          
          <div className="px-3 mt-4 mb-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            Principal
          </div>

          {/* BOTÓN DESPLEGABLE (Módulo COMEX) */}
          <div 
            className="relative group"
            onMouseEnter={() => setHoverComex(true)}
            onMouseLeave={() => setHoverComex(false)}
          >
              <button 
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all duration-200
                  ${hoverComex 
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-white shadow-lg shadow-cyan-500/5' 
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                  }
                `}
              >
                <div className="flex items-center gap-2.5">
                    <Globe size={18} className={hoverComex ? 'text-cyan-400' : 'text-slate-500'} />
                    <span className="text-xs font-semibold">Módulo COMEX</span>
                </div>
                <ChevronRight size={14} className={`transition-transform duration-200 ${hoverComex ? 'translate-x-1 text-cyan-400' : 'text-slate-600'}`} />
              </button>

              {/* MENÚ FLOTANTE (POP-OVER) - CORREGIDO CON PUENTE INVISIBLE */}
              {hoverComex && (
                <div 
                    className={`
                        absolute left-[100%] top-0 w-60 ml-2 
                        bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-xl p-2 
                        shadow-[0_0_40px_rgba(0,0,0,0.5)] z-[9999] 
                        animate-in fade-in slide-in-from-left-2 duration-150
                        
                        /* EL TRUCO DEL PUENTE INVISIBLE: */
                        before:content-[''] before:absolute before:-left-4 before:top-0 before:h-full before:w-4 before:bg-transparent
                    `}
                >
                    {/* Flechita decorativa */}
                    <div className="absolute top-3.5 -left-1.5 w-3 h-3 bg-slate-900 border-l border-b border-slate-700 rotate-45"></div>

                    <div className="relative z-10">
                        <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50 mb-1">
                        Gestión Operativa
                        </div>
                        
                        <div className="space-y-0.5">
                        <MenuButton 
                            label="Dashboard General" icon={BarChart3} 
                            isActive={activeTab === 'DASHBOARD'} 
                            onClick={() => { setActiveTab('DASHBOARD'); setHoverComex(false); }} 
                        />
                        <MenuButton 
                            label="Catálogo de Productos" icon={Package} 
                            isActive={activeTab === 'PRODUCTOS'} 
                            onClick={() => { setActiveTab('PRODUCTOS'); setHoverComex(false); }} 
                        />
                        <MenuButton 
                            label="Base de Proveedores" icon={Users} 
                            isActive={activeTab === 'PROVEEDORES'} 
                            onClick={() => { setActiveTab('PROVEEDORES'); setHoverComex(false); }} 
                        />
                        </div>
                        
                        <div className="px-3 py-2 mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800/50 mb-1">
                        Inteligencia & Compras
                        </div>

                        <div className="space-y-0.5">
                        <MenuButton 
                            label="Planificador MRP" icon={TrendingUp} 
                            isActive={activeTab === 'SIMULADOR'} 
                            onClick={() => { setActiveTab('SIMULADOR'); setHoverComex(false); }} 
                        />
                        </div>
                    </div>
                </div>
              )}
          </div>

        </nav>

        {/* STATUS FOOTER */}
        <div className="p-4 mt-auto">
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800/80 flex items-center gap-3">
                <div className="relative flex-shrink-0">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <div className="absolute top-0 left-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <div className="overflow-hidden">
                    <div className="text-[11px] font-bold text-white truncate">Sistema Online</div>
                    <div className="text-[9px] text-slate-500 font-mono truncate">v1.0.7 Bridge Fix</div>
                </div>
            </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 scroll-smooth">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
            
            {/* HEADER SUPERIOR */}
            <header className="flex justify-between items-center mb-8">
              <div>
                  <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
                      {activeTab === 'DASHBOARD' && 'Panel de Control'}
                      {activeTab === 'PRODUCTOS' && 'Gestión de Productos'}
                      {activeTab === 'PROVEEDORES' && 'Directorio de Proveedores'}
                      {activeTab === 'SIMULADOR' && 'Planificador de Compras'}
                  </h1>
                  <p className="text-slate-400 mt-1 text-sm font-light">
                    Bienvenido al sistema de gestión inteligente COMEX.
                  </p>
              </div>
              
              <div className="flex items-center gap-4">
                  <button className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-colors relative group">
                    <Bell size={18} className="group-hover:animate-swing origin-top" />
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-slate-900"></span>
                  </button>
                  <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
                      <div className="text-right hidden md:block">
                          <div className="text-xs font-bold text-white">Administrador</div>
                          <div className="text-[10px] text-cyan-400 uppercase tracking-wider">Super Usuario</div>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-500/20 ring-2 ring-slate-900 cursor-pointer hover:ring-cyan-500/50 transition-all">
                          AD
                      </div>
                  </div>
              </div>
            </header>

            {/* CONTENIDO DINÁMICO */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'DASHBOARD' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="bg-slate-900/50 backdrop-blur-sm p-5 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-colors group cursor-default">
                          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 group-hover:text-slate-400 transition-colors">Ventas Totales</div>
                          <div className="text-3xl font-bold text-white mb-1">$0</div>
                          <div className="text-[11px] text-slate-600">Sin movimientos recientes</div>
                      </div>
                      <div className="bg-slate-900/50 backdrop-blur-sm p-5 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-colors group cursor-default">
                          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 group-hover:text-slate-400 transition-colors">Pedidos Activos</div>
                          <div className="text-3xl font-bold text-cyan-400 mb-1">0</div>
                          <div className="text-[11px] text-slate-600">Órdenes en tránsito</div>
                      </div>
                      <div className="bg-slate-900/50 backdrop-blur-sm p-5 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-colors group cursor-default">
                          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 group-hover:text-slate-400 transition-colors">Estado MRP</div>
                          <div className="text-3xl font-bold text-emerald-500 mb-1">OK</div>
                          <div className="text-[11px] text-slate-600">Niveles de stock óptimos</div>
                      </div>
                  </div>
                )}
                {activeTab === 'PRODUCTOS' && <ProductosTab />}
                {activeTab === 'PROVEEDORES' && <ProveedoresTab />}
                {activeTab === 'SIMULADOR' && <SimuladorTab />}
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;