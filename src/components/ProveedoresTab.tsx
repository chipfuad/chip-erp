import React, { useState, useEffect } from 'react';

// Definimos la forma de los datos
interface Proveedor {
  id: number;
  nombre: string;
  pais: string;
  ejecutivo: string;
  email: string;
  telefono: string;
}

export function ProveedoresTab() {
  // --- ESTADOS PROPIOS DEL COMPONENTE ---
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModalProveedor, setShowModalProveedor] = useState(false);
  
  const [nuevoProveedor, setNuevoProveedor] = useState<Proveedor>({
    id: 0,
    nombre: '',
    pais: '',
    ejecutivo: '',
    email: '',
    telefono: ''
  });

  // --- CONEXIÓN AL BACKEND ---
  const fetchProveedores = () => {
    setLoading(true);
    fetch('http://localhost:3000/api/proveedores')
      .then(res => res.json())
      .then(data => {
        setProveedores(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  // Cargar datos al entrar a esta pestaña
  useEffect(() => {
    fetchProveedores();
  }, []);

  // --- FUNCIONES (CREAR, EDITAR, BORRAR) ---
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

  // Estilo reutilizable para inputs
  const inputStyle = {
    width: '100%',
    padding: '12px',
    background: '#1a1a2e',
    border: '1px solid #2a2a40',
    borderRadius: '8px',
    color: 'white',
    fontSize: '1rem'
  };

  // --- RENDERIZADO (LO QUE SE VE) ---
  return (
    <>
      <div style={{ background: '#16213e', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
        {/* Encabezado de la tabla */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#4cc9f0' }}>Directorio de Proveedores</h3>
          <button 
            onClick={() => {
                setNuevoProveedor({ id: 0, nombre: '', pais: '', ejecutivo: '', email: '', telefono: '' });
                setShowModalProveedor(true);
            }}
            style={{ background: '#e94560', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'transform 0.2s' }}
          >
            + Nuevo Proveedor
          </button>
        </div>
        
        {/* Tabla */}
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
              {loading ? (
                 <tr><td colSpan={6} style={{padding: '20px', textAlign: 'center', color: '#4cc9f0'}}>Cargando...</td></tr>
              ) : proveedores.map((prov, i) => (
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
        {!loading && proveedores.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
            No hay proveedores registrados.
          </div>
        )}
      </div>

      {/* MODAL (Ventana Emergente) */}
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
    </>
  );
}