import React, { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { ProveedoresTab } from "./src/components/ProveedoresTab";
import { ProductosTab } from "./src/components/ProductosTab";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface ProductoDashboard {
  id?: number; 
  paisOrigen: string;
  precioFOB: number;
}

function App() {
  const [productosData, setProductosData] = useState<ProductoDashboard[]>([]);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PRODUCTOS' | 'PROVEEDORES'>('DASHBOARD');
  const [showComexMenu, setShowComexMenu] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3000/api/productos')
      .then(res => res.json())
      .then(data => setProductosData(data))
      .catch(err => console.error("Error cargando datos dashboard", err));
    
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
  }, [activeTab]);

  const kpiTotalProductos = productosData.length;
  const kpiPrecioPromedio = productosData.length > 0 
    ? (productosData.reduce((acc, p) => acc + Number(p.precioFOB), 0) / productosData.length).toFixed(2) 
    : "0.00";

  const datosPorPais = useMemo(() => {
    const conteo: Record<string, number> = {};
    productosData.forEach(p => {
      const pais = p.paisOrigen || 'Otros';
      conteo[pais] = (conteo[pais] || 0) + 1;
    });
    return conteo;
  }, [productosData]);

  const chartData = {
    labels: Object.keys(datosPorPais),
    datasets: [{
      label: 'Cantidad',
      data: Object.values(datosPorPais),
      backgroundColor: ['#4cc9f0', '#e94560', '#f1c40f', '#2ecc71', '#9b59b6'],
      borderColor: '#1a1a2e', borderWidth: 2
    }]
  };

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'DASHBOARD': return { title: 'Resumen Ejecutivo', subtitle: 'Vista general del inventario activo' };
      case 'PRODUCTOS': return { title: 'Productos', subtitle: 'Gestión del catálogo maestro' };
      case 'PROVEEDORES': return { title: 'Directorio de Proveedores', subtitle: 'Base de datos de socios comerciales' };
      default: return { title: 'Chip ERP', subtitle: 'Sistema de Gestión' };
    }
  };
  const { title, subtitle } = getHeaderInfo();

  return (
    <div style={{ display: 'flex', height: '125vh', width: '125vw', backgroundColor: '#1a1a2e', color: 'white', fontFamily: 'Segoe UI, sans-serif', transform: 'scale(0.8)', transformOrigin: 'top left', overflow: 'hidden' }}>
      
      <aside style={{ width: '240px', backgroundColor: '#16213e', padding: '20px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #0f3460', zIndex: 100 }}>
        <h2 style={{ color: '#4cc9f0', textAlign: 'center', marginBottom: '40px', letterSpacing: '2px', borderBottom: '2px solid #4cc9f0', paddingBottom: '10px' }}>CHIP ERP</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div onMouseEnter={() => setShowComexMenu(true)} onMouseLeave={() => setShowComexMenu(false)} style={{ position: 'relative' }}>
            <div style={{ padding: '15px', borderRadius: '8px', cursor: 'pointer', color: showComexMenu ? '#4cc9f0' : '#a0a0a0', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: showComexMenu ? 'rgba(76, 201, 240, 0.1)' : 'transparent', transition: 'all 0.2s' }}>
              <span>🚢 Comex</span><span style={{ fontSize: '0.8rem' }}>▶</span>
            </div>
            <div style={{ position: 'absolute', left: '100%', top: 0, marginLeft: '10px', width: '180px', background: '#16213e', border: '1px solid #4cc9f0', borderRadius: '8px', padding: '5px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', zIndex: 1000, opacity: showComexMenu ? 1 : 0, visibility: showComexMenu ? 'visible' : 'hidden', transform: showComexMenu ? 'translateX(0)' : 'translateX(-10px)', transition: 'all 0.3s' }}>
              <button onClick={() => setActiveTab('DASHBOARD')} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', textAlign: 'left', background: activeTab === 'DASHBOARD' ? 'rgba(76, 201, 240, 0.2)' : 'transparent', color: activeTab === 'DASHBOARD' ? '#4cc9f0' : '#a0a0a0', marginBottom: '5px' }}>📊 Dashboard</button>
              <button onClick={() => setActiveTab('PRODUCTOS')} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', textAlign: 'left', background: activeTab === 'PRODUCTOS' ? 'rgba(76, 201, 240, 0.2)' : 'transparent', color: activeTab === 'PRODUCTOS' ? '#4cc9f0' : '#a0a0a0', marginBottom: '5px' }}>📦 Productos</button>
              <button onClick={() => setActiveTab('PROVEEDORES')} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', textAlign: 'left', background: activeTab === 'PROVEEDORES' ? 'rgba(76, 201, 240, 0.2)' : 'transparent', color: activeTab === 'PROVEEDORES' ? '#4cc9f0' : '#a0a0a0' }}>🤝 Proveedores</button>
            </div>
          </div>
        </nav>
      </aside>

      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div><h1 style={{ margin: 0, fontSize: '2rem' }}>{title}</h1><p style={{ color: '#a0a0a0', margin: '5px 0 0 0' }}>{subtitle}</p></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#16213e', padding: '10px 20px', borderRadius: '50px' }}><span style={{ fontSize: '1.2rem' }}>👤</span><span style={{ fontWeight: 'bold' }}>Admin</span></div>
        </header>

        {activeTab === 'DASHBOARD' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: '#16213e', padding: '25px', borderRadius: '15px' }}><div style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>TOTAL SKUS</div><div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>{kpiTotalProductos}</div></div>
              <div style={{ background: '#16213e', padding: '25px', borderRadius: '15px' }}><div style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>PRECIO PROMEDIO</div><div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2ecc71' }}>${kpiPrecioPromedio}</div></div>
              <div style={{ background: '#16213e', padding: '25px', borderRadius: '15px' }}><div style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>PAÍSES ORIGEN</div><div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f1c40f' }}>{Object.keys(datosPorPais).length}</div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
              <div style={{ background: '#16213e', padding: '25px', borderRadius: '15px', height: '350px' }}><Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>
              <div style={{ background: '#16213e', padding: '25px', borderRadius: '15px', height: '350px', display: 'flex', justifyContent: 'center' }}><div style={{ width: '80%' }}><Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: false }} /></div></div>
            </div>
          </div>
        )}

        {activeTab === 'PRODUCTOS' && <ProductosTab />}
        {activeTab === 'PROVEEDORES' && <ProveedoresTab />}

      </main>
    </div>
  );
}

export default App;