import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Building2, MapPin, Phone, Globe, Clock, Save, Eye, Mail, User, Map, FileText } from 'lucide-react';

// --- INTERFACES ---
interface Proveedor {
  id: number;
  nombre: string;
  pais: string;
  ejecutivo: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  website: string;
  notas: string;
  leadTime: number; 
}

export function ProveedoresTab() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  // Modales
  const [mostrarModal, setMostrarModal] = useState(false);
  const [verDetalle, setVerDetalle] = useState<Proveedor | null>(null); // Estado para el "Ojito"

  // Estado del Formulario
  const [formData, setFormData] = useState<Proveedor>({
    id: 0, nombre: '', pais: '', ejecutivo: '', email: '', telefono: '',
    direccion: '', ciudad: '', website: '', notas: '', leadTime: 0
  });

  // --- CARGAR DATOS ---
  const fetchProveedores = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/proveedores');
      if (res.ok) setProveedores(await res.json());
    } catch (error) {
      console.error("Error al cargar proveedores", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProveedores(); }, []);

  // --- HANDLERS ---
  const handleNuevo = () => {
    setFormData({
        id: 0, nombre: '', pais: '', ejecutivo: '', email: '', telefono: '',
        direccion: '', ciudad: '', website: '', notas: '', leadTime: 0
    });
    setMostrarModal(true);
  };

  const handleEditar = (prov: Proveedor) => {
    setFormData(prov);
    setMostrarModal(true);
    setVerDetalle(null); // Cerrar detalle si se abre edición
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const method = formData.id ? 'PUT' : 'POST';
        const url = formData.id ? `http://localhost:3000/api/proveedores/${formData.id}` : 'http://localhost:3000/api/proveedores';
        
        const dataToSend = { ...formData, leadTime: Number(formData.leadTime) || 0 };

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });

        if (res.ok) {
            setMostrarModal(false);
            fetchProveedores();
        }
    } catch (error) {
        alert('Error al guardar proveedor');
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este proveedor?')) return;
    try {
        await fetch(`http://localhost:3000/api/proveedores/${id}`, { method: 'DELETE' });
        fetchProveedores();
    } catch (error) { alert('Error al eliminar'); }
  };

  // --- FILTROS ---
  const proveedoresFiltrados = proveedores.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.pais.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="animate-fade-in pb-10">
      
      {/* 1. ENCABEZADO */}
      <div className="flex flex-wrap justify-between items-center mb-8 gap-5">
        <div>
            <h2 className="text-3xl font-bold text-white m-0">Directorio de Proveedores</h2>
            <p className="text-slate-400 mt-1">Administra tus socios comerciales y tiempos logísticos.</p>
        </div>
        
        <div className="flex gap-4 flex-1 justify-end">
          <div className="relative min-w-[250px]">
            <Search className="absolute left-4 top-3 text-slate-400" size={20} />
            <input 
              placeholder="Buscar proveedor o país..." 
              value={busqueda} 
              onChange={e => setBusqueda(e.target.value)} 
              className="w-full py-3 px-4 pl-12 rounded-full bg-slate-800 border border-slate-700 text-white focus:border-emerald-400 focus:outline-none transition-colors" 
            />
          </div>
          <button 
            onClick={handleNuevo} 
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-transform hover:scale-105 shadow-lg shadow-emerald-500/20"
          >
            <Plus size={20} /> Nuevo Socio
          </button>
        </div>
      </div>

      {/* 2. GRILLA DE TARJETAS */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
        {proveedoresFiltrados.map(prov => (
            <div key={prov.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-emerald-400 transition-all duration-200 group relative hover:-translate-y-1 shadow-lg">
                
                {/* BOTONES DE ACCIÓN (Ahora incluye el Ojito) */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button 
                        onClick={() => setVerDetalle(prov)} 
                        className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                        title="Ver Ficha Completa"
                    >
                        <Eye size={16} />
                    </button>
                    <button onClick={() => handleEditar(prov)} className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600 transition-colors"><Edit size={16} /></button>
                    <button onClick={() => handleEliminar(prov.id)} className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:text-red-400 hover:bg-slate-600 transition-colors"><Trash2 size={16} /></button>
                </div>

                {/* Icono y Título (Click también abre detalle) */}
                <div className="flex flex-col items-center text-center mb-6 cursor-pointer" onClick={() => setVerDetalle(prov)}>
                    <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700 mb-3 shadow-inner group-hover:scale-110 transition-transform duration-300">
                        <Building2 size={32} className="text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{prov.nombre}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-slate-400 text-sm">
                        <MapPin size={14} /> {prov.pais}
                    </div>
                </div>

                {/* Detalles Rápidos */}
                <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 text-sm cursor-pointer" onClick={() => setVerDetalle(prov)}>
                    <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                        <span className="text-slate-500 flex items-center gap-2"><Clock size={14}/> Lead Time</span>
                        <span className="text-emerald-400 font-bold">{prov.leadTime} días</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-500">Ejecutivo</span>
                        <span className="text-slate-200 truncate max-w-[120px]">{prov.ejecutivo || '-'}</span>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* 3. MODAL VER DETALLE (NUEVO) */}
      {verDetalle && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setVerDetalle(null)}>
            <div className="bg-slate-800 w-full max-w-3xl rounded-2xl border border-slate-600 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                
                {/* Header Modal */}
                <div className="bg-slate-900 p-6 flex gap-4 items-center border-b border-slate-700 shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-600 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg shadow-emerald-500/20">
                        <Building2 size={32} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-emerald-400 font-bold text-sm tracking-wide uppercase">Ficha de Proveedor</div>
                        <h2 className="text-3xl font-bold text-white leading-tight">{verDetalle.nombre}</h2>
                        <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                             <MapPin size={14} /> {verDetalle.ciudad ? `${verDetalle.ciudad}, ` : ''}{verDetalle.pais}
                        </div>
                    </div>
                    <button onClick={() => setVerDetalle(null)} className="ml-auto text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                </div>

                {/* Contenido Modal */}
                <div className="p-8 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* Columna Izquierda: Logística y Contacto */}
                        <div className="space-y-6">
                            <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700">
                                <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Clock size={16}/> Logística
                                </h3>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-sm">Tiempo de Reposición (Lead Time)</span>
                                    <span className="text-2xl font-bold text-white">{verDetalle.leadTime} <span className="text-sm font-normal text-slate-500">días</span></span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-700 pb-2">Contacto Comercial</h3>
                                <div className="flex items-start gap-3">
                                    <User className="text-slate-500 mt-0.5" size={18} />
                                    <div>
                                        <div className="text-sm text-slate-400">Ejecutivo de Cuenta</div>
                                        <div className="text-white font-medium">{verDetalle.ejecutivo || 'No registrado'}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Mail className="text-slate-500 mt-0.5" size={18} />
                                    <div>
                                        <div className="text-sm text-slate-400">Correo Electrónico</div>
                                        {verDetalle.email ? (
                                            <a href={`mailto:${verDetalle.email}`} className="text-emerald-400 hover:underline">{verDetalle.email}</a>
                                        ) : <span className="text-slate-600">No registrado</span>}
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="text-slate-500 mt-0.5" size={18} />
                                    <div>
                                        <div className="text-sm text-slate-400">Teléfono</div>
                                        <div className="text-white">{verDetalle.telefono || 'No registrado'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Columna Derecha: Dirección y Notas */}
                        <div className="space-y-6">
                             <div className="space-y-4">
                                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-700 pb-2">Ubicación y Web</h3>
                                <div className="flex items-start gap-3">
                                    <Map className="text-slate-500 mt-0.5" size={18} />
                                    <div>
                                        <div className="text-sm text-slate-400">Dirección Física</div>
                                        <div className="text-white text-sm leading-relaxed">{verDetalle.direccion || 'Sin dirección registrada'}</div>
                                        <div className="text-white text-sm">{verDetalle.ciudad}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Globe className="text-slate-500 mt-0.5" size={18} />
                                    <div>
                                        <div className="text-sm text-slate-400">Sitio Web</div>
                                        {verDetalle.website ? (
                                             <a href={verDetalle.website.startsWith('http') ? verDetalle.website : `https://${verDetalle.website}`} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline text-sm break-all">
                                                {verDetalle.website}
                                             </a>
                                        ) : <span className="text-slate-600">No registrado</span>}
                                    </div>
                                </div>
                            </div>

                            {verDetalle.notas && (
                                <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                                    <h3 className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <FileText size={16}/> Notas Internas
                                    </h3>
                                    <p className="text-amber-100/80 text-sm leading-relaxed italic">
                                        "{verDetalle.notas}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Modal */}
                <div className="bg-slate-900 p-4 flex justify-end gap-3 border-t border-slate-700 shrink-0">
                    <button onClick={() => setVerDetalle(null)} className="px-5 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors font-medium">Cerrar</button>
                    <button onClick={() => handleEditar(verDetalle)} className="px-5 py-2 rounded-lg bg-emerald-500 text-slate-900 hover:bg-emerald-600 transition-colors font-bold flex items-center gap-2">
                        <Edit size={16} /> Editar Datos
                    </button>
                </div>

            </div>
        </div>
      )}

      {/* 4. MODAL FORMULARIO (CREAR/EDITAR) */}
      {mostrarModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
             <div className="sticky top-0 bg-slate-800 p-6 border-b border-slate-700 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-white">{formData.id ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
              <button onClick={() => setMostrarModal(false)} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleGuardar} className="p-6 grid grid-cols-2 gap-6">
                <div className="col-span-2 text-emerald-400 text-xs font-bold border-b border-slate-700 pb-2 uppercase tracking-wider">Empresa & Logística</div>
                <div className="space-y-1"><label className="text-slate-400 text-xs font-bold uppercase">Nombre Empresa</label><input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-emerald-400 outline-none" /></div>
                <div className="space-y-1"><label className="text-slate-400 text-xs font-bold uppercase">País</label><input required value={formData.pais} onChange={e => setFormData({...formData, pais: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-emerald-400 outline-none" /></div>
                <div className="space-y-1"><label className="text-slate-400 text-xs font-bold uppercase">Lead Time (Días)</label><input type="number" required value={formData.leadTime} onChange={e => setFormData({...formData, leadTime: parseInt(e.target.value) || 0})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-emerald-400 outline-none" placeholder="Ej: 60" /></div>
                 <div className="space-y-1"><label className="text-slate-400 text-xs font-bold uppercase">Sitio Web</label><input value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-emerald-400 outline-none" /></div>

                <div className="col-span-2 text-emerald-400 text-xs font-bold border-b border-slate-700 pb-2 mt-4 uppercase tracking-wider">Contacto Comercial</div>
                <div className="space-y-1"><label className="text-slate-400 text-xs font-bold uppercase">Nombre Ejecutivo</label><input value={formData.ejecutivo} onChange={e => setFormData({...formData, ejecutivo: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-emerald-400 outline-none" /></div>
                 <div className="space-y-1"><label className="text-slate-400 text-xs font-bold uppercase">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-emerald-400 outline-none" /></div>
                <div className="space-y-1"><label className="text-slate-400 text-xs font-bold uppercase">Teléfono</label><input value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-emerald-400 outline-none" /></div>
                <div className="space-y-1"><label className="text-slate-400 text-xs font-bold uppercase">Ciudad</label><input value={formData.ciudad} onChange={e => setFormData({...formData, ciudad: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-emerald-400 outline-none" /></div>
                
                <div className="col-span-2 space-y-1"><label className="text-slate-400 text-xs font-bold uppercase">Dirección</label><input value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-emerald-400 outline-none" /></div>
                <div className="col-span-2 space-y-1"><label className="text-slate-400 text-xs font-bold uppercase">Notas</label><textarea value={formData.notas} onChange={e => setFormData({...formData, notas: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:border-emerald-400 outline-none h-20" /></div>

                <div className="col-span-2 flex justify-end gap-3 pt-6 border-t border-slate-700 mt-2">
                    <button type="button" onClick={() => setMostrarModal(false)} className="px-5 py-2.5 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600">Cancelar</button>
                    <button type="submit" className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20"><Save size={18} /> Guardar</button>
                </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}