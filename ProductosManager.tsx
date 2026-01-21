import React, { useState, useEffect, useRef } from 'react';

interface Producto {
  id: number;
  sku: string;
  nombre: string;
  descripcion?: string;
  precioCosto?: number;
  precioVenta?: number;
  leadTime?: number;
  stockMinimo?: number;
  proveedorId?: number;
  inventario?: { cantidad: number };
}

export const ProductosManager: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar productos al iniciar
  const fetchProductos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/productos');
      const data = await res.json();
      setProductos(data.datos || []);
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  // Manejar subida de archivo
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('archivo', file);

    setLoading(true);
    setUploadResult(null); // Limpiar resultado anterior

    try {
      const res = await fetch('/api/productos/carga-masiva', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      setUploadResult(data);
      
      if (res.ok && data.resultados?.procesados > 0) {
        fetchProductos(); // Recargar la tabla si hubo éxito
      } else if (!res.ok) {
        alert("Error en la carga: " + (data.error || "Desconocido"));
      }
    } catch (error) {
      console.error("Error subiendo archivo", error);
      alert("Error de conexión al subir archivo");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    }
  };

  return (
    <div style={{ padding: '20px', color: '#e0e0e0', fontFamily: 'Segoe UI, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Encabezado y Botones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: '#4cc9f0', margin: 0 }}>Maestro de Productos</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#a0a0a0' }}>Gestión del catálogo maestro y precios</p>
        </div>
        
        <div>
          <input 
            type="file" 
            ref={fileInputRef}
            style={{ display: 'none' }} 
            onChange={handleFileUpload} 
            accept=".xlsx, .xls"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            style={{ 
              backgroundColor: loading ? '#555' : '#f1c40f', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: '5px', 
              cursor: loading ? 'wait' : 'pointer',
              fontWeight: 'bold',
              color: '#1a1a2e',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
            }}
          >
            <span>{loading ? 'Procesando...' : '📂 Importar Excel Inteligente'}</span>
          </button>
        </div>
      </div>

      {/* Panel de Resultados de Carga (Feedback) */}
      {uploadResult && (
        <div style={{ 
          background: uploadResult.resultados?.errores > 0 ? 'rgba(233, 69, 96, 0.1)' : 'rgba(76, 201, 240, 0.1)', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px', 
          border: `1px solid ${uploadResult.resultados?.errores > 0 ? '#e94560' : '#4cc9f0'}` 
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>
            {uploadResult.mensaje}
          </h4>
          <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem' }}>
            <span>Leídos: <b>{uploadResult.resultados?.procesados}</b></span>
            <span>Errores: <b style={{color: uploadResult.resultados?.errores > 0 ? '#e94560' : '#a0a0a0'}}>{uploadResult.resultados?.errores}</b></span>
          </div>
          
          {/* Mostrar qué columnas reconoció la IA */}
          {uploadResult.columnasDetectadas && (
            <div style={{ marginTop: '10px', fontSize: '0.85em', color: '#a0a0a0', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '5px' }}>
              🤖 <b>Columnas reconocidas automáticamente:</b> {uploadResult.columnasDetectadas.join(', ')}
            </div>
          )}

          {/* Detalles de errores si los hay */}
          {uploadResult.resultados?.detalles?.length > 0 && (
            <div style={{ marginTop: '10px', maxHeight: '100px', overflowY: 'auto', fontSize: '0.8em', color: '#e94560' }}>
              {uploadResult.resultados.detalles.map((d: string, i: number) => <div key={i}>{d}</div>)}
            </div>
          )}
        </div>
      )}

      {/* Tabla de Productos */}
      <div style={{ overflowX: 'auto', background: '#16213e', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead style={{ background: '#0f3460', color: '#a0a0a0' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #1a1a2e' }}>SKU / Código</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #1a1a2e' }}>Producto</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #1a1a2e' }}>Descripción</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #1a1a2e' }}>Costo</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #1a1a2e' }}>Precio Venta</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #1a1a2e' }}>Lead Time</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #1a1a2e' }}>Stock Min</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #1a1a2e' }}>Stock Físico</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p, index) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #0f3460', backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '10px', color: '#4cc9f0', fontWeight: 'bold' }}>{p.sku}</td>
                <td style={{ padding: '10px', fontWeight: 'bold', color: '#fff' }}>{p.nombre}</td>
                <td style={{ padding: '10px', color: '#a0a0a0', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.descripcion || '-'}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>${p.precioCosto?.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>${p.precioVenta?.toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>{p.leadTime} días</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>{p.stockMinimo}</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#f1c40f' }}>
                  {p.inventario?.cantidad || 0}
                </td>
              </tr>
            ))}
            {productos.length === 0 && !loading && (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#a0a0a0' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📦</div>
                  No hay productos registrados.<br/>
                  ¡Prueba el botón de <b>Importar Excel Inteligente</b> arriba!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
