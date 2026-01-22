import { useState, useEffect, useMemo } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// 1. Configuración de Gráficos
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// 2. Interfaz de tus Datos Reales
interface Producto {
  id?: number; 
  sku: string;
  nombre: string;
  precioFOB: number;
  gramaje: string;
  paisOrigen: string;
  cantidadPorCaja: number;
}

function App() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PRODUCTOS'>('DASHBOARD');

  // Estados para el Modal y Formulario
  const [showModal, setShowModal] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState<Producto>({
    sku: '',
    nombre: '',
    precioFOB: 0,
    gramaje: '',
    paisOrigen: '',
    cantidadPorCaja: 0
  });

  // 3. Conexión al Cerebro (Backend)
  const fetchProductos = () => {
    setLoading(true);
    fetch('http://localhost:3000/api/productos')
      .then((res) => {
        if (!res.ok) throw new Error('Error al conectar');
        return res.json();
      })
      .then((data) => {
        setProductos(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('No se pudo conectar con el servidor (Puerto 3000)');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  // Función para manejar la creación
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoProducto)
      });

      if (!res.ok) throw new Error('Error al crear producto');

      fetchProductos();
      setShowModal(false);
      setNuevoProducto({
        sku: '',
        nombre: '',
        precioFOB: 0,
        gramaje: '',
        paisOrigen: '',
        cantidadPorCaja: 0
      });
      alert('✅ Producto creado exitosamente');
    } catch (err) {
      console.error(err);
      alert('❌ Error al guardar el producto');
    }
  };

  // Función para manejar la eliminación
  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

    try {
      const res = await fetch(`http://localhost:3000/api/productos/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar producto');

      fetchProductos(); 
    } catch (err) {
      console.error(err);
      alert('❌ Error al eliminar el producto');
    }
  };

  // 4. Lógica de Negocio
  const kpiTotalProductos = productos.length;
  
  const kpiPrecioPromedio = productos.length > 0 
    ? (productos.reduce((acc, p) => acc + Number(p.precioFOB), 0) / productos.length).toFixed(2) 
    : "0.00";

  const datosPorPais = useMemo(() => {
    const conteo: Record<string, number> = {};
    productos.forEach(p => {
      const pais = p.paisOrigen || 'Otros';
      conteo[pais] = (conteo[pais] || 0) + 1;
    });
    return conteo;
  }, [productos]);

  const chartData = {
    labels: Object.keys(datosPorPais),
    datasets: [{
      label: 'Cantidad de Productos',
      data: Object.values(datosPorPais),
      backgroundColor: ['#4cc9f0', '#e94560', '#f1c40f', '#2ecc71', '#9b59b6'],
      borderColor: '#1a1a2e',
      borderWidth: 2
    }]
  };

  const commonOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#a0a0a0' } },
      title: { display: true, text: 'Origen de Importaciones', color: '#fff' }
    },
    scales: {
      y: { ticks: { color: '#a0a0a0' }, grid: { color: '#2a2a40' } },
      x: { ticks: { color: '#a0a0a0' }, grid: { color: '#2a2a40' } }
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    background: '#1a1a2e',
    border: '1px solid #2a2a40',
    borderRadius: '8px',
    color: 'white',
    fontSize: '1rem'
  };

  // 5. El Diseño Visual
  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#1a1a2e', color: 'white', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '240px', backgroundColor: '#16213e', padding: '20px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #0f3460' }}>
        <h2 style={{ color: '#4cc9f0', textAlign: 'center', marginBottom: '40px', letterSpacing: '2px', borderBottom: '2px solid #4cc9f0', paddingBottom: '10px' }}>
          CHIP ERP
        </h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button 
            onClick={() => setActiveTab('DASHBOARD')}
            style={{ 
              padding: '15px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '1rem', transition: 'all 0.2s',
              background: activeTab === 'DASHBOARD' ? 'linear-gradient(90deg, rgba(76, 201, 240, 0.2) 0%, rgba(0,0,0,0) 100%)' : 'transparent',
              color: activeTab === 'DASHBOARD' ? '#4cc9f0' : '#a0a0a0',
              fontWeight: activeTab === 'DASHBOARD' ? 'bold' : 'normal',
              borderLeft: activeTab === 'DASHBOARD' ? '4px solid #4cc9f0' : '4px solid transparent'
            }}>
            📊 Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('PRODUCTOS')}
            style={{ 
              padding: '15px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '1rem', transition: 'all 0.2s',
              background: activeTab === 'PRODUCTOS' ? 'linear-gradient(90deg, rgba(76, 201, 240, 0.2) 0%, rgba(0,0,0,0) 100%)' : 'transparent',
              color: activeTab === 'PRODUCTOS' ? '#4cc9f0' : '#a0a0a0',
              fontWeight: activeTab === 'PRODUCTOS' ? 'bold' : 'normal',
              borderLeft: activeTab === 'PRODUCTOS' ? '4px solid #4cc9f0' : '4px solid transparent'
            }}>
            📦 Inventario
          </button>
        </nav>

        <div style={{ marginTop: 'auto', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
          Conexión Segura v1.0 <br/>
          {error ? '🔴 Offline' : '🟢 Online'}
        </div>
      </aside>

      {/* ZONA PRINCIPAL */}
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem' }}>Resumen Ejecutivo</h1>
            <p style={{ color: '#a0a0a0', margin: '5px 0 0 0' }}>Vista general del inventario activo</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#16213e', padding: '10px 20px', borderRadius: '50px' }}>
             <span style={{ fontSize: '1.2rem' }}>👤</span>
             <span style={{ fontWeight: 'bold' }}>Admin</span>
          </div>
        </header>

        {loading && <div style={{ color: '#4cc9f0', fontSize: '1.2rem' }}>⏳ Cargando datos en tiempo real...</div>}
        
        {error && (
          <div style={{ padding: '20px', background: 'rgba(233, 69, 96, 0.1)', border: '1px solid #e94560', borderRadius: '8px', color: '#e94560' }}>
            ⚠️ <strong>Error Crítico:</strong> {error} <br/>
            <small>Verifica que la terminal "BACKEND" esté corriendo.</small>
          </div>
        )}

        {/* VISTA DASHBOARD */}
        {!loading && !error && activeTab === 'DASHBOARD' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: '#16213e', padding: '25px', borderRadius: '15px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ color: '#a0a0a0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total SKUs</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginTop: '10px' }}>{kpiTotalProductos}</div>
                <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '6rem', opacity: '0.05' }}>📦</div>
              </div>
              <div style={{ background: '#16213e', padding: '25px', borderRadius: '15px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ color: '#a0a0a0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Precio Promedio (FOB)</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2ecc71', marginTop: '10px' }}>${kpiPrecioPromedio}</div>
                <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '6rem', opacity: '0.05' }}>💲</div>
              </div>
              <div style={{ background: '#16213e', padding: '25px', borderRadius: '15px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ color: '#a0a0a0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Países de Origen</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f1c40f', marginTop: '10px' }}>{Object.keys(datosPorPais).length}</div>
                <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '6rem', opacity: '0.05' }}>🌍</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
              <div style={{ background: '#16213e', padding: '25px', borderRadius: '15px' }}>
                <h3 style={{ marginTop: 0, color: '#4cc9f0' }}>Distribución por Origen</h3>
                <div style={{ height: '300px' }}>
                  <Bar data={chartData} options={{ ...commonOptions, maintainAspectRatio: false }} />
                </div>
              </div>
              <div style={{ background: '#16213e', padding: '25px', borderRadius: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ marginTop: 0, color: '#e94560', alignSelf: 'flex-start' }}>Proporción de Inventario</h3>
                <div style={{ height: '250px', width: '100%', maxWidth: '300px' }}>
                  <Doughnut data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: 'white' } } } }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VISTA TABLA DE PRODUCTOS */}
        {!loading && !error && activeTab === 'PRODUCTOS' && (
          <div style={{ background: '#16213e', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#4cc9f0' }}>Listado Maestro</h3>
              <button 
                onClick={() => setShowModal(true)}
                style={{ background: '#e94560', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'transform 0.2s' }}
              >
                + Nuevo Producto
              </button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: '#0f3460', color: '#a0a0a0', textAlign: 'left' }}>
                    <th style={{ padding: '15px', borderRadius: '8px 0 0 8px' }}>SKU</th>
                    <th style={{ padding: '15px' }}>Producto</th>
                    <th style={{ padding: '15px' }}>Origen</th>
                    <th style={{ padding: '15px' }}>Gramaje</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>Caja (u)</th>
                    <th style={{ padding: '15px', textAlign: 'right' }}>Precio FOB</th>
                    <th style={{ padding: '15px', textAlign: 'center', borderRadius: '0 8px 8px 0' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((prod, i) => (
                    <tr key={prod.id} style={{ borderBottom: '1px solid #2a2a40', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '15px', color: '#4cc9f0', fontFamily: 'monospace', fontWeight: 'bold' }}>{prod.sku}</td>
                      <td style={{ padding: '15px', fontWeight: '500', fontSize: '1.05rem' }}>{prod.nombre}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '0.85rem' }}>
                          {prod.paisOrigen}
                        </span>
                      </td>
                      <td style={{ padding: '15px', color: '#888' }}>{prod.gramaje}</td>
                      <td style={{ padding: '15px', textAlign: 'center', color: '#a0a0a0' }}>{prod.cantidadPorCaja}</td>
                      <td style={{ padding: '15px', textAlign: 'right', color: '#2ecc71', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        ${Number(prod.precioFOB).toFixed(2)}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <button 
                          onClick={() => prod.id && handleDelete(prod.id)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', filter: 'grayscale(100%)', transition: 'filter 0.2s' }}
                          title="Eliminar producto"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {productos.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                La base de datos está vacía.
              </div>
            )}
          </div>
        )}

        {/* MODAL CREAR PRODUCTO */}
        {showModal && (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 
          }}>
            <div style={{ 
              background: '#16213e', padding: '30px', borderRadius: '15px', 
              width: '500px', border: '1px solid #4cc9f0', 
              boxShadow: '0 0 30px rgba(76, 201, 240, 0.2)' 
            }}>
              <h2 style={{ color: '#4cc9f0', marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #2a2a40', paddingBottom: '10px' }}>
                📦 Nuevo Producto
              </h2>
              
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>SKU</label>
                    <input 
                      placeholder="Ej: PROD-001" 
                      value={nuevoProducto.sku} 
                      onChange={e => setNuevoProducto({...nuevoProducto, sku: e.target.value})} 
                      style={inputStyle} 
                      required 
                    />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Nombre del Producto</label>
                    <input 
                      placeholder="Ej: Galletas de Chocolate" 
                      value={nuevoProducto.nombre} 
                      onChange={e => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} 
                      style={inputStyle} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                   <div style={{ flex: 1 }}>
                    <label style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Precio FOB ($)</label>
                    <input 
                      type="number" step="0.01" placeholder="0.00" 
                      value={nuevoProducto.precioFOB} 
                      onChange={e => setNuevoProducto({...nuevoProducto, precioFOB: Number(e.target.value)})} 
                      style={inputStyle} 
                      required 
                    />
                   </div>
                   <div style={{ flex: 1 }}>
                    <label style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Gramaje</label>
                    <input 
                      placeholder="Ej: 500g" 
                      value={nuevoProducto.gramaje} 
                      onChange={e => setNuevoProducto({...nuevoProducto, gramaje: e.target.value})} 
                      style={inputStyle} 
                    />
                   </div>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                   <div style={{ flex: 1 }}>
                    <label style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>País de Origen</label>
                    <input 
                      placeholder="Ej: China" 
                      value={nuevoProducto.paisOrigen} 
                      onChange={e => setNuevoProducto({...nuevoProducto, paisOrigen: e.target.value})} 
                      style={inputStyle} 
                    />
                   </div>
                   <div style={{ flex: 1 }}>
                    <label style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Unidades por Caja</label>
                    <input 
                      type="number" placeholder="0" 
                      value={nuevoProducto.cantidadPorCaja} 
                      onChange={e => setNuevoProducto({...nuevoProducto, cantidadPorCaja: Number(e.target.value)})} 
                      style={inputStyle} 
                    />
                   </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #2a2a40', paddingTop: '20px' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    style={{ background: 'transparent', border: '1px solid #a0a0a0', color: '#a0a0a0', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    style={{ background: '#e94560', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Guardar Producto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;