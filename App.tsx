import React, { useState, useEffect, useMemo } from 'react';
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
  proveedorId?: number;
  paisOrigen: string;
  nombre: string;
  gramaje: string;
  cantidadPorCaja: number | string;
  cantidadPorDisplay: number | string;
  precioFOB: number | string;
  moneda: string;
}

interface Proveedor {
  id: number;
  nombre: string;
  pais: string;
  ejecutivo: string;
  email: string;
  telefono: string;
}

function App() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PRODUCTOS' | 'PROVEEDORES' | 'VENTAS' | 'RESUMEN_VENTAS'>('DASHBOARD');
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  
  // Estado para el menú desplegable
  const [showComexMenu, setShowComexMenu] = useState(false);
  const [showVentasMenu, setShowVentasMenu] = useState(false);

  // Estados para el Modal y Formulario
  const [showModal, setShowModal] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState<Producto>({
    sku: '',
    proveedorId: 0,
    paisOrigen: '',
    nombre: '',
    gramaje: '',
    cantidadPorCaja: 0,
    cantidadPorDisplay: 0,
    precioFOB: '',
    moneda: 'USD'
  });

  // Estados para Proveedores
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [showModalProveedor, setShowModalProveedor] = useState(false);
  const [nuevoProveedor, setNuevoProveedor] = useState<Proveedor>({
    id: 0,
    nombre: '',
    pais: '',
    ejecutivo: '',
    email: '',
    telefono: ''
  });

  // Estados para Filtros
  const [searchTermProductos, setSearchTermProductos] = useState('');
  const [searchTermProveedores, setSearchTermProveedores] = useState('');

  // Estado para control de fecha en Ventas
  const [fechaVentas, setFechaVentas] = useState(new Date());

  // Estado para Ventas (Matriz Mensual)
  const [ventasMensuales, setVentasMensuales] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('chip_erp_ventas');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('chip_erp_ventas', JSON.stringify(ventasMensuales));
  }, [ventasMensuales]);

  // 3. Conexión al Cerebro (Backend)
  const fetchProductos = () => {
    setLoading(true);
    fetch('http://localhost:3000/api/productos', { cache: 'no-store' })
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

  const fetchProveedores = () => {
    fetch('http://localhost:3000/api/proveedores')
      .then(res => res.json())
      .then(data => setProveedores(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProductos();
    fetchProveedores();
  }, []);

  // Función para manejar la creación o edición
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const precioFOBNum = Number(nuevoProducto.precioFOB);
    const cantidadPorCajaNum = Number(nuevoProducto.cantidadPorCaja);

    // --- VALIDACIONES FRONTEND ---
    if (isNaN(precioFOBNum) || precioFOBNum <= 0) {
      alert("⚠️ El Precio FOB debe ser mayor a 0");
      return;
    }
    if (!nuevoProducto.proveedorId) {
      alert("⚠️ Debes seleccionar un Proveedor");
      return;
    }
    if (cantidadPorCajaNum <= 0 || !Number.isInteger(cantidadPorCajaNum)) {
      alert("⚠️ La Cantidad por Caja debe ser un número entero mayor a 0");
      return;
    }
    // Chequeo de duplicados (excluyendo el producto actual si se está editando)
    const skuNormalizado = nuevoProducto.sku.trim().toLowerCase();
    const productoDuplicado = productos.find(p => p.sku.trim().toLowerCase() === skuNormalizado && p.id !== nuevoProducto.id);
    
    if (productoDuplicado) {
      alert(`⚠️ El SKU "${nuevoProducto.sku}" ya está siendo usado por el producto: "${productoDuplicado.nombre}".\n\nPor favor, ingresa un código único.`);
      return;
    }
    // -----------------------------

    const productoAEnviar = {
      ...nuevoProducto,
      precioFOB: precioFOBNum
    };

    try {
      const method = nuevoProducto.id ? 'PUT' : 'POST';
      const url = nuevoProducto.id 
        ? `http://localhost:3000/api/productos/${nuevoProducto.id}` 
        : 'http://localhost:3000/api/productos';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productoAEnviar)
      });

      if (!res.ok) throw new Error('Error al guardar producto');

      fetchProductos();
      setShowModal(false);
      setNuevoProducto({
        sku: '',
        proveedorId: 0,
        paisOrigen: '',
        nombre: '',
        gramaje: '',
        cantidadPorCaja: '',
        cantidadPorDisplay: '',
        precioFOB: '',
        moneda: 'USD'
      });
      alert(nuevoProducto.id ? '✅ Producto actualizado' : '✅ Producto creado exitosamente');
    } catch (err) {
      console.error(err);
      alert('❌ Error al guardar el producto');
    }
  };

  // Función para abrir modal de edición
  const handleEdit = (producto: Producto) => {
    setNuevoProducto(producto);
    setShowModal(true);
  };

  // Función para crear proveedor
  const handleCreateProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = nuevoProveedor.id ? 'PUT' : 'POST';
      const url = nuevoProveedor.id 
        ? `http://localhost:3000/api/proveedores/${nuevoProveedor.id}`
        : 'http://localhost:3000/api/proveedores';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoProveedor)
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      fetchProveedores();
      setShowModalProveedor(false);
      setNuevoProveedor({ id: 0, nombre: '', pais: '', ejecutivo: '', email: '', telefono: '' });
      alert(nuevoProveedor.id ? '✅ Proveedor actualizado' : '✅ Proveedor agregado');
    } catch (err: any) {
      console.error(err);
      alert('❌ Error al guardar proveedor: ' + err.message);
    }
  };

  // Función para eliminar proveedor
  const handleDeleteProveedor = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este proveedor?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/proveedores/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar proveedor');
      fetchProveedores();
    } catch (err) {
      console.error(err);
      alert('❌ Error al eliminar el proveedor');
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

  // Helper para obtener nombre del proveedor
  const getNombreProveedor = (id?: number) => {
    return proveedores.find(p => p.id === id)?.nombre || '---';
  };

  // Lógica de Filtrado
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const term = searchTermProductos.toLowerCase();
      const proveedor = proveedores.find(prov => prov.id === p.proveedorId)?.nombre.toLowerCase() || '';
      return (
        p.sku.toLowerCase().includes(term) ||
        p.nombre.toLowerCase().includes(term) ||
        p.paisOrigen.toLowerCase().includes(term) ||
        proveedor.includes(term)
      );
    });
  }, [productos, searchTermProductos, proveedores]);

  const proveedoresFiltrados = useMemo(() => {
    return proveedores.filter(p => {
      const term = searchTermProveedores.toLowerCase();
      return (
        p.nombre.toLowerCase().includes(term) ||
        p.pais.toLowerCase().includes(term) ||
        p.ejecutivo.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term)
      );
    });
  }, [proveedores, searchTermProveedores]);

  // Lógica de Ventas
  const daysInMonth = useMemo(() => {
    return new Date(fechaVentas.getFullYear(), fechaVentas.getMonth() + 1, 0).getDate();
  }, [fechaVentas]);
  
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getVentaKey = (productId: number, day: number) => {
    return `${productId}-${day}-${fechaVentas.getMonth()}-${fechaVentas.getFullYear()}`;
  };

  const cambiarMes = (delta: number) => {
    setFechaVentas(prev => {
      const nuevaFecha = new Date(prev);
      nuevaFecha.setMonth(prev.getMonth() + delta);
      return nuevaFecha;
    });
  };

  const handleVentaChange = (productId: number, day: number, value: string) => {
    const key = getVentaKey(productId, day);
    setVentasMensuales(prev => {
      const newState = { ...prev };
      if (value === '') delete newState[key];
      else newState[key] = Number(value);
      return newState;
    });
  };

  // Títulos dinámicos según la pestaña activa
  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'DASHBOARD': return { title: 'Resumen Ejecutivo', subtitle: 'Vista general del inventario activo' };
      case 'PRODUCTOS': return { title: 'Productos', subtitle: 'Gestión del catálogo maestro' };
      case 'PROVEEDORES': return { title: 'Directorio de Proveedores', subtitle: 'Base de datos de socios comerciales' };
      case 'VENTAS': return { title: 'Detalle de Ventas', subtitle: 'Registro diario de unidades vendidas' };
      case 'RESUMEN_VENTAS': return { title: 'Resumen de Ventas', subtitle: 'Análisis de desempeño comercial' };
      default: return { title: 'Chip ERP', subtitle: 'Sistema de Gestión' };
    }
  };
  const { title, subtitle } = getHeaderInfo();

  // 5. El Diseño Visual
  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#1a1a2e', color: 'white', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ 
        width: '240px', 
        backgroundColor: '#16213e', 
        padding: '20px', 
        display: 'flex', 
        flexDirection: 'column', 
        borderRight: '1px solid #0f3460',
        zIndex: 100 
      }}>
        <h2 style={{ color: '#4cc9f0', textAlign: 'center', marginBottom: '40px', letterSpacing: '2px', borderBottom: '2px solid #4cc9f0', paddingBottom: '10px' }}>
          CHIP ERP
        </h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Menú Desplegable COMEX */}
          <div 
            onMouseEnter={() => setShowComexMenu(true)}
            onMouseLeave={() => setShowComexMenu(false)}
            style={{ position: 'relative' }}
          >
            {/* Botón Principal */}
            <div style={{ 
              padding: '15px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              color: showComexMenu ? '#4cc9f0' : '#a0a0a0',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: showComexMenu ? 'rgba(76, 201, 240, 0.1)' : 'transparent',
              transition: 'all 0.2s'
            }}>
              <span>🚢 Comex</span>
              <span style={{ fontSize: '0.8rem' }}>▶</span>
            </div>

            {/* Submenú Flotante */}
            <div style={{ 
              position: 'absolute',
              left: '100%', 
              top: 0,
              marginLeft: '10px', 
              width: '180px',
              background: '#16213e',
              border: '1px solid #4cc9f0',
              borderRadius: '8px',
              padding: '5px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              zIndex: 1000,
              opacity: showComexMenu ? 1 : 0,
              visibility: showComexMenu ? 'visible' : 'hidden',
              transform: showComexMenu ? 'translateX(0)' : 'translateX(-10px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <button 
                onClick={() => setActiveTab('DASHBOARD')}
                onMouseEnter={() => setHoveredTab('DASHBOARD')}
                onMouseLeave={() => setHoveredTab(null)}
                style={{ 
                  width: '100%',
                  padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', transition: 'all 0.2s',
                  background: activeTab === 'DASHBOARD' ? 'rgba(76, 201, 240, 0.2)' : (hoveredTab === 'DASHBOARD' ? 'rgba(76, 201, 240, 0.1)' : 'transparent'),
                  color: activeTab === 'DASHBOARD' ? '#4cc9f0' : (hoveredTab === 'DASHBOARD' ? 'white' : '#a0a0a0'),
                  fontWeight: activeTab === 'DASHBOARD' ? 'bold' : 'normal',
                  marginBottom: '5px'
                }}>
                📊 Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('PRODUCTOS')}
                onMouseEnter={() => setHoveredTab('PRODUCTOS')}
                onMouseLeave={() => setHoveredTab(null)}
                style={{ 
                  width: '100%',
                  padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', transition: 'all 0.2s',
                  background: activeTab === 'PRODUCTOS' ? 'rgba(76, 201, 240, 0.2)' : (hoveredTab === 'PRODUCTOS' ? 'rgba(76, 201, 240, 0.1)' : 'transparent'),
                  color: activeTab === 'PRODUCTOS' ? '#4cc9f0' : (hoveredTab === 'PRODUCTOS' ? 'white' : '#a0a0a0'),
                  fontWeight: activeTab === 'PRODUCTOS' ? 'bold' : 'normal',
                  marginBottom: '5px'
                }}>
                📦 Productos
              </button>
              <button 
                onClick={() => setActiveTab('PROVEEDORES')}
                onMouseEnter={() => setHoveredTab('PROVEEDORES')}
                onMouseLeave={() => setHoveredTab(null)}
                style={{ 
                  width: '100%',
                  padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', transition: 'all 0.2s',
                  background: activeTab === 'PROVEEDORES' ? 'rgba(76, 201, 240, 0.2)' : (hoveredTab === 'PROVEEDORES' ? 'rgba(76, 201, 240, 0.1)' : 'transparent'),
                  color: activeTab === 'PROVEEDORES' ? '#4cc9f0' : (hoveredTab === 'PROVEEDORES' ? 'white' : '#a0a0a0'),
                  fontWeight: activeTab === 'PROVEEDORES' ? 'bold' : 'normal',
                }}>
                🤝 Proveedores
              </button>
            </div>
          </div>

          {/* Menú Almacen (Futuro) */}
          <div style={{ 
            padding: '15px', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            color: '#a0a0a0',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.2s'
          }}>
            <span>🏭 Almacen</span>
          </div>

          {/* Menú Desplegable VENTAS */}
          <div 
            onMouseEnter={() => setShowVentasMenu(true)}
            onMouseLeave={() => setShowVentasMenu(false)}
            style={{ position: 'relative' }}
          >
            {/* Botón Principal */}
            <div style={{ 
              padding: '15px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              color: showVentasMenu ? '#4cc9f0' : '#a0a0a0',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: showVentasMenu ? 'rgba(76, 201, 240, 0.1)' : 'transparent',
              transition: 'all 0.2s'
            }}>
              <span>💰 Ventas</span>
              <span style={{ fontSize: '0.8rem' }}>▶</span>
            </div>

            {/* Submenú Flotante */}
            <div style={{ 
              position: 'absolute',
              left: '100%', 
              top: 0,
              marginLeft: '10px', 
              width: '180px',
              background: '#16213e',
              border: '1px solid #4cc9f0',
              borderRadius: '8px',
              padding: '5px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              zIndex: 1000,
              opacity: showVentasMenu ? 1 : 0,
              visibility: showVentasMenu ? 'visible' : 'hidden',
              transform: showVentasMenu ? 'translateX(0)' : 'translateX(-10px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <button 
                onClick={() => setActiveTab('VENTAS')}
                onMouseEnter={() => setHoveredTab('VENTAS')}
                onMouseLeave={() => setHoveredTab(null)}
                style={{ 
                  width: '100%',
                  padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', transition: 'all 0.2s',
                  background: activeTab === 'VENTAS' ? 'rgba(76, 201, 240, 0.2)' : (hoveredTab === 'VENTAS' ? 'rgba(76, 201, 240, 0.1)' : 'transparent'),
                  color: activeTab === 'VENTAS' ? '#4cc9f0' : (hoveredTab === 'VENTAS' ? 'white' : '#a0a0a0'),
                  fontWeight: activeTab === 'VENTAS' ? 'bold' : 'normal',
                  marginBottom: '5px'
                }}>
                📝 Detalle de ventas
              </button>
              <button 
                onClick={() => setActiveTab('RESUMEN_VENTAS')}
                onMouseEnter={() => setHoveredTab('RESUMEN_VENTAS')}
                onMouseLeave={() => setHoveredTab(null)}
                style={{ 
                  width: '100%',
                  padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', transition: 'all 0.2s',
                  background: activeTab === 'RESUMEN_VENTAS' ? 'rgba(76, 201, 240, 0.2)' : (hoveredTab === 'RESUMEN_VENTAS' ? 'rgba(76, 201, 240, 0.1)' : 'transparent'),
                  color: activeTab === 'RESUMEN_VENTAS' ? '#4cc9f0' : (hoveredTab === 'RESUMEN_VENTAS' ? 'white' : '#a0a0a0'),
                  fontWeight: activeTab === 'RESUMEN_VENTAS' ? 'bold' : 'normal',
                }}>
                📊 Resumen de ventas
              </button>
            </div>
          </div>

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
            <h1 style={{ margin: 0, fontSize: '2rem' }}>{title}</h1>
            <p style={{ color: '#a0a0a0', margin: '5px 0 0 0' }}>{subtitle}</p>
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
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  placeholder="🔍 Buscar SKU, Nombre, Origen..." 
                  value={searchTermProductos}
                  onChange={e => setSearchTermProductos(e.target.value)}
                  style={{ ...inputStyle, width: '250px', padding: '8px', fontSize: '0.9rem' }} 
                />
                <button 
                  onClick={fetchProductos}
                  style={{ background: '#16213e', color: '#4cc9f0', border: '1px solid #4cc9f0', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
                  title="Actualizar lista"
                >
                  🔄
                </button>
              <button 
                onClick={() => {
                  setNuevoProducto({
                    sku: '',
                    proveedorId: 0,
                    paisOrigen: '',
                    nombre: '',
                    gramaje: '',
                    cantidadPorCaja: 0,
                    cantidadPorDisplay: 0,
                    precioFOB: 0,
                    moneda: 'USD'
                  });
                  setShowModal(true);
                }}
                style={{ background: '#e94560', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'transform 0.2s' }}
              >
                + Nuevo Producto
              </button>
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: '#0f3460', color: '#a0a0a0', textAlign: 'left' }}>
                    <th style={{ padding: '15px', borderRadius: '8px 0 0 8px' }}>Código</th>
                    <th style={{ padding: '15px' }}>Proveedor</th>
                    <th style={{ padding: '15px' }}>Origen</th>
                    <th style={{ padding: '15px' }}>Artículo</th>
                    <th style={{ padding: '15px' }}>Peso/Vol</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>Und x Caja</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>Unid x Display</th>
                    <th style={{ padding: '15px', textAlign: 'right' }}>Valor FOB Caja</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>Moneda</th>
                    <th style={{ padding: '15px', textAlign: 'center', borderRadius: '0 8px 8px 0' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((prod, i) => (
                    <tr key={prod.id} style={{ borderBottom: '1px solid #2a2a40', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '15px' }}>{prod.sku}</td>
                      <td style={{ padding: '15px' }}>{getNombreProveedor(prod.proveedorId)}</td>
                      <td style={{ padding: '15px' }}>
                        {prod.paisOrigen}
                      </td>
                      <td style={{ padding: '15px' }}>{prod.nombre}</td>
                      <td style={{ padding: '15px' }}>{prod.gramaje}</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>{prod.cantidadPorCaja}</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>{prod.cantidadPorDisplay}</td>
                      <td style={{ padding: '15px', textAlign: 'right' }}>
                        {Number(prod.precioFOB).toFixed(2)}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>{prod.moneda}</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleEdit(prod)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', marginRight: '10px' }}
                          title="Editar producto"
                        >
                          ✏️
                        </button>
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

        {/* VISTA PROVEEDORES */}
        {!loading && !error && activeTab === 'PROVEEDORES' && (
          <div style={{ background: '#16213e', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#4cc9f0' }}>Directorio de Proveedores</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  placeholder="🔍 Buscar Proveedor..." 
                  value={searchTermProveedores}
                  onChange={e => setSearchTermProveedores(e.target.value)}
                  style={{ ...inputStyle, width: '250px', padding: '8px', fontSize: '0.9rem' }} 
                />
                <button 
                  onClick={() => setShowModalProveedor(true)}
                  style={{ background: '#e94560', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'transform 0.2s' }}
                >
                  + Nuevo Proveedor
                </button>
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: '#0f3460', color: '#a0a0a0', textAlign: 'left' }}>
                    <th style={{ padding: '15px', borderRadius: '8px 0 0 8px' }}>Empresa</th>
                    <th style={{ padding: '15px' }}>País</th>
                    <th style={{ padding: '15px' }}>Contacto</th>
                    <th style={{ padding: '15px' }}>Email</th>
                    <th style={{ padding: '15px' }}>Teléfono</th>
                    <th style={{ padding: '15px', borderRadius: '0 8px 8px 0', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {proveedoresFiltrados.map((prov, i) => (
                    <tr key={prov.id} style={{ borderBottom: '1px solid #2a2a40', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '15px' }}>{prov.nombre}</td>
                      <td style={{ padding: '15px' }}>{prov.pais}</td>
                      <td style={{ padding: '15px' }}>{prov.ejecutivo}</td>
                      <td style={{ padding: '15px' }}>{prov.email}</td>
                      <td style={{ padding: '15px' }}>{prov.telefono}</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <button 
                          onClick={() => {
                            setNuevoProveedor(prov);
                            setShowModalProveedor(true);
                          }}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', marginRight: '10px' }}
                          title="Editar proveedor"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteProveedor(prov.id)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', filter: 'grayscale(100%)', transition: 'filter 0.2s' }}
                          title="Eliminar proveedor"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {proveedores.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                No hay proveedores registrados.
              </div>
            )}
          </div>
        )}

        {/* VISTA VENTAS (Sábana Mensual) */}
        {!loading && !error && activeTab === 'VENTAS' && (
          <div style={{ background: '#16213e', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button 
                  onClick={() => cambiarMes(-1)}
                  style={{ background: 'transparent', border: '1px solid #4cc9f0', color: '#4cc9f0', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ◀
                </button>
                <h3 style={{ margin: 0, color: '#4cc9f0', minWidth: '200px', textAlign: 'center' }}>
                  {fechaVentas.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
                </h3>
                <button 
                  onClick={() => cambiarMes(1)}
                  style={{ background: 'transparent', border: '1px solid #4cc9f0', color: '#4cc9f0', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ▶
                </button>
              </div>
            </div>
            
            <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1500px' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#0f3460', zIndex: 10 }}>
                  <tr>
                    <th style={{ padding: '15px', textAlign: 'left', minWidth: '200px', position: 'sticky', left: 0, background: '#0f3460', zIndex: 20, borderRight: '2px solid #1a1a2e' }}>Producto</th>
                    {daysArray.map(day => (
                      <th key={day} style={{ padding: '10px', textAlign: 'center', minWidth: '40px', borderLeft: '1px solid #2a2a40', color: '#a0a0a0', fontSize: '0.8rem' }}>{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productos.map((prod, i) => (
                    <tr key={prod.id} style={{ borderBottom: '1px solid #2a2a40', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '10px', position: 'sticky', left: 0, background: i % 2 === 0 ? '#16213e' : '#1a1a2e', zIndex: 10, borderRight: '2px solid #2a2a40' }}>
                        <div style={{ fontWeight: 'bold', color: 'white' }}>{prod.sku}</div>
                        <div style={{ fontSize: '0.8rem', color: '#a0a0a0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{prod.nombre}</div>
                      </td>
                      {daysArray.map(day => {
                        const key = prod.id ? getVentaKey(prod.id, day) : '';
                        const val = ventasMensuales[key] || '';
                        return (
                          <td key={day} style={{ padding: '0', borderLeft: '1px solid #2a2a40' }}>
                            <input 
                              type="number" 
                              value={val}
                              onChange={(e) => prod.id && handleVentaChange(prod.id, day, e.target.value)}
                              style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', color: val ? '#4cc9f0' : '#444', textAlign: 'center', fontSize: '0.9rem', outline: 'none', padding: '10px 0', fontWeight: val ? 'bold' : 'normal' }}
                              placeholder="-"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VISTA RESUMEN VENTAS */}
        {!loading && !error && activeTab === 'RESUMEN_VENTAS' && (
          <div style={{ background: '#16213e', borderRadius: '15px', padding: '40px', textAlign: 'center', color: '#a0a0a0' }}>
            <h2 style={{ color: '#4cc9f0' }}>📊 Resumen de Ventas</h2>
            <p>Próximamente: Gráficos y análisis de ventas.</p>
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
                {nuevoProducto.id ? '✏️ Editar Producto' : '📦 Nuevo Producto'}
              </h2>
              
              <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Código (SKU)</label>
                    <input 
                      placeholder="Ej: PROD-001" 
                      value={nuevoProducto.sku} 
                      onChange={e => setNuevoProducto({...nuevoProducto, sku: e.target.value})} 
                      style={inputStyle} 
                      required 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Proveedor</label>
                    <select 
                      value={nuevoProducto.proveedorId} 
                      onChange={e => setNuevoProducto({...nuevoProducto, proveedorId: Number(e.target.value)})} 
                      style={inputStyle}
                      required
                    >
                      <option value={0}>Seleccione Proveedor...</option>
                      {proveedores.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Origen</label>
                    <input 
                      placeholder="Ej: China" 
                      value={nuevoProducto.paisOrigen} 
                      onChange={e => setNuevoProducto({...nuevoProducto, paisOrigen: e.target.value})} 
                      style={inputStyle} 
                    />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Artículo (Nombre)</label>
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
                    <label style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Peso/Volumen</label>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <input 
                        type="number"
                        placeholder="0" 
                        value={(() => {
                           const match = nuevoProducto.gramaje.match(/^([\d.]+)/);
                           return match ? match[1] : '';
                        })()} 
                        onChange={e => {
                           const val = e.target.value;
                           const match = nuevoProducto.gramaje.match(/[a-zA-Z]+$/);
                           const unit = match ? match[0] : 'gr';
                           setNuevoProducto({...nuevoProducto, gramaje: `${val} ${unit}`});
                        }} 
                        style={{ ...inputStyle, flex: 2 }} 
                      />
                      <select
                        value={(() => {
                           const match = nuevoProducto.gramaje.match(/[a-zA-Z]+$/);
                           return match ? match[0] : 'gr';
                        })()}
                        onChange={e => {
                           const unit = e.target.value;
                           const match = nuevoProducto.gramaje.match(/^([\d.]+)/);
                           const val = match ? match[1] : '0';
                           setNuevoProducto({...nuevoProducto, gramaje: `${val} ${unit}`});
                        }}
                        style={{ ...inputStyle, flex: 1, padding: '12px 5px', minWidth: '70px' }}
                      >
                        <option value="gr">gr</option>
                        <option value="kg">kg</option>
                        <option value="cc">cc</option>
                        <option value="ml">ml</option>
                        <option value="L">L</option>
                      </select>
                    </div>
                   </div>
                   <div style={{ flex: 1 }}>
                    <label style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Und x Caja</label>
                    <input 
                      type="number" placeholder="0" 
                      value={nuevoProducto.cantidadPorCaja} 
                      onChange={e => setNuevoProducto({...nuevoProducto, cantidadPorCaja: e.target.value})} 
                      style={inputStyle} 
                    />
                   </div>
                   <div style={{ flex: 1 }}>
                    <label style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Unid x Display</label>
                    <input 
                      type="number" placeholder="0" 
                      value={nuevoProducto.cantidadPorDisplay} 
                      onChange={e => setNuevoProducto({...nuevoProducto, cantidadPorDisplay: e.target.value})} 
                      style={inputStyle} 
                    />
                   </div>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                   <div style={{ flex: 1 }}>
                    <label style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Valor FOB</label>
                    <input 
                      type="number" step="0.01" placeholder="0.00" 
                      value={nuevoProducto.precioFOB} 
                      onChange={e => setNuevoProducto({...nuevoProducto, precioFOB: e.target.value})} 
                      style={inputStyle} 
                      required 
                    />
                   </div>
                   <div style={{ flex: 1 }}>
                    <label style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Moneda</label>
                    <select 
                      value={nuevoProducto.moneda} 
                      onChange={e => setNuevoProducto({...nuevoProducto, moneda: e.target.value})} 
                      style={inputStyle}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="CLP">CLP</option>
                    </select>
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
                    {nuevoProducto.id ? 'Actualizar' : 'Guardar Producto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL CREAR PROVEEDOR */}
        {showModalProveedor && (
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
                {nuevoProveedor.id ? '✏️ Editar Proveedor' : '🤝 Nuevo Proveedor'}
              </h2>
              
              <form onSubmit={handleCreateProveedor} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Nombre Proveedor</label>
                    <input 
                      placeholder="Ej: Tech Supplies Ltd" 
                      value={nuevoProveedor.nombre} 
                      onChange={e => setNuevoProveedor({...nuevoProveedor, nombre: e.target.value})} 
                      style={inputStyle} 
                      required 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>País</label>
                    <input 
                      placeholder="Ej: USA" 
                      value={nuevoProveedor.pais} 
                      onChange={e => setNuevoProveedor({...nuevoProveedor, pais: e.target.value})} 
                      style={inputStyle} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                   <div style={{ flex: 1 }}>
                    <label style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Ejecutivo</label>
                    <input 
                      placeholder="Ej: John Doe" 
                      value={nuevoProveedor.ejecutivo} 
                      onChange={e => setNuevoProveedor({...nuevoProveedor, ejecutivo: e.target.value})} 
                      style={inputStyle} 
                    />
                   </div>
                   <div style={{ flex: 1 }}>
                    <label style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Teléfono</label>
                    <input 
                      placeholder="+1 555 0000" 
                      value={nuevoProveedor.telefono} 
                      onChange={e => setNuevoProveedor({...nuevoProveedor, telefono: e.target.value})} 
                      style={inputStyle} 
                    />
                   </div>
                </div>

                <div>
                  <label style={{ color: '#a0a0a0', fontSize: '0.8rem', marginBottom: '5px', display: 'block' }}>Email del Ejecutivo</label>
                  <input 
                    type="email"
                    placeholder="john@example.com" 
                    value={nuevoProveedor.email} 
                    onChange={e => setNuevoProveedor({...nuevoProveedor, email: e.target.value})} 
                    style={inputStyle} 
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #2a2a40', paddingTop: '20px' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowModalProveedor(false)} 
                    style={{ background: 'transparent', border: '1px solid #a0a0a0', color: '#a0a0a0', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    style={{ background: '#e94560', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {nuevoProveedor.id ? 'Actualizar' : 'Guardar Proveedor'}
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