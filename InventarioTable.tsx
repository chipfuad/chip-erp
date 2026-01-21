import React, { useState } from 'react';

// Definimos la interfaz AQUÍ, localmente, para no importar nada del backend.
// Esto evita que Vite intente empaquetar código de servidor (Express/Prisma) en el navegador.
export interface ComexRegistro {
  id?: number;
  fechaCorte?: string | Date;
  cveArt?: string;
  articulo?: string;
  stockActual?: number;
  consumoPromedio?: number;
  mesesStockProy?: number;
  leadTime?: number;
  mesesStockReal?: number;
  finalStockFisico?: number;
  fechaVencimiento?: string | Date;
  fechaPedSug?: string | Date;
  pfFact?: string;
  etd?: string | Date;
  unidadesTransito?: number;
  eta?: string | Date;
  finalStockTotal?: string | Date;
  boxNota?: string;
  fechaSugeridaPedido?: string | Date;
  fechaAgotamiento?: string | Date;
  cantidadSugerida?: number;
  alertaFechaPedir?: string | Date;
  mesVentas?: string;
  ventasMaquina?: number;
  ventasMayorista?: number;
  totalVentas?: number;
  porcentajeCumplimiento?: number;
  proveedorId?: number; // ID del proveedor para filtros
  proveedor?: { nombre: string }; // Datos del proveedor incluido
  historialVentas?: number[]; // Historial de ventas de 12 meses
}

export interface InventarioTableProps {
  data: ComexRegistro[];
  isLoading?: boolean;
  onUpdate?: (id: number, field: string, value: any) => void;
  view?: 'INVENTARIO' | 'PROYECCIONES' | 'DASHBOARD' | 'PROVEEDORES';
}

const formatDate = (date?: string | Date) => {
  if (!date) return '-';
  // Usamos 'es-ES' para asegurar el orden Día/Mes/Año 
  // y 'numeric' para ver el año completo (2026)
  return new Date(date).toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
};

