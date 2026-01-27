import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Truck, Save, X, Building2, MapPin, Globe, Phone, Mail } from 'lucide-react';

interface Proveedor {
  id: number;
  nombre: string;
  pais: string;
  ejecutivo?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  website?: string;
  notas?: string;
  leadTime: number; // NUEVO CAMPO
}

export function ProveedoresTab() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    pais: '',
    ejecutivo: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    website: '',
    notas: '',
    leadTime: 0
  });

  // Cargar datos al iniciar
  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/proveedores');
      const data = await response.json();
      setProveedores(data);
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId 
      ? `http://localhost:3000/api/proveedores/${editingId}`
      : 'http://localhost:3000/api/proveedores';
    
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            leadTime: Number(formData.leadTime) || 0
        }),
      });

      if (response.ok) {
        fetchProveedores();
        cerrarModal();
      }
    } catch (error) {
      console.error('Error guardando proveedor:', error);
    }
  };

  const handleEdit = (prov: Proveedor) => {
    setFormData({
      nombre: prov.nombre,
      pais: prov.pais,
      ejecutivo: prov.ejecutivo || '',
      email: prov.email || '',
      telefono: prov.telefono || '',
      direccion: prov.direccion || '',
      ciudad: prov.ciudad || '',
      website: prov.website || '',
      notas: prov.notas || '',
      leadTime: prov.leadTime || 0
    });
    setEditingId(prov.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;
    try {
      await fetch(`http://localhost:3000/api/proveedores/${id}`, { method: 'DELETE' });
      fetchProveedores();
    } catch (error) {
      console.error('Error eliminando:', error);
    }
  };

  const cerrarModal = () => {
      setShowForm(false);
      setEditingId(null);
      setFormData({ nombre: '', pais: '', ejecutivo: '', email: '', telefono: '', direccion: '', ciudad: '', website: '', notas: '', leadTime: 0 });
  };

  const filteredProveedores = proveedores.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.pais.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      {/* 1. ENCABEZADO */}
      <div className="flex flex-wrap justify-between items-center mb-8 gap-5">
        <div>
            <h2 className="text-3xl font-bold text-white m-0">Directorio de Proveedores</h2>
            <p className="text-slate-400 mt-1">Gestiona tus socios comerciales y tiempos de entrega (Lead Time).</p>
        </div>
        
        <div className="flex gap-4 flex-1 justify-end">
            <div className="relative min-w-[250px]">
                <Search className="absolute left-4 top-3 text-slate-400" size={20} />
                <input 
                  placeholder="🔍 Buscar empresa o país..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-3 px-4 pl-12 rounded-full bg-slate-800 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none transition-colors" 
                />
            </div>
            <button 
              onClick={() => setShowForm(true)}
              className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-cyan-500/20"
            >
              <Plus size={20} /> Nuevo Proveedor
            </button>
        </div>
      </div>

      {/* 2. TABLA DE PROVEEDORES */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-900 text-slate-400 uppercase text-xs tracking-wider">
            <tr>
              <th className="p-5 font-bold border-b border-slate-700">Empresa</th>
              <th className="p-5 font-bold border-b border-slate-700">País / Ubicación</th>
              <th className="p-5 font-bold border-b border-slate-700 text-cyan-400 flex items-center gap-2">
                <Truck size={14}/> Lead Time
              </th>
              <th className="p-5 font-bold border-b border-slate-700">Contacto</th>
              <th className="p-5 font-bold border-b border-slate-700 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Cargando datos...</td></tr>
            ) : filteredProveedores.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-slate-500">No se encontraron proveedores.</td></tr>
            ) : (
                filteredProveedores.map((prov) => (
                <tr key={prov.id} className="hover:bg-slate-700/50 transition-colors group">
                    <td className="p-5">
                        <div className="font-bold text-white text-lg flex items-center gap-2">
                            <Building2 size={18} className="text-slate-500" />
                            {prov.nombre}
                        </div>
                        {prov.website && (
                            <a href={prov.website} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline ml-7 flex items-center gap-1 mt-1">
                                <Globe size={10} /> {prov.website}
                            </a>
                        )}
                    </td>
                    <td className="p-5">
                        <div className="text-slate-300 font-medium">{prov.pais}</div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            {prov.ciudad && <><MapPin size={10}/> {prov.ciudad}</>}
                        </div>
                    </td>
                    <td className="p-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${prov.leadTime > 0 ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                            <Truck size={12} /> {prov.leadTime > 0 ? `${prov.leadTime} días` : 'Sin definir'}
                        </span>
                    </td>
                    <td className="p-5 text-sm text-slate-400 space-y-1">
                        {prov.ejecutivo && <div className="text-white font-medium">{prov.ejecutivo}</div>}
                        {prov.email && <div className="flex items-center gap-1.5 text-xs"><Mail size={12}/> {prov.email}</div>}
                        {prov.telefono && <div className="flex items-center gap-1.5 text-xs"><Phone size={12}/> {prov.telefono}</div>}
                    </td>
                    <td className="p-5 text-right">
                        <div className="flex justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(prov)} className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-cyan-500 hover:text-slate-900 transition-colors">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(prov.id)} className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-red-500 hover:text-white transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. MODAL FORMULARIO */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl border border-slate-700 shadow-2xl overflow-hidden">
            <div className="bg-slate-800 p-6 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                {editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h3>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-6">
              
              {/* Información Principal */}
              <div className="col-span-2 text-cyan-400 text-sm font-bold border-b border-slate-700 pb-2 uppercase tracking-wider">
                  Información Corporativa
              </div>

              <div className="col-span-2 md:col-span-1 space-y-1">
                <label className="text-slate-400 text-sm">Nombre Empresa</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-sm">País</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                  value={formData.pais}
                  onChange={e => setFormData({...formData, pais: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-sm">Ciudad</label>
                <input 
                  type="text"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                  value={formData.ciudad}
                  onChange={e => setFormData({...formData, ciudad: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-sm">Sitio Web</label>
                <input 
                  type="text"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                  value={formData.website}
                  onChange={e => setFormData({...formData, website: e.target.value})}
                  placeholder="ej: www.proveedor.com"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-slate-400 text-sm">Dirección</label>
                <input 
                  type="text"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                  value={formData.direccion}
                  onChange={e => setFormData({...formData, direccion: e.target.value})}
                />
              </div>

              {/* Logística - DESTACADO */}
              <div className="col-span-2 bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 mt-2">
                  <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold uppercase tracking-wider mb-2">
                      <Truck size={16}/> Configuración Logística
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium mb-1 block">Lead Time (Tiempo de Entrega)</label>
                    <div className="relative">
                        <input 
                        type="number" required min="0"
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 pl-3 text-white focus:border-cyan-500 focus:outline-none"
                        placeholder="0"
                        value={formData.leadTime}
                        onChange={e => setFormData({...formData, leadTime: Number(e.target.value)})}
                        />
                        <span className="absolute right-3 top-2.5 text-slate-500 text-sm">días</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Tiempo promedio desde la emisión de la OC hasta la recepción en bodega.</p>
                  </div>
              </div>

              {/* Contacto */}
              <div className="col-span-2 text-cyan-400 text-sm font-bold border-b border-slate-700 pb-2 mt-2 uppercase tracking-wider">
                  Contacto Directo
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-sm">Ejecutivo de Cuenta</label>
                <input 
                  type="text"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                  value={formData.ejecutivo}
                  onChange={e => setFormData({...formData, ejecutivo: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 text-sm">Teléfono</label>
                <input 
                  type="text"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                  value={formData.telefono}
                  onChange={e => setFormData({...formData, telefono: e.target.value})}
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-slate-400 text-sm">Email de Contacto</label>
                <input 
                  type="email"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-700">
                <button type="button" onClick={cerrarModal} className="px-5 py-2.5 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 font-medium transition-colors">Cancelar</button>
                <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 px-6 py-2.5 rounded-lg flex items-center gap-2 font-bold transition-colors shadow-lg shadow-cyan-500/20">
                  <Save size={18} /> Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}