import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Mail, User, Plus, ArrowLeft, Save, Trash2, Globe, FileText, Map } from 'lucide-react';

// 1. INTERFAZ ACTUALIZADA (Coincide con tu Base de Datos)
interface Proveedor {
  id: number;
  nombre: string;
  pais: string;
  ejecutivo: string;
  email: string;
  telefono: string;
  // Campos nuevos (opcionales)
  direccion?: string;
  ciudad?: string;
  website?: string;
  notas?: string;
}

export function ProveedoresTab() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Control de Vistas: 'GRID' (Globos) o 'DETALLE' (Formulario)
  const [vista, setVista] = useState<'GRID' | 'DETALLE'>('GRID');
  
  // Estado del Formulario
  const [formData, setFormData] = useState<Proveedor>({
    id: 0, nombre: '', pais: '', ejecutivo: '', email: '', telefono: '',
    direccion: '', ciudad: '', website: '', notas: ''
  });

  // --- CARGAR DATOS ---
  const fetchProveedores = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/proveedores');
      if (res.ok) {
        const data = await res.json();
        setProveedores(data);
      }
    } catch (error) {
      console.error("Error al cargar proveedores", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  // --- NAVEGACIÓN Y ACCIONES ---
  const handleAbrirProveedor = (prov: Proveedor) => {
    setFormData(prov); // Cargar datos del proveedor clicado
    setVista('DETALLE');
  };

  const handleNuevoProveedor = () => {
    // Limpiar formulario para uno nuevo
    setFormData({ 
        id: 0, nombre: '', pais: '', ejecutivo: '', email: '', telefono: '',
        direccion: '', ciudad: '', website: '', notas: ''
    });
    setVista('DETALLE');
  };

  const handleVolver = () => {
    setVista('GRID');
    fetchProveedores(); // Recargar por si hubo cambios
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id 
        ? `http://localhost:3000/api/proveedores/${formData.id}`
        : 'http://localhost:3000/api/proveedores';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('✅ Guardado correctamente');
        handleVolver();
      } else {
        alert('⚠️ Error al guardar. Verifica que el servidor Backend esté corriendo.');
      }
    } catch (error) {
      alert('❌ Error de conexión con el servidor.');
    }
  };

  const handleEliminar = async () => {
    if (!formData.id) return;
    if (!confirm('¿Estás seguro de ELIMINAR este proveedor? Se borrarán sus datos.')) return;
    
    try {
      const res = await fetch(`http://localhost:3000/api/proveedores/${formData.id}`, { method: 'DELETE' });
      if (res.ok) {
        handleVolver();
      } else {
        alert('Error al eliminar');
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  // --- ESTILOS ---
  const inputStyle = {
    width: '100%', padding: '12px', background: '#0f172a',
    border: '1px solid #334155', borderRadius: '8px', color: 'white', marginTop: '5px'
  };
  
  const labelStyle = { color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' };

  const cardStyle = {
    background: '#16213e', borderRadius: '15px', padding: '20px', border: '1px solid #2a2a40',
    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', textAlign: 'center' as const, gap: '10px', minHeight: '180px', justifyContent: 'center'
  };

  // --- RENDERIZADO: VISTA DETALLE (FORMULARIO) ---
  if (vista === 'DETALLE') {
    return (
      <div style={{ animation: 'fadeIn 0.3s' }}>
        {/* Encabezado del Formulario */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <button onClick={handleVolver} style={{ background: 'transparent', border: 'none', color: '#a0a0a0', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '1rem' }}>
            <ArrowLeft /> Volver al Directorio
          </button>
          <div style={{ display: 'flex', gap: '15px' }}>
             {formData.id !== 0 && (
                <button onClick={handleEliminar} style={{ background: '#450a0a', color: '#f87171', border: '1px solid #991b1b', padding: '10px 20px', borderRadius: '8px', display: 'flex', gap: '8px', cursor: 'pointer' }}>
                  <Trash2 size={18} /> Borrar
                </button>
             )}
             <button onClick={handleGuardar} style={{ background: '#e94560', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '8px', display: 'flex', gap: '8px', cursor: 'pointer', fontWeight: 'bold', alignItems: 'center' }}>
                <Save size={18} /> Guardar Cambios
             </button>
          </div>
        </div>

        {/* Tarjeta del Formulario */}
        <div style={{ background: '#16213e', borderRadius: '20px', padding: '40px', maxWidth: '900px', margin: '0 auto', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ width: '80px', height: '80px', background: '#4cc9f0', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#1a1a2e' }}>
                    <Building2 size={40} />
                </div>
                <h2 style={{ margin: 0, fontSize: '2rem', color: 'white' }}>{formData.nombre || 'Nuevo Proveedor'}</h2>
            </div>

            <form style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                
                {/* 1. Datos de la Empresa */}
                <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Nombre Legal de la Empresa</label>
                    <input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} style={inputStyle} placeholder="Ej: Shenzhen Technology Co." />
                </div>

                <div>
                    <label style={labelStyle}><Globe size={14} style={{display:'inline', marginRight:'5px'}}/> País</label>
                    <input value={formData.pais} onChange={e => setFormData({...formData, pais: e.target.value})} style={inputStyle} />
                </div>
                <div>
                    <label style={labelStyle}><Map size={14} style={{display:'inline', marginRight:'5px'}}/> Ciudad</label>
                    <input value={formData.ciudad || ''} onChange={e => setFormData({...formData, ciudad: e.target.value})} style={inputStyle} placeholder="Ej: Shanghai" />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}><MapPin size={14} style={{display:'inline', marginRight:'5px'}}/> Dirección Completa</label>
                    <input value={formData.direccion || ''} onChange={e => setFormData({...formData, direccion: e.target.value})} style={inputStyle} placeholder="Calle, Número, Distrito..." />
                </div>

                {/* 2. Datos de Contacto */}
                <div>
                    <label style={labelStyle}><User size={14} style={{display:'inline', marginRight:'5px'}}/> Ejecutivo de Ventas</label>
                    <input value={formData.ejecutivo || ''} onChange={e => setFormData({...formData, ejecutivo: e.target.value})} style={inputStyle} />
                </div>
                <div>
                    <label style={labelStyle}><Phone size={14} style={{display:'inline', marginRight:'5px'}}/> Teléfono / WhatsApp</label>
                    <input value={formData.telefono || ''} onChange={e => setFormData({...formData, telefono: e.target.value})} style={inputStyle} />
                </div>

                <div>
                    <label style={labelStyle}><Mail size={14} style={{display:'inline', marginRight:'5px'}}/> Email</label>
                    <input value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} style={inputStyle} />
                </div>
                <div>
                    <label style={labelStyle}><Globe size={14} style={{display:'inline', marginRight:'5px'}}/> Sitio Web</label>
                    <input value={formData.website || ''} onChange={e => setFormData({...formData, website: e.target.value})} style={inputStyle} placeholder="www.ejemplo.com" />
                </div>

                {/* 3. Notas Adicionales */}
                <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}><FileText size={14} style={{display:'inline', marginRight:'5px'}}/> Notas Internas / Datos Bancarios</label>
                    <textarea 
                        value={formData.notas || ''} 
                        onChange={e => setFormData({...formData, notas: e.target.value})} 
                        style={{ ...inputStyle, minHeight: '100px', fontFamily: 'inherit' }} 
                        placeholder="Escribe aquí información importante..." 
                    />
                </div>
            </form>
        </div>
      </div>
    );
  }

  // --- RENDERIZADO: VISTA GRID (TARJETAS) ---
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
         <div><h2 style={{ margin: 0, fontSize: '2rem' }}>Directorio</h2><p style={{ color: '#a0a0a0', marginTop: '5px' }}>Gestiona tu red de proveedores</p></div>
         <button onClick={handleNuevoProveedor} style={{ background: '#e94560', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(233, 69, 96, 0.4)' }}>
           <Plus size={24} /> Agregar Empresa
         </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '25px' }}>
        {loading && <div style={{ color: '#a0a0a0' }}>Cargando directorio...</div>}
        
        {!loading && proveedores.map(prov => (
            <div 
              key={prov.id} 
              onClick={() => handleAbrirProveedor(prov)}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(76, 201, 240, 0.15)'; e.currentTarget.style.borderColor = '#4cc9f0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#2a2a40'; }}
              style={cardStyle}
            >
                <div style={{ width: '60px', height: '60px', background: 'rgba(76, 201, 240, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4cc9f0', marginBottom: '10px' }}>
                    <Building2 size={30} />
                </div>
                <h3 style={{ margin: '0', color: 'white', fontSize: '1.1rem' }}>{prov.nombre}</h3>
                
                <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', justifyContent:'center', marginTop:'5px' }}>
                    <span style={{ fontSize: '0.8rem', background: '#0f172a', padding: '4px 10px', borderRadius: '10px', color: '#94a3b8' }}>
                        {prov.pais}
                    </span>
                    {/* Indicador visual si tiene web */}
                    {prov.website && (
                         <span style={{ fontSize: '0.8rem', background: 'rgba(46, 204, 113, 0.2)', padding: '4px 8px', borderRadius: '10px', color: '#2ecc71', display:'flex', alignItems:'center' }} title="Sitio Web Disponible">
                            <Globe size={12} />
                         </span>
                    )}
                     {/* Indicador visual si tiene notas */}
                     {prov.notas && (
                         <span style={{ fontSize: '0.8rem', background: 'rgba(241, 196, 15, 0.2)', padding: '4px 8px', borderRadius: '10px', color: '#f1c40f', display:'flex', alignItems:'center' }} title="Tiene notas">
                            <FileText size={12} />
                         </span>
                    )}
                </div>

                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #2a2a40', width: '100%', fontSize: '0.85rem', color: '#a0a0a0' }}>
                     <User size={14} style={{display:'inline', marginRight:'5px', verticalAlign:'middle'}} /> 
                     {prov.ejecutivo || 'Sin contacto'}
                </div>
            </div>
        ))}

        {!loading && proveedores.length === 0 && (
            <div style={{ padding: '40px', color: '#666', gridColumn: '1 / -1', textAlign: 'center' }}>
                <Building2 size={40} style={{ opacity: 0.3, marginBottom:'10px' }} />
                <p>No hay proveedores registrados. ¡Agrega el primero!</p>
            </div>
        )}
      </div>
    </>
  );
}