const formatNumber = (num?: number) => {
  if (num === undefined || num === null) return '-';
  return num.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatPercent = (num?: number) => {
  if (num === undefined || num === null) return '-';
  return (num * 100).toFixed(1) + '%';
};

// Estilo para inputs de la matriz
const inputMatrixStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(0, 0, 0, 0.2)',
  border: '1px solid #2a2a40',
  color: '#fff',
  padding: '8px',
  textAlign: 'right',
  borderRadius: '4px',
  fontSize: '0.85rem'
};

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const InventarioTable: React.FC<InventarioTableProps> = ({ data, isLoading, onUpdate, view = 'INVENTARIO' }) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  
  // --- Estado para el Modal de Historial ---
  const [showHistory, setShowHistory] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ComexRegistro | null>(null);
  const [salesHistory, setSalesHistory] = useState<number[]>(Array(12).fill(0));

  const handleOpenHistory = (item: ComexRegistro) => {
    setSelectedItem(item);
    // Si ya existe historial, lo usamos. Si no, iniciamos con ceros.
    const history = Array.isArray(item.historialVentas) ? item.historialVentas : Array(12).fill(0);
    // Aseguramos que tenga 12 elementos
    setSalesHistory([...history, ...Array(12).fill(0)].slice(0, 12));
    setShowHistory(true);
  };

  const handleHistoryChange = (index: number, val: string) => {
    const newHistory = [...salesHistory];
    newHistory[index] = parseFloat(val) || 0;
    setSalesHistory(newHistory);
  };

  const saveHistory = () => {
    if (selectedItem && onUpdate) {
      onUpdate(selectedItem.id!, 'historialVentas', salesHistory);
    }
    setShowHistory(false);
  };

  if (isLoading) return <div style={{ padding: '20px', color: '#a0a0a0', textAlign: 'center' }}>Cargando datos...</div>;
  if (!data || data.length === 0) return <div style={{ padding: '20px', color: '#a0a0a0', textAlign: 'center' }}>No hay registros.</div>;

  return (
    <div style={styles.container}>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              {view === 'INVENTARIO' && (
              <>
              <th style={styles.th}>F. Corte</th>
              <th style={styles.th}>Proveedor</th>
              <th style={styles.th}>Cve-Art</th>
              <th style={{ ...styles.th, minWidth: '150px' }}>Artículo</th>
              <th style={styles.th}>Stock Actual</th>
              <th style={styles.th}>Cons. Prom.</th>
              <th style={styles.th}>Meses Stock (Proy)</th>
              <th style={styles.th}>Meses Stock (Real)</th>
              <th style={styles.th}>Final Stock (Físico)</th>
              <th style={styles.th}>F. Vencimiento</th>
              <th style={styles.th}>F. Ped/Sug</th>
              <th style={styles.th}>PF/Fact</th>
              <th style={{ ...styles.th, ...styles.headerTransito }}>ETD</th>
              <th style={{ ...styles.th, ...styles.headerTransito }}>U. Tránsito</th>
              <th style={{ ...styles.th, ...styles.headerTransito }}>ETA</th>
              <th style={styles.th}>Final Stock (Total)</th>
              <th style={styles.th}>Box Nota</th>
              <th style={styles.th}>F. Sug. Pedido</th>
              <th style={{ ...styles.th, ...styles.headerAlerta }}>Alerta Pedir</th>
              <th style={styles.th}>Mes Ventas</th>
              <th style={styles.th}>V. Maquina</th>
              <th style={styles.th}>V. Mayorista</th>
              <th style={styles.th}>Total Ventas</th>
              <th style={styles.th}>% Cump.</th>
              </>
              )}

              {view === 'PROYECCIONES' && (
              <>
                <th style={styles.th}>Proveedor</th>
                <th style={styles.th}>SKU</th>
                <th style={styles.th}>Descripción</th>
                <th style={{ ...styles.th, width: '100px', color: '#4cc9f0' }}>Stock Actual</th>
                <th style={{ ...styles.th, width: '100px', color: '#4cc9f0' }}>Consumo Prom.</th>
                <th style={styles.th}>Meses Stock</th>
                <th style={{ ...styles.th, width: '100px', color: '#4cc9f0' }}>Final Stock Físico</th>
                <th style={{ ...styles.th, width: '130px', color: '#4cc9f0' }}>F. Vencimiento</th>
                <th style={styles.th}>Ventas 12 Meses</th>
              </>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              // Lógica de Alerta Visual
              const diasParaVencer = row.fechaVencimiento 
                ? (new Date(row.fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) 
                : 999;
              const esCritico = (row.mesesStockProy || 0) < 1.5 || diasParaVencer < 60;
              
              const rowStyle = {
                backgroundColor: esCritico ? 'rgba(233, 69, 96, 0.15)' : (index % 2 === 0 ? '#16213e' : '#1a1a2e'),
                borderBottom: '1px solid #0f3460'
              };

              return (
              <tr key={row.id || index} style={rowStyle}>
                {view === 'INVENTARIO' && (
                <>
                <td style={styles.td}>{formatDate(row.fechaCorte)}</td>
                <td style={styles.td}>{row.proveedor?.nombre || '-'}</td>
                <td style={styles.td}><span style={styles.badge}>{row.cveArt}</span></td>
                <td style={{ ...styles.td, fontWeight: 'bold', color: '#fff' }}>{row.articulo}</td>
                
                {/* Stock Actual Editable */}
                <td 
                  style={{ ...styles.td, cursor: 'pointer', border: editingKey === `${row.id}-stock` ? '1px solid #4cc9f0' : 'none' }}
                  onDoubleClick={() => setEditingKey(`${row.id}-stock`)}
                >
                  {editingKey === `${row.id}-stock` ? (
                    <input 
                      type="number" 
                      autoFocus
                      defaultValue={row.stockActual}
                      onBlur={(e) => { onUpdate && onUpdate(row.id!, 'stockActual', parseFloat(e.target.value)); setEditingKey(null); }}
                      onKeyDown={(e) => { if(e.key === 'Enter') e.currentTarget.blur(); }}
                      style={{ background: '#0f3460', color: 'white', border: 'none', padding: '5px', width: '60px' }}
                    />
                  ) : formatNumber(row.stockActual)}
                </td>

                <td style={styles.td}>{formatNumber(row.consumoPromedio)}</td>
                <td style={styles.td}>{formatNumber(row.mesesStockProy)}</td>
                <td style={styles.td}>{formatNumber(row.mesesStockReal)}</td>
                <td style={styles.td}>{row.finalStockFisico}</td>
                <td style={{ ...styles.td, color: diasParaVencer < 60 ? '#e94560' : '#e0e0e0', fontWeight: diasParaVencer < 60 ? 'bold' : 'normal' }}>{formatDate(row.fechaVencimiento)}</td>
                <td style={styles.td}>{formatDate(row.fechaPedSug)}</td>
                <td style={styles.td}>{row.pfFact}</td>
                <td style={{ ...styles.td, color: '#f1c40f' }}>{formatDate(row.etd)}</td>
                <td style={{ ...styles.td, color: '#f1c40f', fontWeight: 'bold' }}>{formatNumber(row.unidadesTransito)}</td>
                
                {/* Celda ETA Editable */}
                <td 
                  style={{ ...styles.td, color: '#f1c40f', cursor: 'pointer', border: editingKey === `${row.id}-eta` ? '1px solid #4cc9f0' : 'none' }}
                  onDoubleClick={() => setEditingKey(`${row.id}-eta`)}
                >
                  {editingKey === `${row.id}-eta` ? (
                    <input 
                      type="date" 
                      autoFocus
                      defaultValue={row.eta ? new Date(row.eta).toISOString().split('T')[0] : ''}
                      onBlur={(e) => { onUpdate && onUpdate(row.id!, 'eta', e.target.value); setEditingKey(null); }}
                      onKeyDown={(e) => { if(e.key === 'Enter') e.currentTarget.blur(); }}
                      style={{ background: '#0f3460', color: 'white', border: 'none', padding: '5px' }}
                    />
                  ) : formatDate(row.eta)}
                </td>

                <td style={styles.td}>{formatDate(row.finalStockTotal)}</td>
                <td style={styles.td}>{row.boxNota}</td>
                <td style={styles.td}>{formatDate(row.fechaSugeridaPedido)}</td>
                <td style={{ ...styles.td, color: '#e94560', fontWeight: 'bold', backgroundColor: 'rgba(233, 69, 96, 0.1)' }}>{formatDate(row.alertaFechaPedir)}</td>
                <td style={styles.td}>{row.mesVentas}</td>
                <td style={styles.td}>{formatNumber(row.ventasMaquina)}</td>
                <td style={styles.td}>{formatNumber(row.ventasMayorista)}</td>
                <td style={styles.td}>{formatNumber(row.totalVentas)}</td>
                <td style={styles.td}>{formatPercent(row.porcentajeCumplimiento)}</td>
                </>
                )}

                {view === 'PROYECCIONES' && (
                <>
                  <td style={styles.td}>{row.proveedor?.nombre || '-'}</td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{row.cveArt}</div>
                  </td>
                  <td style={styles.td}>{row.articulo}</td>
                  
                  {/* Stock Actual */}
                  <td style={styles.td}>
                    <input 
                      key={`stock-${row.stockActual}`}
                      type="number" 
                      defaultValue={row.stockActual}
                      onBlur={(e) => onUpdate && onUpdate(row.id!, 'stockActual', parseFloat(e.target.value))}
                      style={inputMatrixStyle}
                    />
                  </td>

                  {/* Consumo Promedio */}
                  <td style={styles.td}>
                    <input 
                      key={`consumo-${row.consumoPromedio}`}
                      type="number" 
                      defaultValue={row.consumoPromedio}
                      onBlur={(e) => onUpdate && onUpdate(row.id!, 'consumoPromedio', parseFloat(e.target.value))}
                      style={inputMatrixStyle}
                    />
                  </td>

                  {/* Meses Stock (Calculado) */}
                  <td style={{ ...styles.td, fontWeight: 'bold', textAlign: 'center' }}>
                    {formatNumber((row.stockActual || 0) / (row.consumoPromedio || 1))}
                  </td>

                  {/* Final Stock Físico */}
                  <td style={styles.td}>
                    <input 
                      key={`final-${row.finalStockFisico}`}
                      type="number" 
                      defaultValue={row.finalStockFisico}
                      onBlur={(e) => onUpdate && onUpdate(row.id!, 'finalStockFisico', parseFloat(e.target.value))}
                      style={inputMatrixStyle}
                    />
                  </td>

                  {/* Fecha Vencimiento */}
                  <td style={styles.td}>
                    <input 
                      key={`venc-${row.fechaVencimiento}`}
                      type="date" 
                      defaultValue={row.fechaVencimiento ? new Date(row.fechaVencimiento).toISOString().split('T')[0] : ''}
                      onBlur={(e) => onUpdate && onUpdate(row.id!, 'fechaVencimiento', e.target.value)}
                      style={inputMatrixStyle}
                    />
                  </td>
                  
                  {/* Botón Ventas 12 Meses */}
                  <td style={styles.td}>
                    <button 
                      onClick={() => handleOpenHistory(row)}
                      style={{ 
                        background: 'transparent', 
                        border: '1px solid #a0a0a0', 
                        color: '#a0a0a0', 
                        borderRadius: '4px', 
                        cursor: 'pointer', 
                        padding: '4px 8px',
                        fontSize: '0.75rem'
                      }}
                    >
                      📊 Historial
                    </button>
                  </td>
                </>
                )}
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {/* --- MODAL DE HISTORIAL DE VENTAS --- */}
      {showHistory && selectedItem && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ color: '#4cc9f0', marginTop: 0, borderBottom: '1px solid #2a2a40', paddingBottom: '10px' }}>
              Historial de Ventas (Últimos 12 Meses)
            </h3>
            <p style={{ color: '#a0a0a0', fontSize: '0.9rem', marginBottom: '20px' }}>
              Ingresa las unidades vendidas mensualmente para: <strong style={{ color: '#fff' }}>{selectedItem.articulo}</strong> ({selectedItem.cveArt})
            </p>
            
            <div style={styles.grid12}>
              {salesHistory.map((val, idx) => (
                <div key={idx}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#a0a0a0', marginBottom: '5px' }}>{MONTHS[idx]}</label>
                  <input 
                    type="number" 
                    value={val} 
                    onChange={(e) => handleHistoryChange(idx, e.target.value)}
                    style={styles.inputModal}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #2a2a40', paddingTop: '15px' }}>
              <button onClick={() => setShowHistory(false)} style={styles.btnCancel}>Cancelar</button>
              <button onClick={saveHistory} style={styles.btnSave}>Guardar Historial</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { width: '100%', overflow: 'hidden', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', backgroundColor: '#16213e', fontFamily: "'Segoe UI', sans-serif" },
  tableWrapper: { width: '100%', maxWidth: '100%', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem', tableLayout: 'auto' },
  thead: { backgroundColor: '#0f3460', color: '#a0a0a0' },
  th: { padding: '5px 3px', textAlign: 'left', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #1a1a2e', wordWrap: 'break-word' },
  td: { padding: '4px 3px', color: '#e0e0e0', borderBottom: '1px solid #0f3460', wordWrap: 'break-word' },
  badge: { backgroundColor: 'rgba(76, 201, 240, 0.15)', color: '#4cc9f0', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85em', fontWeight: 'bold' },
  headerTransito: { color: '#f1c40f', borderBottom: '2px solid #f1c40f', backgroundColor: 'rgba(241, 196, 15, 0.05)' },
  headerAlerta: { color: '#e94560', borderBottom: '2px solid #e94560', backgroundColor: 'rgba(233, 69, 96, 0.1)' },
  // Estilos del Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  modalContent: { backgroundColor: '#16213e', padding: '25px', borderRadius: '8px', width: '600px', border: '1px solid #4cc9f0', boxShadow: '0 0 20px rgba(76, 201, 240, 0.2)' },
  grid12: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' },
  inputModal: { width: '100%', padding: '8px', background: '#1a1a2e', border: '1px solid #2a2a40', color: 'white', borderRadius: '4px', textAlign: 'center', fontSize: '1rem' },
  btnCancel: { padding: '8px 16px', background: 'transparent', border: '1px solid #a0a0a0', color: '#a0a0a0', borderRadius: '4px', cursor: 'pointer' },
  btnSave: { padding: '8px 16px', background: '#e94560', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
};