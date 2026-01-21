import React, { useState, useEffect } from 'react';
import { InventarioTable, ComexRegistro, InventarioTableProps } from './InventarioTable';
import { ProductosManager } from './ProductosManager';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const commonOptions = {
  responsive: true,
  plugins: { legend: { labels: { color: '#a0a0a0' } } },
  scales: {
    y: { grid: { color: '#2a2a40' }, ticks: { color: '#a0a0a0' } },
    x: { grid: { color: '#2a2a40' }, ticks: { color: '#a0a0a0' } }
  }
};

function App() {
  const [activeModule, setActiveModule] = useState('COMEX');
  // Sub-sección dentro de COMEX: 'INVENTARIO' o 'PROVEEDORES'
  const [comexView, setComexView] = useState<'DASHBOARD' | 'INVENTARIO' | 'PROVEEDORES' | 'PROYECCIONES' | 'PRODUCTOS'>('DASHBOARD');
  
  const [data, setData] = useState<ComexRegistro[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Estado para el Modal y Formulario
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({ 
    cveArt: '', 
    articulo: '', 
    eta: '', 
    proveedorId: '',
    stockActual: 0,
    unidadesTransito: 0,
    consumoPromedio: 0,
    fechaVencimiento: '',
    leadTime: 45
  });
  const [newProveedor, setNewProveedor] = useState({ nombre: '', contacto: '', email: '', telefono: '', direccion: '' });
  const [hoverComex, setHoverComex] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setErrorMsg('');
    // Usamos la ruta relativa para aprovechar el proxy de Vite
    fetch('/api/comex')
      .then(async (res) => {
        if (!res.ok) {
            // Si el servidor responde con error (404, 500), intentamos leer el texto
            const text = await res.text();
            throw new Error(`Error del servidor: ${res.status} ${res.statusText} - ${text}`);
        }
        return res.json();
      })
      .then((json) => {
        setData(json.datos || []);
      })
      .catch((error) => {
        console.error('Error al obtener datos:', error);
        setErrorMsg(error.message);
      })
      .finally(() => setLoading(false));
  };

  const fetchProveedores = () => {
    setLoading(true);
    fetch('/api/comex/proveedores')
      .then(res => res.json())
      .then(json => {
        setProveedores(json.datos || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/comex/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      if (!res.ok) throw new Error('Error al crear');
      
      setShowModal(false);
      setNewItem({ cveArt: '', articulo: '', eta: '', proveedorId: '', stockActual: 0, unidadesTransito: 0, consumoPromedio: 0, fechaVencimiento: '', leadTime: 45 }); // Limpiar form
      fetchData(); // Recargar tabla
    } catch (error) {
      console.error("Error al crear:", error);
      alert("Error al crear el registro");
    }
  };

  const handleCreateProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/comex/proveedores/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProveedor)
      });
      if (!res.ok) throw new Error('Error al crear proveedor');
      
      setShowModal(false);
      setNewProveedor({ nombre: '', contacto: '', email: '', telefono: '', direccion: '' });
      fetchProveedores();
    } catch (error) {
      console.error(error);
      alert("Error al crear proveedor");
    }
  };

  const handleUpdate = async (id: number, field: string, value: any) => {
    try {
      await fetch(`/api/comex/actualizar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      fetchData(); // Recargar para ver cambios
    } catch (error) {
      console.error("Error al actualizar:", error);
    }
  };

  // Datos para el gráfico de proveedores
  const providerChartData = {
    labels: proveedores.map(p => p.nombre),
    datasets: [{
      label: 'Pedidos por Proveedor',
      data: proveedores.map(p => data.filter(d => d.proveedor?.nombre === p.nombre).length),
      backgroundColor: 'rgba(233, 69, 96, 0.6)',
      borderColor: '#e94560',
      borderWidth: 1
    }]
  };

  // Datos para gráfico de Ventas (Agrupado por mes)
  const ventasPorMes = data.reduce((acc: any, curr) => {
    const mes = curr.mesVentas || 'Sin Mes';
    if (!acc[mes]) acc[mes] = 0;
    acc[mes] += (curr.totalVentas || 0);
    return acc;
  }, {});

  const salesChartData = {
    labels: Object.keys(ventasPorMes),
    datasets: [{
      label: 'Total Ventas ($)',
      data: Object.values(ventasPorMes),
      borderColor: '#4cc9f0',
      backgroundColor: 'rgba(76, 201, 240, 0.2)',
      tension: 0.4,
      fill: true
    }]
  };

  // Datos para gráficos de Proyecciones
  const machineVsWholesaleData = {
    labels: data.slice(0, 10).map(d => d.cveArt || d.articulo?.substring(0, 8)), // Top 10 para no saturar
    datasets: [
      { label: 'Ventas Máquina', data: data.slice(0, 10).map(d => d.ventasMaquina || 0), backgroundColor: '#4cc9f0' },
      { label: 'Ventas Mayorista', data: data.slice(0, 10).map(d => d.ventasMayorista || 0), backgroundColor: '#e94560' }
    ]
  };

  const complianceData = {
    labels: data.slice(0, 10).map(d => d.cveArt || d.articulo?.substring(0, 8)),
    datasets: [{
      label: 'Pronóstico Cumplimiento (%)',
      data: data.slice(0, 10).map(d => (d.porcentajeCumplimiento || 0) * 100),
      borderColor: '#f1c40f',
      backgroundColor: 'rgba(241, 196, 15, 0.2)',
      tension: 0.3,
      fill: true
    }]
  };

  // KPIs
  const totalAlerta = data.filter(d => (d.mesesStockProy || 0) < 1.5).length;
  const proximoPedido = data
    .filter(d => d.fechaSugeridaPedido && new Date(d.fechaSugeridaPedido) > new Date())
    .sort((a, b) => new Date(a.fechaSugeridaPedido!).getTime() - new Date(b.fechaSugeridaPedido!).getTime())[0]?.fechaSugeridaPedido;
  const diasInvPromedio = data.length ? (data.reduce((acc, curr) => acc + (curr.mesesStockReal || 0) * 30, 0) / data.length).toFixed(0) : 0;

  useEffect(() => {
    if (activeModule === 'COMEX') {
      fetchData();
      fetchProveedores();
    }
  }, [activeModule]);

  // Lógica de Cálculo (Frontend)
  const calcularProyeccion = () => {
    const stock = Number(newItem.stockActual) || 0;
    const transito = Number(newItem.unidadesTransito) || 0;
    const consumo = Number(newItem.consumoPromedio) || 0;
    const lead = Number(newItem.leadTime) || 45;
    
    const autonomiaMeses = consumo > 0 ? stock / consumo : 0;
    
    // Fecha sugerida: Hoy + (Autonomía Total en días) - LeadTime
    const stockTotal = stock + transito;
    const diasAutonomiaTotal = consumo > 0 ? (stockTotal / consumo) * 30 : 0;
    const fechaSugerida = new Date();
    fechaSugerida.setDate(fechaSugerida.getDate() + (diasAutonomiaTotal - lead));

    const esUrgente = autonomiaMeses < 1.5; // Menos de 45 días

    return { autonomiaMeses, fechaSugerida, esUrgente };
  };

  const proyeccion = calcularProyeccion();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#1a1a2e', color: 'white' }}>
      <aside style={{ width: '180px', background: '#16213e', padding: '15px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: '#4cc9f0', marginBottom: '30px', textAlign: 'center' }}>CHIP ERP</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Botón COMEX con Submenú */}
          <div 
            onMouseEnter={() => setHoverComex(true)}
            onMouseLeave={() => setHoverComex(false)}
            style={{ position: 'relative' }}
          >
            <button 
              onClick={() => { setActiveModule('COMEX'); setComexView('DASHBOARD'); }}
              style={{ 
                padding: '12px', width: '100%',
                background: activeModule === 'COMEX' ? 'rgba(76, 201, 240, 0.1)' : 'transparent',
                border: 'none', color: activeModule === 'COMEX' ? '#4cc9f0' : '#a0a0a0', 
                textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontWeight: 'bold', transition: 'all 0.2s'
              }}
            >
              COMEX
            </button>
            <div style={{ 
              position: 'absolute', 
              left: '100%', 
              top: 0, 
              background: '#16213e', 
              border: '1px solid #0f3460', 
              padding: '10px', 
              zIndex: 100, 
              width: '200px', 
              borderRadius: '0 8px 8px 0', 
              boxShadow: '5px 0 15px rgba(0,0,0,0.3)',
              opacity: hoverComex ? 1 : 0,
              visibility: hoverComex ? 'visible' : 'hidden',
              transform: hoverComex ? 'translateX(0)' : 'translateX(-10px)',
              transition: 'all 0.3s ease-in-out'
            }}>
              <div onClick={() => { setActiveModule('COMEX'); setComexView('PROVEEDORES'); setHoverComex(false); }} style={{ padding: '8px', color: '#e0e0e0', cursor: 'pointer', borderBottom: '1px solid #2a2a40' }}>Información de Proveedores</div>
              <div onClick={() => { setActiveModule('COMEX'); setComexView('PRODUCTOS'); setHoverComex(false); }} style={{ padding: '8px', color: '#e0e0e0', cursor: 'pointer', borderBottom: '1px solid #2a2a40' }}>Maestro de Productos</div>
              <div onClick={() => { setActiveModule('COMEX'); setComexView('PROYECCIONES'); setSelectedSupplier(null); setHoverComex(false); }} style={{ padding: '8px', color: '#e0e0e0', cursor: 'pointer', borderBottom: '1px solid #2a2a40' }}>Proyecciones</div>
              <div onClick={() => { setActiveModule('COMEX'); setComexView('INVENTARIO'); setHoverComex(false); }} style={{ padding: '8px', color: '#e0e0e0', cursor: 'pointer' }}>Inventario</div>
            </div>
          </div>

          {['RRHH', 'Contabilidad'].map(mod => (
            <button 
              key={mod} 
              onClick={() => setActiveModule(mod)}
              style={{ 
                padding: '12px', 
                background: activeModule === mod ? 'rgba(76, 201, 240, 0.1)' : 'transparent',
                border: 'none', 
                color: activeModule === mod ? '#4cc9f0' : '#a0a0a0', 
                textAlign: 'left', 
                cursor: 'pointer', 
                borderRadius: '8px',
                fontWeight: activeModule === mod ? 'bold' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              {mod}
            </button>
          ))}
        </nav>
      </aside>

      <main style={{ flex: 1, width: '100%', minWidth: 0, padding: '20px', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <header style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'normal', margin: 0 }}>Módulo: <span style={{ color: '#4cc9f0', fontWeight: 'bold' }}>{activeModule}</span></h1>
          <div style={{ color: '#a0a0a0', whiteSpace: 'nowrap' }}>Usuario: <strong>Admin</strong></div>
        </header>

        {activeModule === 'COMEX' ? (
          <>
             {/* VISTA DASHBOARD */}
             {comexView === 'DASHBOARD' && (
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px', width: '100%' }}>
                <div className="card" style={{ flex: '1 1 45%', minWidth: '300px', background: '#16213e', padding: '15px', borderRadius: '10px' }}>
                  <h3 style={{ color: '#4cc9f0', marginBottom: '15px' }}>Evolución de Ventas</h3>
                  <Line data={salesChartData} options={commonOptions} />
                </div>
                <div className="card" style={{ flex: '1 1 45%', minWidth: '300px', background: '#16213e', padding: '15px', borderRadius: '10px' }}>
                  <h3 style={{ color: '#4cc9f0', marginBottom: '15px' }}>Compras por Proveedor</h3>
                  <Bar data={providerChartData} options={commonOptions} />
                </div>
                <div className="card" style={{ flex: '1 1 45%', minWidth: '300px', background: '#16213e', padding: '15px', borderRadius: '10px' }}>
                  <h3 style={{ color: '#4cc9f0', marginBottom: '15px' }}>Distribución</h3>
                  <div style={{ height: '200px', display: 'flex', justifyContent: 'center' }}>
                    <Doughnut data={{ labels: ['A1', 'V1'], datasets: [{ data: [30, 50], backgroundColor: ['#4cc9f0', '#e94560'], borderWidth: 0 }] }} options={{ plugins: { legend: { labels: { color: '#a0a0a0' } } } }} />
                  </div>
                </div>
              </div> 
             )}

             {/* VISTA PROYECCIONES (KPIs y Gráficos) */}
             {comexView === 'PROYECCIONES' && selectedSupplier && (
               <div style={{ marginBottom: '20px' }}>
                 {/* Tarjetas Superiores */}
                 <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
                   <div className="card" style={{ flex: 1, minWidth: '200px', background: '#16213e', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #4cc9f0' }}>
                     <div style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>Días de Inventario Promedio</div>
                     <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white' }}>{diasInvPromedio} días</div>
                   </div>
                   <div className="card" style={{ flex: 1, minWidth: '200px', background: '#16213e', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #f1c40f' }}>
                     <div style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>Próximo Pedido Sugerido</div>
                     <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{proximoPedido ? new Date(proximoPedido).toLocaleDateString() : '-'}</div>
                   </div>
                   <div className="card" style={{ flex: 1, minWidth: '200px', background: '#16213e', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #e94560' }}>
                     <div style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>Alerta de Pedido (Items)</div>
                     <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#e94560' }}>{totalAlerta}</div>
                   </div>
                 </div>

                 {/* Gráficos Medios */}
                 <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', height: '300px', marginBottom: '20px' }}>
                    <div style={{ flex: 1, minWidth: '300px', background: '#16213e', padding: '15px', borderRadius: '10px' }}><Bar data={machineVsWholesaleData} options={{ ...commonOptions, maintainAspectRatio: false }} /></div>
                    <div style={{ flex: 1, minWidth: '300px', background: '#16213e', padding: '15px', borderRadius: '10px' }}><Line data={complianceData} options={{ ...commonOptions, maintainAspectRatio: false }} /></div>
                 </div>
               </div>
             )}

             {/* VISTA PRODUCTOS */}
             {comexView === 'PRODUCTOS' && <ProductosManager />}

            {/* VISTAS DE TABLAS */}
            {(comexView === 'INVENTARIO' || comexView === 'PROVEEDORES' || (comexView === 'PROYECCIONES' && selectedSupplier)) && (
            <div style={{ background: '#16213e', padding: '20px', borderRadius: '10px', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ marginBottom: '0', color: '#e0e0e0' }}>
                  {comexView === 'INVENTARIO' && 'Registros de Inventario'}
                  {comexView === 'PRODUCTOS' && 'Maestro de Productos'}
                  {comexView === 'PROYECCIONES' && `Proyecciones: ${proveedores.find(p => p.id === selectedSupplier)?.nombre || 'Proveedor'}`}
                  {comexView === 'PROVEEDORES' && 'Directorio de Proveedores'}
                </h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                {comexView === 'PROYECCIONES' && (
                  <button onClick={() => setSelectedSupplier(null)} className="btn" style={{ backgroundColor: '#2a2a40', border: '1px solid #a0a0a0' }}>
                    ⬅ Volver a Proveedores
                  </button>
                )}
                <button 
                  onClick={() => setShowModal(true)} 
                  className="btn" 
                  style={{ backgroundColor: '#e94560', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0, display: comexView === 'PROYECCIONES' ? 'none' : 'block' }}
                >
                  ＋ {comexView === 'PROVEEDORES' ? 'Agregar Proveedor' : 'Nuevo Pedimento'}
                </button>
                </div>
              </div>
              
              {comexView === 'INVENTARIO' || comexView === 'PROYECCIONES' ? (
                <InventarioTable 
                  data={comexView === 'PROYECCIONES' ? data.filter(d => d.proveedorId === selectedSupplier) : data} 
                  isLoading={loading} 
                  onUpdate={handleUpdate} 
                  view={comexView} 
                />
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e0e0e0', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #2a2a40', textAlign: 'left', backgroundColor: '#0f3460' }}>
                      <th style={{ padding: '10px', color: '#a0a0a0', textTransform: 'uppercase', fontSize: '0.75rem' }}>Nombre</th>
                      <th style={{ padding: '10px', color: '#a0a0a0', textTransform: 'uppercase', fontSize: '0.75rem' }}>Nombre Ejecutivo</th>
                      <th style={{ padding: '10px', color: '#a0a0a0', textTransform: 'uppercase', fontSize: '0.75rem' }}>Email</th>
                      <th style={{ padding: '10px', color: '#a0a0a0', textTransform: 'uppercase', fontSize: '0.75rem' }}>Teléfono</th>
                      <th style={{ padding: '10px', color: '#a0a0a0', textTransform: 'uppercase', fontSize: '0.75rem' }}>Dirección</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedores.map((prov: any, index) => (
                      <tr key={prov.id} style={{ borderBottom: '1px solid #2a2a40', backgroundColor: index % 2 === 0 ? 'rgba(22, 33, 62, 0.5)' : 'rgba(26, 26, 46, 0.5)' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{prov.nombre}</td>
                        <td style={{ padding: '8px 10px', fontSize: '0.85rem' }}>{prov.contacto || '-'}</td>
                        <td style={{ padding: '8px 10px', fontSize: '0.85rem' }}>{prov.email || '-'}</td>
                        <td style={{ padding: '8px 10px', fontSize: '0.85rem' }}>{prov.telefono || '-'}</td>
                        <td style={{ padding: '8px 10px', fontSize: '0.85rem' }}>{prov.direccion || '-'}</td>
                      </tr>
                    ))}
                    {proveedores.length === 0 && <tr><td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: '#a0a0a0' }}>No hay proveedores registrados.</td></tr>}
                  </tbody>
                </table>
                </div>
              )}
            </div>
            )}

            {/* SELECCIÓN DE PROVEEDOR PARA PROYECCIONES */}
            {comexView === 'PROYECCIONES' && !selectedSupplier && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {proveedores.map(prov => (
                  <div 
                    key={prov.id} 
                    onClick={() => setSelectedSupplier(prov.id)}
                    className="card"
                    style={{ cursor: 'pointer', transition: 'transform 0.2s', borderLeft: '5px solid #4cc9f0' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <h3 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '10px' }}>{prov.nombre}</h3>
                    <p style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>{prov.contacto || 'Sin contacto'}</p>
                    <div style={{ marginTop: '15px', color: '#4cc9f0', fontSize: '0.8rem', fontWeight: 'bold' }}>Ver Proyecciones ➔</div>
                  </div>
                ))}
                {proveedores.length === 0 && <div style={{ color: '#a0a0a0' }}>No hay proveedores registrados.</div>}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px', color: '#a0a0a0' }}>
            <h2>🚧 En construcción</h2>
            <p>El módulo {activeModule} estará disponible pronto.</p>
          </div>
        )}
      </main>

      {/* Modal de Creación */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#16213e', padding: '30px', borderRadius: '8px', width: '400px', border: '1px solid #0f3460', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <h3 style={{ color: '#4cc9f0', marginBottom: '20px', marginTop: 0, borderBottom: '1px solid #2a2a40', paddingBottom: '10px' }}>
              {comexView === 'PROVEEDORES' ? 'Nuevo Proveedor' : 'Nuevo Pedimento'}
            </h3>
            
            {comexView !== 'PROVEEDORES' ? (
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', color: '#a0a0a0', marginBottom: '5px', fontSize: '0.9rem' }}>Clave Art:</label>
                <input 
                  type="text" 
                  value={newItem.cveArt} 
                  onChange={e => setNewItem({...newItem, cveArt: e.target.value})}
                  style={{ width: '100%', padding: '10px', background: '#1a1a2e', border: '1px solid #0f3460', color: 'white', borderRadius: '4px' }} 
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', color: '#a0a0a0', marginBottom: '5px', fontSize: '0.9rem' }}>Artículo:</label>
                <input 
                  type="text" 
                  value={newItem.articulo} 
                  onChange={e => setNewItem({...newItem, articulo: e.target.value})}
                  style={{ width: '100%', padding: '10px', background: '#1a1a2e', border: '1px solid #0f3460', color: 'white', borderRadius: '4px' }} 
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', color: '#a0a0a0', marginBottom: '5px', fontSize: '0.9rem' }}>Proveedor:</label>
                <select 
                  value={newItem.proveedorId}
                  onChange={e => setNewItem({...newItem, proveedorId: e.target.value})}
                  style={{ width: '100%', padding: '10px', background: '#1a1a2e', border: '1px solid #0f3460', color: 'white', borderRadius: '4px' }}
                >
                  <option value="">-- Seleccionar --</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              
              {/* Sección de Stock y Proyección */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', color: '#a0a0a0', marginBottom: '5px', fontSize: '0.8rem' }}>Stock Actual:</label>
                  <input 
                    type="number" 
                    value={newItem.stockActual} 
                    onChange={e => setNewItem({...newItem, stockActual: parseFloat(e.target.value)})}
                    style={{ width: '100%', padding: '8px', background: '#1a1a2e', border: '1px solid #0f3460', color: 'white', borderRadius: '4px' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#a0a0a0', marginBottom: '5px', fontSize: '0.8rem' }}>En Tránsito:</label>
                  <input 
                    type="number" 
                    value={newItem.unidadesTransito} 
                    onChange={e => setNewItem({...newItem, unidadesTransito: parseFloat(e.target.value)})}
                    style={{ width: '100%', padding: '8px', background: '#1a1a2e', border: '1px solid #0f3460', color: 'white', borderRadius: '4px' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#a0a0a0', marginBottom: '5px', fontSize: '0.8rem' }}>Consumo Prom:</label>
                  <input 
                    type="number" 
                    value={newItem.consumoPromedio} 
                    onChange={e => setNewItem({...newItem, consumoPromedio: parseFloat(e.target.value)})}
                    style={{ width: '100%', padding: '8px', background: '#1a1a2e', border: '1px solid #0f3460', color: 'white', borderRadius: '4px' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#a0a0a0', marginBottom: '5px', fontSize: '0.8rem' }}>Lead Time (días):</label>
                  <input 
                    type="number" 
                    value={newItem.leadTime} 
                    onChange={e => setNewItem({...newItem, leadTime: parseFloat(e.target.value)})}
                    style={{ width: '100%', padding: '8px', background: '#1a1a2e', border: '1px solid #0f3460', color: 'white', borderRadius: '4px' }} 
                  />
                </div>
              </div>

              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: proyeccion.esUrgente ? 'rgba(233, 69, 96, 0.2)' : 'rgba(76, 201, 240, 0.1)', borderRadius: '4px', border: proyeccion.esUrgente ? '1px solid #e94560' : '1px solid #0f3460' }}>
                <div style={{ fontSize: '0.85rem', color: '#a0a0a0' }}>Autonomía: <strong style={{ color: 'white' }}>{proyeccion.autonomiaMeses.toFixed(1)} meses</strong></div>
                <div style={{ fontSize: '0.85rem', color: '#a0a0a0' }}>Sugerencia Pedido: <strong style={{ color: proyeccion.esUrgente ? '#e94560' : '#4cc9f0' }}>{proyeccion.fechaSugerida.toLocaleDateString()}</strong></div>
                {proyeccion.esUrgente && <div style={{ color: '#e94560', fontWeight: 'bold', fontSize: '0.8rem', marginTop: '5px' }}>⚠️ REABASTECER URGENTE</div>}
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', color: '#a0a0a0', marginBottom: '5px', fontSize: '0.9rem' }}>Vencimiento Stock:</label>
                <input 
                  type="date" 
                  value={newItem.fechaVencimiento} 
                  onChange={e => setNewItem({...newItem, fechaVencimiento: e.target.value})}
                  style={{ width: '100%', padding: '10px', background: '#1a1a2e', border: '1px solid #0f3460', color: 'white', borderRadius: '4px' }} 
                />
              </div>
              {/* Fin Sección Stock */}

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', color: '#a0a0a0', marginBottom: '5px', fontSize: '0.9rem' }}>ETA (Fecha Llegada):</label>
                <input 
                  type="date" 
                  value={newItem.eta} 
                  onChange={e => setNewItem({...newItem, eta: e.target.value})}
                  style={{ width: '100%', padding: '10px', background: '#1a1a2e', border: '1px solid #0f3460', color: 'white', borderRadius: '4px' }} 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #a0a0a0', color: '#a0a0a0', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '10px 20px', background: '#e94560', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar</button>
              </div>
            </form>
            ) : (
              <form onSubmit={handleCreateProveedor}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', color: '#a0a0a0', marginBottom: '5px', fontSize: '0.9rem' }}>Nombre Empresa:</label>
                  <input 
                    type="text" required
                    value={newProveedor.nombre} 
                    onChange={e => setNewProveedor({...newProveedor, nombre: e.target.value})}
                    style={{ width: '100%', padding: '10px', background: '#1a1a2e', border: '1px solid #0f3460', color: 'white', borderRadius: '4px' }} 
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', color: '#a0a0a0', marginBottom: '5px', fontSize: '0.9rem' }}>Nombre Ejecutivo:</label>
                  <input 
                    type="text" 
                    value={newProveedor.contacto} 
                    onChange={e => setNewProveedor({...newProveedor, contacto: e.target.value})}
                    style={{ width: '100%', padding: '10px', background: '#1a1a2e', border: '1px solid #0f3460', color: 'white', borderRadius: '4px' }} 
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', color: '#a0a0a0', marginBottom: '5px', fontSize: '0.9rem' }}>Email:</label>
                  <input 
                    type="email" 
                    value={newProveedor.email} 
                    onChange={e => setNewProveedor({...newProveedor, email: e.target.value})}
                    style={{ width: '100%', padding: '10px', background: '#1a1a2e', border: '1px solid #0f3460', color: 'white', borderRadius: '4px' }} 
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', color: '#a0a0a0', marginBottom: '5px', fontSize: '0.9rem' }}>Dirección:</label>
                  <input 
                    type="text" 
                    value={newProveedor.direccion} 
                    onChange={e => setNewProveedor({...newProveedor, direccion: e.target.value})}
                    style={{ width: '100%', padding: '10px', background: '#1a1a2e', border: '1px solid #0f3460', color: 'white', borderRadius: '4px' }} 
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #a0a0a0', color: '#a0a0a0', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                  <button type="submit" style={{ padding: '10px 20px', background: '#e94560', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar Proveedor</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;