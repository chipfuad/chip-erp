import React, { useState, useEffect } from 'react';

// Interfaces
interface Producto {
  id?: number; 
  sku: string;
  proveedorId?: number;
  paisOrigen: string;
  nombre: string;
  gramaje: string;
  cantidadPorCaja: number;
  cantidadPorDisplay: number;
  precioFOB: number;
  moneda: string;
}

interface Proveedor {
  id: number;
  nombre: string;
}

export function ProductosTab() {
  // --- ESTADOS ---
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]); // Para el dropdown
  const [loading, setLoading] = useState(false);
  
  // Estado del Modal y Formulario
  const [showModal, setShowModal] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState<Producto>({
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

  // --- CARGA DE DATOS ---
  const fetchProductos = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/productos', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setProductos(data);
      }
    } catch (error) {
      console.error("Error cargando productos", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProveedores = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/proveedores');
      if (res.ok) {
        const data = await res.json();
        setProveedores(data);
      }
    } catch (error) {
      console.error("Error cargando proveedores para dropdown", error);
    }
  };

  useEffect(() => {
    fetchProductos();
    fetchProveedores();
  }, []);

  // --- FUNCIONES (GUARDAR, EDITAR, ELIMINAR) ---
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (nuevoProducto.precioFOB <= 0) return alert("⚠️ Precio FOB debe ser mayor a 0");
    if (!nuevoProducto.proveedorId) return alert("⚠️ Selecciona un Proveedor");
    
    // Chequeo duplicados (solo al crear)
    if (!nuevoProducto.id && productos.some(p => p.sku.toLowerCase() === nuevoProducto.sku.toLowerCase())) {
      return alert("⚠️ El SKU ya existe.");
    }

    try {
      const method = nuevoProducto.id ? 'PUT' : 'POST';
      const url = nuevoProducto.id 
        ? `http://localhost:3000/api/productos/${nuevoProducto.id}` 
        : 'http://localhost:3000/api/productos';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoProducto)
      });

      if (!res.ok) throw new Error('Error al guardar');

      fetchProductos();
      setShowModal(false);
      setNuevoProducto({
        sku: '', proveedorId: 0, paisOrigen: '', nombre: '', gramaje: '',
        cantidadPorCaja: 0, cantidadPorDisplay: 0, precioFOB: 0, moneda: 'USD'
      });
      alert(nuevoProducto.id ? '✅ Actualizado' : '✅ Creado');
    } catch (err) {
      alert('❌ Error al guardar producto');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await fetch(`http://localhost:3000/api/productos/${id}`, { method: 'DELETE' });
      fetchProductos(); 
    } catch (err) {
      alert('❌ Error al eliminar');
    }
  };

  const handleEdit = (prod: Producto) => {
    setNuevoProducto(prod);
    setShowModal(true);
  };

  // Helper para mostrar nombre del proveedor en la tabla
  const getNombreProveedor = (id?: number) => {
    return proveedores.find(p => p.id === id)?.nombre || '---';
  };

  const inputStyle = {
    width: '100%', padding: '12px', background: '#1a1a2e',
    border: '1px solid #2a2a40', borderRadius: '8px', color: 'white'
  };

  // --- RENDERIZADO ---
  return (
    <>
      <div style={{ background: '#16213e', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#4cc9f0' }}>Listado Maestro</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={fetchProductos} style={{ background: '#16213e', color: '#4cc9f0', border: '1px solid #4cc9f0', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>🔄</button>
            <button 
              onClick={() => {
                setNuevoProducto({ sku: '', proveedorId: 0, paisOrigen: '', nombre: '', gramaje: '', cantidadPorCaja: 0, cantidadPorDisplay: 0, precioFOB: 0, moneda: 'USD' });
                setShowModal(true);
              }}
              style={{ background: '#e94560', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
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
                <th style={{ padding: '15px', textAlign: 'right' }}>Valor FOB</th>
                <th style={{ padding: '15px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{padding:'20px', textAlign:'center'}}>Cargando...</td></tr> : 
               productos.map((prod, i) => (
                <tr key={prod.id} style={{ borderBottom: '1px solid #2a2a40', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '15px' }}>{prod.sku}</td>
                  <td style={{ padding: '15px' }}>{getNombreProveedor(prod.proveedorId)}</td>
                  <td style={{ padding: '15px' }}>{prod.paisOrigen}</td>
                  <td style={{ padding: '15px' }}>{prod.nombre}</td>
                  <td style={{ padding: '15px' }}>{prod.gramaje}</td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>{prod.cantidadPorCaja}</td>
                  <td style={{ padding: '15px', textAlign: 'right' }}>{Number(prod.precioFOB).toFixed(2)} {prod.moneda}</td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <button onClick={() => handleEdit(prod)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', marginRight: '10px' }}>✏️</button>
                    <button onClick={() => prod.id && handleDelete(prod.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', filter: 'grayscale(100%)' }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORMULARIO */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#16213e', padding: '30px', borderRadius: '15px', width: '500px', border: '1px solid #4cc9f0', boxShadow: '0 0 30px rgba(76, 201, 240, 0.2)' }}>
            <h2 style={{ color: '#4cc9f0', marginTop: 0, marginBottom: '20px', borderBottom: '1px solid #2a2a40', paddingBottom: '10px' }}>
              {nuevoProducto.id ? '✏️ Editar' : '📦 Nuevo'} Producto
            </h2>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#a0a0a0', fontSize: '0.8rem' }}>SKU</label>
                  <input required placeholder="PROD-001" value={nuevoProducto.sku} onChange={e => setNuevoProducto({...nuevoProducto, sku: e.target.value})} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#a0a0a0', fontSize: '0.8rem' }}>Proveedor</label>
                  <select required value={nuevoProducto.proveedorId} onChange={e => setNuevoProducto({...nuevoProducto, proveedorId: Number(e.target.value)})} style={inputStyle}>
                    <option value={0}>Seleccione...</option>
                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#a0a0a0', fontSize: '0.8rem' }}>Origen</label>
                  <input placeholder="China" value={nuevoProducto.paisOrigen} onChange={e => setNuevoProducto({...nuevoProducto, paisOrigen: e.target.value})} style={inputStyle} />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ color: '#a0a0a0', fontSize: '0.8rem' }}>Nombre Artículo</label>
                  <input required placeholder="Ej: Galletas" value={nuevoProducto.nombre} onChange={e => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}><label style={{ color: '#a0a0a0', fontSize: '0.8rem' }}>Peso/Vol</label><input placeholder="500g" value={nuevoProducto.gramaje} onChange={e => setNuevoProducto({...nuevoProducto, gramaje: e.target.value})} style={inputStyle} /></div>
                  <div style={{ flex: 1 }}><label style={{ color: '#a0a0a0', fontSize: '0.8rem' }}>Und/Caja</label><input type="number" value={nuevoProducto.cantidadPorCaja} onChange={e => setNuevoProducto({...nuevoProducto, cantidadPorCaja: Number(e.target.value)})} style={inputStyle} /></div>
                  <div style={{ flex: 1 }}><label style={{ color: '#a0a0a0', fontSize: '0.8rem' }}>Precio FOB</label><input required type="number" step="0.01" value={nuevoProducto.precioFOB} onChange={e => setNuevoProducto({...nuevoProducto, precioFOB: Number(e.target.value)})} style={inputStyle} /></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #2a2a40', paddingTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'transparent', border: '1px solid #a0a0a0', color: '#a0a0a0', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ background: '#e94560', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}