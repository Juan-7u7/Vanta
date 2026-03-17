/** final 1.0 */
import { Edit2, Search, Filter, Plus, Loader2, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ColaboradorModal from '../components/ColaboradorModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

interface Colaborador {
  id: string;
  email: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  puesto: string;
  area: string;
  razon_social: string;
  esta_activo: boolean;
  unidades_negocio: { nombre: string; logo_url?: string } | null;
  jefe: { nombre: string; apellido_paterno: string } | null;
}

export default function Colaboradores() {
  const [searchTerm, setSearchTerm] = useState('');
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColaborador, setSelectedColaborador] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [colaboradorToDelete, setColaboradorToDelete] = useState<Colaborador | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Estados para filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    area: '',
    unidad: '',
    estado: 'todos' // todos, activo, baja
  });

  useEffect(() => {
    fetchColaboradores();
  }, []);

  const fetchColaboradores = async () => {
    try {
      setLoading(true);
      const { data, error: supabaseError } = await supabase
        .from('colaboradores')
        .select(`
          *,
          unidades_negocio:unidad_negocio_id(nombre, logo_url),
          jefe:jefe_id(nombre, apellido_paterno)
        `);

      if (supabaseError) throw supabaseError;
      setColaboradores(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!colaboradorToDelete) return;
    
    try {
      setDeleting(true);
      const { error: err } = await supabase
        .from('colaboradores')
        .delete()
        .eq('id', colaboradorToDelete.id);

      if (err) {
        if (err.code === '23503') {
          throw new Error("No se puede eliminar al colaborador porque tiene registros vinculados (ingresos, historial, etc). Se recomienda cambiar su estatus a 'Baja' en lugar de eliminarlo.");
        }
        throw err;
      }

      setIsDeleteModalOpen(false);
      setColaboradorToDelete(null);
      fetchColaboradores();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteConfirm = (col: Colaborador) => {
    setColaboradorToDelete(col);
    setIsDeleteModalOpen(true);
  };

  const filteredData = colaboradores.filter(col => {
    const matchesSearch = 
      `${col.nombre} ${col.apellido_paterno} ${col.apellido_materno}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      col.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      col.puesto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      col.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArea = !filters.area || col.area === filters.area;
    const matchesUnidad = !filters.unidad || col.unidades_negocio?.nombre === filters.unidad;
    const matchesEstado = 
      filters.estado === 'todos' || 
      (filters.estado === 'activo' && col.esta_activo) || 
      (filters.estado === 'baja' && !col.esta_activo);

    return matchesSearch && matchesArea && matchesUnidad && matchesEstado;
  });

  // Obtener áreas y unidades únicas para los selectores de filtro
  const areas = Array.from(new Set(colaboradores.map(c => c.area).filter(Boolean)));
  const unidades = Array.from(new Set(colaboradores.map(c => c.unidades_negocio?.nombre).filter(Boolean)));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Encabezado de página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Colaboradores</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona el personal y sus accesos al sistema</p>
        </div>
        <button 
          onClick={() => {
            setSelectedColaborador(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={20} />
          Nuevo Colaborador
        </button>
      </div>

      {/* Barra de herramientas */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nombre, puesto o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white"
          />
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-5 py-3 border rounded-2xl transition-all ${showFilters ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
          >
            <Filter size={20} />
            Filtros
            {(filters.area || filters.unidad || filters.estado !== 'todos') && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1" />
            )}
          </button>

          {/* Panel de Filtros Dropdown */}
          {showFilters && (
            <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-[24px] shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-2">
                  <span className="text-sm font-bold text-gray-800 dark:text-white">Filtros Avanzados</span>
                  <button 
                    onClick={() => setFilters({ area: '', unidad: '', estado: 'todos' })}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-500 uppercase tracking-wider"
                  >
                    Limpiar
                  </button>
                </div>

                {/* Filtro Estado */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Estado</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['todos', 'activo', 'baja'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilters({ ...filters, estado: status })}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase transition-all border ${filters.estado === status ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-500'}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro Área */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Área</label>
                  <select 
                    value={filters.area}
                    onChange={(e) => setFilters({ ...filters, area: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#1a1f2e] border border-gray-100 dark:border-white/5 rounded-2xl text-xs dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer appearance-none"
                  >
                    <option value="" className="bg-white dark:bg-[#1a1f2e] text-gray-900 dark:text-gray-300">Todas las áreas</option>
                    {areas.map(area => (
                      <option key={area} value={area} className="bg-white dark:bg-[#1a1f2e] text-gray-900 dark:text-gray-300">
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro Unidad */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Unidad de Negocio</label>
                  <select 
                    value={filters.unidad}
                    onChange={(e) => setFilters({ ...filters, unidad: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#1a1f2e] border border-gray-100 dark:border-white/5 rounded-2xl text-xs dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer appearance-none"
                  >
                    <option value="" className="bg-white dark:bg-[#1a1f2e] text-gray-900 dark:text-gray-300">Todas las unidades</option>
                    {unidades.map(unidad => (
                      <option key={unidad} value={unidad} className="bg-white dark:bg-[#1a1f2e] text-gray-900 dark:text-gray-300">
                        {unidad}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Estado de error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium">
          Error al cargar datos: {error}
        </div>
      )}

      {/* Contenedor de Datos */}
      <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[32px] shadow-xl overflow-hidden relative min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-500">Cargando colaboradores...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-gray-500 dark:text-gray-400">No se encontraron colaboradores</p>
          </div>
        ) : (
          <>
            {/* Vista Tarjetas — solo en móvil */}
            <div className="block md:hidden divide-y divide-gray-100 dark:divide-white/5">
              {filteredData.map((col) => (
                <div key={col.id} className="w-full overflow-hidden p-4 space-y-3 hover:bg-white/30 dark:hover:bg-white/5 transition-colors">
                  {/* Fila 1: Avatar + nombre + estado */}
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/10 shadow-inner flex items-center justify-center overflow-hidden">
                        {col.unidades_negocio?.logo_url ? (
                          <img src={col.unidades_negocio.logo_url} alt="Logo" className="w-full h-full object-contain p-1.5" />
                        ) : (
                          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                            {col.nombre?.[0]}{col.apellido_paterno?.[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-gray-800 dark:text-white truncate">
                          {col.nombre} {col.apellido_paterno} {col.apellido_materno}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400 uppercase">#{col.id.split('-')[0]}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${col.esta_activo ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                        <span className="text-[9px] font-bold text-gray-400 uppercase">{col.esta_activo ? 'Activo' : 'Baja'}</span>
                      </div>
                      <button
                        onClick={() => { setSelectedColaborador(col); setIsModalOpen(true); }}
                        className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-500/10 transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(col)}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {/* Fila 2: Detalles en grid */}
                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Puesto</p>
                      <p className="text-gray-700 dark:text-gray-300 font-medium">{col.puesto || 'N/A'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Área</p>
                      <p className="text-gray-700 dark:text-gray-300">{col.area || 'General'}</p>
                    </div>
                    <div className="space-y-0.5 col-span-2">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Email</p>
                      <p className="text-gray-500 dark:text-gray-400 truncate">{col.email}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Jefe</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {col.jefe ? `${col.jefe.nombre} ${col.jefe.apellido_paterno[0]}.` : 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Unidad</p>
                      <p className="text-blue-600 dark:text-blue-400 font-bold uppercase text-[11px]">
                        {col.unidades_negocio?.nombre || 'General'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Vista Tabla — solo en desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/5">
                    <th className="w-[25%] px-4 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Colaborador</th>
                    <th className="w-[18%] px-4 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Posición</th>
                    <th className="w-[20%] px-4 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Contacto / Jefe</th>
                    <th className="w-[17%] px-4 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Organización</th>
                    <th className="w-[10%] px-4 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Estado</th>
                    <th className="w-[10%] px-4 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                  {filteredData.map((col) => (
                    <tr key={col.id} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 shrink-0 rounded-xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/10 shadow-inner flex items-center justify-center overflow-hidden">
                            {col.unidades_negocio?.logo_url ? (
                              <img src={col.unidades_negocio.logo_url} alt="Logo" className="w-full h-full object-contain p-1.5" />
                            ) : (
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                {col.nombre?.[0]}{col.apellido_paterno?.[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                              {col.nombre} {col.apellido_paterno}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400 uppercase">#{col.id.split('-')[0]}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300 truncate">{col.puesto || 'Sin Puesto'}</span>
                          <span className="text-[11px] text-gray-500">{col.area || 'General'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[12px] text-gray-600 dark:text-gray-400 truncate">{col.email}</span>
                          <span className="text-[10px] text-gray-500 mt-0.5">
                            Reporta a: <span className="font-medium text-gray-700 dark:text-gray-300">
                              {col.jefe ? `${col.jefe.nombre} ${col.jefe.apellido_paterno[0]}.` : 'N/A'}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 truncate">{col.razon_social || 'N/A'}</span>
                          <span className="text-[10px] font-bold text-blue-500/70 uppercase">{col.unidades_negocio?.nombre || 'General'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-2.5 h-2.5 rounded-full ${col.esta_activo ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`} />
                          <span className="text-[10px] font-medium text-gray-400 uppercase">{col.esta_activo ? 'Activo' : 'Baja'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center gap-1 group/actions">
                          <div className="relative group/edit">
                            <button
                              onClick={() => { setSelectedColaborador(col); setIsModalOpen(true); }}
                              className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold rounded-lg opacity-0 invisible group-hover/edit:opacity-100 group-hover/edit:visible transition-all whitespace-nowrap shadow-xl z-20">
                              Editar
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                            </div>
                          </div>

                          <div className="relative group/delete">
                            <button
                              onClick={() => openDeleteConfirm(col)}
                              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold rounded-lg opacity-0 invisible group-hover/delete:opacity-100 group-hover/delete:visible transition-all whitespace-nowrap shadow-xl z-20">
                              Eliminar
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-600" />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <ColaboradorModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedColaborador(null);
        }}
        onSuccess={fetchColaboradores}
        initialData={selectedColaborador}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="¿Eliminar Colaborador?"
        message={`Esta acción eliminará a ${colaboradorToDelete?.nombre} ${colaboradorToDelete?.apellido_paterno} permanentemente. Asegúrate de que no tenga registros financieros activos vinculados.`}
      />
    </div>
  );
}
