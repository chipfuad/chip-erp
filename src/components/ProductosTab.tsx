import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Globe, X, Folder, ArrowLeft, Box, Eye, Package, Clock } from 'lucide-react';

// --- INTERFACES ---
interface Producto {
  id: number;
  sku: string;
  nombre: string;
  precioFOB: number | string;
  gramaje: string;
  paisOrigen: string;
  cantidadPorCaja: number;
  cantidadPorDisplay: number;
  moneda: string;
  duracion: string; // <--- NUEVO CAMPO EN LA INTERFAZ
  proveedorId: number;
}

interface Proveedor {
  id: number;
  nombre: string;
  pais: string;
}

export function ProductosTab() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [vista, setVista] = useState<'CARPETAS' | 'LISTA'>('CARPETAS');
  const [proveedorActivo, setProveedorActivo] = useState<Proveedor | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [verDetalle, setVerDetalle] = useState<Producto | null>(null);
  
  const [formData, setFormData] = useState<Producto>({
    id: 0, sku: '', nombre: '', precioFOB: '', gramaje: '', paisOrigen: '',
    cantidadPorCaja: 0, cantidadPorDisplay: 0, moneda: 'USD', duracion: '', proveedorId: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resProd, resProv] = await Promise.all([
        fetch('http://localhost:3000/api/productos'),
        fetch('http://localhost:3000/api/proveedores')
      ]);
      if (resProd.ok) setProductos(await resProd.json());
      if (resProv.ok) setProveedores(await resProv.json());
    } catch (error) { console.error("Error cargando datos", error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const conteoPorProveedor = useMemo(() => {
    const cuenta: Record<number, number> = {};
    productos.forEach(p => { cuenta[p.proveedorId] = (cuenta[p.proveedorId] || 0) + 1; });
    return cuenta;
  }, [productos]);

  const productosVisibles = productos.filter(p => {
    if (busqueda !== '') return p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.sku.toLowerCase().includes(busqueda.toLowerCase());
    if (proveedorActivo) return p.proveedorId === proveedorActivo.id;
    return true;
  });

  const abrirCarpeta = (prov: Proveedor) => { setProveedorActivo(prov); setVista('LISTA'); setBusqueda(''); };
  const volverACarpetas = () => { setProveedorActivo(null); setVista('CARPETAS'); setBusqueda(''); };

  const handleNuevo = () => {
    setFormData({
      id: 0, sku: '', nombre: '', precioFOB: '', gramaje: '', paisOrigen: '',
      cantidadPorCaja: 0, cantidadPorDisplay: 0, moneda: 'USD', duracion: '',
      proveedorId: proveedorActivo ? proveedorActivo.id : 0
    });
    setMostrarModal(true);
  };

  const handleEditar = (prod: Producto) => { setFormData(prod); setMostrarModal(true); };
  const handleVer = (prod: Producto) => { setVerDetalle(prod); };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let precioFinal = formData.precioFOB.toString().replace(',', '.');
      const precioNumerico = parseFloat(precioFinal) || 0;
      const dataToSend = { ...formData, precioFOB: precioNumerico };
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id ? `http://localhost:3000/api/productos/${formData.id}` : 'http://localhost:3000/api/productos';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dataToSend) });
      if (res.ok) { setMostrarModal(false); fetchData(); } else { alert('Error al guardar'); }
    } catch (error) { alert('Error de conexión'); }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Borrar este producto?')) return;
    try { await fetch(`http://localhost:3000/api/productos/${id}`, { method: 'DELETE' }); fetchData(); } catch (error) { alert('Error al eliminar'); }
  };

  const getGramajeValues = () => {
    const valor = parseFloat(formData.gramaje) || '';
    const unidad = formData.gramaje.replace(/[0-9.]/g, '').trim() || 'g'; 
    return { valor, unidad };
  };
  const updateGramaje = (valor: string | number, unidad: string) => { setFormData({ ...formData, gramaje: `${valor} ${unidad}` }); };
  const getNombreProveedor = (id: number) => { const p = proveedores.find(pr => pr.id === id); return p ? p.nombre : 'Sin Asignar'; };

  // ESTILOS
  const cardStyle = { background: '#16213e', borderRadius: '15px', padding: '20px', display: 'flex', flexDirection: 'column' as const, justifyContent: 'space-between', border: '1px solid #2a2a40', position: 'relative' as const };
  const folderStyle = { background: '#1e293b', borderRadius: '15px', padding: '25px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', border: '1px solid #334155', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' as const, gap: '10px' };
  const inputStyle = { width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', marginBottom: '15px' };
  const sectionTitleStyle = { color: '#4cc9f0', fontSize: '0.9rem', borderBottom: '1px solid #334155', paddingBottom: '5px', marginBottom: '15px', marginTop: '10px', gridColumn: 'span 2' };
  const detailRowStyle = { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #2a2a40', padding: '12px 0' };
  const detailValueStyle = { color: 'white', fontWeight: '500' };

  return (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      {/* 1. ENCABEZADO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
           {vista === 'LISTA' && (
               <button onClick={volverACarpetas} style={{ background: '#334155', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}><ArrowLeft size={20} /></button>
           )}
           <div>
               <h2 style={{ margin: 0, fontSize: '2rem' }}>{vista === 'CARPETAS' && busqueda === '' ? 'Catálogo por Proveedor' : (proveedorActivo ? proveedorActivo.nombre : 'Resultados')}</h2>
               <p style={{ color: '#a0a0a0', margin: '5px 0 0' }}>{vista === 'CARPETAS' && busqueda === '' ? 'Selecciona una carpeta' : `${productosVisibles.length} productos`}</p>
           </div>
        </div>
        <div style={{ display: 'flex', gap: '15px', flex: 1, justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', minWidth: '250px' }}>
            <Search style={{ position: 'absolute', left: '15px', top: '12px', color: '#a0a0a0' }} size={20} />
            <input placeholder="🔍 Buscar..." value={busqueda} onChange={e => { setBusqueda(e.target.value); if(e.target.value) setVista('LISTA'); else if(!proveedorActivo) setVista('CARPETAS'); }} style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '50px', background: '#16213e', border: '1px solid #2a2a40', color: 'white' }} />
          </div>
          <button onClick={handleNuevo} style={{ background: '#4cc9f0', color: '#1a1a2e', border: 'none', padding: '12px 25px', borderRadius: '50px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}><Plus size={20} /> Crear</button>
        </div>
      </div>

      {/* 2. CONTENIDO */}
      {vista === 'CARPETAS' && busqueda === '' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '25px' }}>
            {proveedores.map(prov => (
                <div key={prov.id} style={folderStyle} onClick={() => abrirCarpeta(prov)} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = '#4cc9f0'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#334155'; }}>
                    <Folder size={50} color="#4cc9f0" fill="rgba(76, 201, 240, 0.2)" />
                    <h3 style={{ margin: '5px 0 0', fontSize: '1.2rem' }}>{prov.nombre}</h3>
                    <span style={{ background: '#0f172a', padding: '4px 10px', borderRadius: '10px', fontSize: '0.8rem', color: '#94a3b8' }}>{conteoPorProveedor[prov.id] || 0} Items</span>
                </div>
            ))}
            {conteoPorProveedor[0] > 0 && (
                <div style={{ ...folderStyle, borderStyle: 'dashed' }} onClick={() => abrirCarpeta({ id: 0, nombre: 'Sin Asignar', pais: '-' })}>
                    <Box size={50} color="#94a3b8" />
                    <h3 style={{ margin: '5px 0 0', fontSize: '1.2rem', color: '#94a3b8' }}>Sin Asignar</h3>
                    <span style={{ background: '#0f172a', padding: '4px 10px', borderRadius: '10px', fontSize: '0.8rem', color: '#94a3b8' }}>{conteoPorProveedor[0]} Items</span>
                </div>
            )}
        </div>
      )}

      {(vista === 'LISTA' || busqueda !== '') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
            {productosVisibles.map(prod => (
            <div key={prod.id} style={cardStyle}>
                <div style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <span style={{ background: '#2a2a40', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', color: '#4cc9f0', fontWeight: 'bold' }}>{prod.sku}</span>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <button onClick={() => handleVer(prod)} style={{ background: 'rgba(76, 201, 240, 0.2)', border: 'none', color: '#4cc9f0', cursor: 'pointer', padding: '5px', borderRadius: '5px' }}><Eye size={16} /></button>
                            <button onClick={() => handleEditar(prod)} style={{ background: 'transparent', border: 'none', color: '#a0a0a0', cursor: 'pointer', padding: '5px' }}><Edit size={16} /></button>
                            <button onClick={() => handleEliminar(prod.id)} style={{ background: 'transparent', border: 'none', color: '#e94560', cursor: 'pointer', padding: '5px' }}><Trash2 size={16} /></button>
                        </div>
                    </div>
                    <h3 style={{ margin: '15px 0 10px', fontSize: '1.3rem', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'all 0.2s' }} onClick={() => handleVer(prod)} onMouseEnter={(e) => e.currentTarget.style.textDecorationColor = '#4cc9f0'} onMouseLeave={(e) => e.currentTarget.style.textDecorationColor = 'transparent'}>{prod.nombre}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem', color: '#94a3b8' }}>
                         <div>📦 {prod.cantidadPorCaja} x Caja</div>
                         <div>⏱️ {prod.duracion || 'N/A'}</div>
                    </div>
                </div>
                <div style={{ background: '#0f172a', borderRadius: '10px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>FOB</div><div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2ecc71' }}>{prod.moneda} {prod.precioFOB}</div></div>
                </div>
            </div>
            ))}
        </div>
      )}

      {/* 3. MODAL FORMULARIO */}
      {mostrarModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div style={{ background: '#1e293b', padding: '30px', borderRadius: '20px', width: '650px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ margin: 0 }}>{formData.id ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button onClick={() => setMostrarModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleGuardar}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={sectionTitleStyle}>1. Identificación</div>
                <div><label style={{ display: 'block', color: '#94a3b8', marginBottom: '5px' }}>SKU</label><input required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} style={inputStyle} /></div>
                <div><label style={{ display: 'block', color: '#94a3b8', marginBottom: '5px' }}>Artículo</label><input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} style={inputStyle} /></div>
                <div><label style={{ display: 'block', color: '#94a3b8', marginBottom: '5px' }}>Proveedor</label><select value={formData.proveedorId} onChange={e => setFormData({...formData, proveedorId: parseInt(e.target.value)})} style={inputStyle}><option value={0}>-- Seleccionar --</option>{proveedores.map(prov => (<option key={prov.id} value={prov.id}>{prov.nombre}</option>))}</select></div>
                <div><label style={{ display: 'block', color: '#94a3b8', marginBottom: '5px' }}>Origen</label><input value={formData.paisOrigen} onChange={e => setFormData({...formData, paisOrigen: e.target.value})} style={inputStyle} /></div>

                <div style={sectionTitleStyle}>2. Logística y Vida Útil</div>
                <div><label style={{ display: 'block', color: '#94a3b8', marginBottom: '5px' }}>Peso / Vol</label><div style={{ display: 'flex', gap: '10px' }}><input type="number" value={getGramajeValues().valor} onChange={e => updateGramaje(e.target.value, getGramajeValues().unidad)} style={{ ...inputStyle, marginBottom: '0', flex: 2 }} /><select value={getGramajeValues().unidad} onChange={e => updateGramaje(getGramajeValues().valor, e.target.value)} style={{ ...inputStyle, marginBottom: '0', flex: 1 }}><option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="L">L</option></select></div></div>
                
                {/* --- NUEVO CAMPO DURACIÓN --- */}
                <div>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '5px' }}>Duración (Vida Útil)</label>
                    <input value={formData.duracion || ''} onChange={e => setFormData({...formData, duracion: e.target.value})} style={inputStyle} placeholder="Ej: 12 meses, 2 años" />
                </div>
                
                <div><label style={{ display: 'block', color: '#94a3b8', marginBottom: '5px' }}>Und x Display</label><input type="number" value={formData.cantidadPorDisplay} onChange={e => setFormData({...formData, cantidadPorDisplay: parseInt(e.target.value) || 0})} style={inputStyle} /></div>
                <div><label style={{ display: 'block', color: '#94a3b8', marginBottom: '5px' }}>Und x Caja</label><input type="number" value={formData.cantidadPorCaja} onChange={e => setFormData({...formData, cantidadPorCaja: parseInt(e.target.value) || 0})} style={inputStyle} /></div>

                <div style={sectionTitleStyle}>3. Económico</div>
                <div><label style={{ display: 'block', color: '#94a3b8', marginBottom: '5px' }}>Moneda</label><select value={formData.moneda} onChange={e => setFormData({...formData, moneda: e.target.value})} style={inputStyle}><option value="USD">USD</option><option value="CNY">CNY</option><option value="EUR">EUR</option><option value="CLP">CLP</option></select></div>
                <div><label style={{ display: 'block', color: '#94a3b8', marginBottom: '5px' }}>Valor FOB</label><input type="text" value={formData.precioFOB} onChange={e => { const val = e.target.value; if (/^[\d.,]*$/.test(val)) setFormData({...formData, precioFOB: val}); }} style={inputStyle} /></div>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '15px', borderTop: '1px solid #334155' }}><button type="button" onClick={() => setMostrarModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#334155', color: 'white', cursor: 'pointer' }}>Cancelar</button><button type="submit" style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#4cc9f0', color: '#1a1a2e', fontWeight: 'bold', cursor: 'pointer' }}>Guardar</button></div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL DETALLE */}
      {verDetalle && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, backdropFilter: 'blur(5px)' }} onClick={() => setVerDetalle(null)}>
            <div style={{ background: '#16213e', padding: '0', borderRadius: '20px', width: '500px', maxWidth: '90%', border: '1px solid #4cc9f0', boxShadow: '0 0 30px rgba(76, 201, 240, 0.2)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                <div style={{ background: '#1e293b', padding: '25px', display: 'flex', gap: '20px', alignItems: 'center', borderBottom: '1px solid #334155' }}>
                    <div style={{ width: '60px', height: '60px', background: '#4cc9f0', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1a2e' }}><Package size={30} /></div>
                    <div><div style={{ color: '#4cc9f0', fontSize: '0.9rem', fontWeight: 'bold' }}>{verDetalle.sku}</div><h2 style={{ margin: '5px 0 0', fontSize: '1.5rem', color: 'white' }}>{verDetalle.nombre}</h2></div>
                    <button onClick={() => setVerDetalle(null)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                <div style={{ padding: '25px' }}>
                    <div style={{ marginBottom: '20px' }}><h4 style={{ color: '#4cc9f0', margin: '0 0 10px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>General</h4><div style={detailRowStyle}><span>Proveedor</span><span style={detailValueStyle}>{getNombreProveedor(verDetalle.proveedorId)}</span></div><div style={detailRowStyle}><span>Origen</span><span style={detailValueStyle}>{verDetalle.paisOrigen}</span></div></div>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ color: '#4cc9f0', margin: '0 0 10px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Logística</h4>
                        <div style={detailRowStyle}><span>Peso / Vol</span><span style={detailValueStyle}>{verDetalle.gramaje || '-'}</span></div>
                        
                        {/* --- MOSTRAR DURACIÓN --- */}
                        <div style={detailRowStyle}><span><Clock size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }}/>Vida Útil</span><span style={{ ...detailValueStyle, color: '#f1c40f' }}>{verDetalle.duracion || 'No especificada'}</span></div>
                        
                        <div style={detailRowStyle}><span>Und x Display</span><span style={detailValueStyle}>{verDetalle.cantidadPorDisplay}</span></div>
                        <div style={detailRowStyle}><span>Und x Caja</span><span style={detailValueStyle}>{verDetalle.cantidadPorCaja}</span></div>
                    </div>

                    <div><h4 style={{ color: '#4cc9f0', margin: '0 0 10px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Valoración</h4><div style={detailRowStyle}><span>Moneda</span><span style={detailValueStyle}>{verDetalle.moneda}</span></div><div style={{ ...detailRowStyle, borderBottom: 'none' }}><span>FOB</span><span style={{ ...detailValueStyle, color: '#2ecc71', fontSize: '1.2rem' }}>{verDetalle.precioFOB}</span></div></div>
                </div>
                <div style={{ background: '#0f172a', padding: '15px', textAlign: 'center' }}><button onClick={() => { setMostrarModal(true); setFormData(verDetalle); setVerDetalle(null); }} style={{ background: '#334155', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', gap: '8px', alignItems: 'center' }}><Edit size={16} /> Editar</button></div>
            </div>
        </div>
      )}
    </div>
  );
}