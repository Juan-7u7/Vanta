import { useState, useEffect } from 'react';
import { Search, Loader2, ShieldCheck, User, Users, CheckCircle2, XCircle, KeySquare, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Perfil {
  id: number;
  nombre_perfil: string;
  nivel_acceso: number;
}

interface ColaboradorUsuario {
  id: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  email: string;
  esta_activo: boolean;
  auth_id: string | null;
  perfil_id: number | null;
  unidades_negocio: any;
  perfiles_seguridad: any;
}

export default function Usuarios() {
  const { user } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [usuarios, setUsuarios] = useState<ColaboradorUsuario[]>([]);
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados interactivos
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    verificarAcceso();
  }, [user]);

  // Cierra el dropdown al dar click afuera
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const verificarAcceso = async () => {
    if (!user) return;
    try {
      setCheckingAccess(true);
      const { data, error: err } = await supabase
        .from('colaboradores')
        .select(`
          perfiles_seguridad (
            nivel_acceso
          )
        `)
        .eq('auth_id', user.id)
        .single();
        
      if (err) throw err;

      // Según nueva regla, Nivel 1 es Administrador. Verificamos si es nivel 1:
      const pf: any = data?.perfiles_seguridad;
      // PostgREST puede devolver Object o Array dependiendo de las foreign keys.
      const nivel = Array.isArray(pf) ? (pf.length > 0 ? pf[0].nivel_acceso : null) : pf?.nivel_acceso;
      
      if (nivel === 1) {
        setIsAdmin(true);
        fetchData(); // Cargar datos si es admin
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Error al verificar acceso:', err);
      setIsAdmin(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Cargar Usuarios
      const { data: cols, error: errCols } = await supabase
        .from('colaboradores')
        .select(`
          id, nombre, apellido_paterno, apellido_materno, email, esta_activo, auth_id, perfil_id,
          unidades_negocio (nombre),
          perfiles_seguridad (nombre_perfil, nivel_acceso)
        `)
        .order('nombre');
      if (errCols) throw errCols;

      // 2. Cargar lista de perfiles disponibles para el dropdown
      const { data: pfs, error: errPfs } = await supabase
        .from('perfiles_seguridad')
        .select('id, nombre_perfil, nivel_acceso')
        .order('nivel_acceso');
      if (errPfs) throw errPfs;

      setUsuarios(cols || []);
      setPerfiles(pfs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (usuarioId: string, currentStatus: boolean) => {
    setUpdatingId(usuarioId);
    try {
      // Hacemos Type Casting porque PostgREST no lo adivina tan rápido
      const { error: err } = await supabase
        .from('colaboradores')
        .update({ esta_activo: !currentStatus })
        .eq('id', usuarioId);
        
      if (err) throw err;
      
      setUsuarios(prev => prev.map(u => u.id === usuarioId ? { ...u, esta_activo: !currentStatus } : u));
    } catch (err: any) {
      alert("Error al cambiar estado: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const changeProfile = async (usuarioId: string, newProfileId: number) => {
    setUpdatingId(usuarioId);
    try {
      const { error: err } = await supabase
        .from('colaboradores')
        .update({ perfil_id: newProfileId })
        .eq('id', usuarioId);
        
      if (err) throw err;
      
      // Actualizamos UI localmente para que sea rápido
      const selectedPf = perfiles.find(p => p.id === newProfileId);
      if (selectedPf) {
        setUsuarios(prev => prev.map(u => 
          u.id === usuarioId ? { 
            ...u, 
            perfil_id: newProfileId, 
            perfiles_seguridad: { nombre_perfil: selectedPf.nombre_perfil, nivel_acceso: selectedPf.nivel_acceso } 
          } : u
        ));
      }
    } catch (err: any) {
      alert("Error al cambiar perfil: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (checkingAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 mt-20">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-gray-500 font-medium">Verificando permisos de seguridad...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 mt-20 max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Acceso Denegado</h2>
        <p className="text-gray-500">Esta vista requiere un Perfil de Seguridad con Nivel 1 (Administrador de sistema).</p>
      </div>
    );
  }

  const filteredUsuarios = usuarios.filter(u => {
    const term = searchTerm.toLowerCase();
    const fullName = `${u.nombre} ${u.apellido_paterno} ${u.apellido_materno}`.toLowerCase();
    return fullName.includes(term) || (u.email && u.email.toLowerCase().includes(term));
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-500" />
            Usuarios y Accesos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestión de credenciales, perfiles de seguridad y estatus.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuario o correo..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none text-gray-700 dark:text-white transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium">
          Error: {error}
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-gray-500">Cargando usuarios...</p>
        </div>
      ) : (
        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Colaborador</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Unidad / Auth</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider min-w-[200px]">Perfil de Seguridad</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredUsuarios.map((u) => {
                  const pf: any = u.perfiles_seguridad;
                  const nivelAcceso = Array.isArray(pf) ? (pf.length > 0 ? pf[0].nivel_acceso : 10) : (pf?.nivel_acceso || 10);
                  const pfNombre = Array.isArray(pf) ? (pf.length > 0 ? pf[0].nombre_perfil : '') : (pf?.nombre_perfil || '');
                  const isHighPrivilege = nivelAcceso <= 3;
                  const hasAccount = !!u.auth_id;
                  
                  const un: any = u.unidades_negocio;
                  const unidadNombre = Array.isArray(un) ? (un.length > 0 ? un[0].nombre : 'General') : (un?.nombre || 'General');
                  
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                      
                      {/* Colaborador */}
                      <td className="px-6 py-4 align-middle">
                        <div>
                          <p className="font-bold text-gray-800 dark:text-white text-sm">
                            {u.nombre} {u.apellido_paterno}
                          </p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{u.email || 'Sin correo'}</p>
                        </div>
                      </td>

                      {/* Unidad y Credencial */}
                      <td className="px-6 py-4 align-middle">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                          {unidadNombre}
                        </p>
                        {hasAccount ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase rounded-md">
                            <CheckCircle2 size={12} />
                            Cuenta Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase rounded-md border border-amber-500/20">
                            <KeySquare size={12} />
                            Sin Credencial
                          </span>
                        )}
                      </td>

                      {/* Perfil (Dropdown Personalizado) */}
                      <td className="px-6 py-4 align-middle">
                        <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setOpenDropdown(openDropdown === u.id ? null : u.id)}
                            disabled={updatingId === u.id}
                            className={`w-full flex items-center justify-between pr-3 pl-3 py-2 rounded-xl text-[11px] font-bold outline-none border transition-all cursor-pointer ${
                              isHighPrivilege 
                              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30 ring-indigo-500 focus:ring-2' 
                              : 'bg-white dark:bg-black/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 ring-gray-400 focus:ring-2'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isHighPrivilege ? <ShieldCheck size={14} className="text-indigo-500 shrink-0" /> : <User size={14} className="text-gray-400 shrink-0" />}
                              <span className="truncate">{pfNombre ? `${pfNombre} (Niv. ${nivelAcceso})` : 'Seleccionar perfil...'}</span>
                            </div>
                            <ChevronDown size={14} className={isHighPrivilege ? 'text-indigo-500 shrink-0' : 'text-gray-400 shrink-0'} />
                          </button>

                          {/* Menú Desplegable Flotante */}
                          {openDropdown === u.id && (
                            <div className="absolute z-50 left-0 w-full mt-1 bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                              <div className="max-h-48 overflow-y-auto py-1">
                                {perfiles.map(pf => (
                                  <button
                                    key={pf.id}
                                    onClick={() => {
                                      changeProfile(u.id, pf.id);
                                      setOpenDropdown(null);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] font-medium transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${
                                      u.perfil_id === pf.id ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10' : 'text-gray-600 dark:text-gray-300'
                                    }`}
                                  >
                                    {pf.nivel_acceso <= 3 ? <ShieldCheck size={12} className={u.perfil_id === pf.id ? 'text-indigo-500 shrink-0' : 'text-gray-400 shrink-0'} /> : <User size={12} className={u.perfil_id === pf.id ? 'text-indigo-500 shrink-0' : 'text-gray-400 shrink-0'} />}
                                    <span className="truncate">{pf.nombre_perfil}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Estatus Toggle */}
                      <td className="px-6 py-4 align-middle text-center">
                        <button
                          disabled={updatingId === u.id}
                          onClick={() => toggleStatus(u.id, u.esta_activo)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${u.esta_activo ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/10'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${u.esta_activo ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </td>

                    </tr>
                  )
                })}
                {filteredUsuarios.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      No se encontraron usuarios activos en esa búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
