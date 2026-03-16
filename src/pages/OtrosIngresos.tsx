import { useState, useEffect } from 'react';
import { Edit2, Search, Filter, Plus, Loader2, ChevronDown, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import OtrosIngresosModal from '../components/OtrosIngresosModal';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;
const MESES_CORTOS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

interface OtroIngreso {
  id: number;
  colaborador_id: string;
  nombre_concepto: string;
  anio: number;
  enero: number; febrero: number; marzo: number; abril: number;
  mayo: number; junio: number; julio: number; agosto: number;
  septiembre: number; octubre: number; noviembre: number; diciembre: number;
  colaborador: {
    nombre: string;
    apellido_paterno: string;
    unidades_negocio: { nombre: string; color_hex?: string } | null;
  } | null | any;
}

// Grupo de un colaborador con todos sus conceptos
interface ColaboradorGroup {
  colaborador_id: string;
  nombreCompleto: string;
  unidad: string;
  items: OtroIngreso[];
}

const fmt = (val: number) =>
  (val ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const calcTotal = (r: OtroIngreso) =>
  MESES.reduce((s, m) => s + (r[m] || 0), 0);

// ─── Sub-fila de concepto ─────────────────────────────────────────────────────
function ConceptoRow({ item, onEdit }: { item: OtroIngreso; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const total = calcTotal(item);
  const mesActual = new Date().getMonth();
  const valorMes = item[MESES[mesActual]] || 0;

  return (
    <div className="border-b border-gray-50 dark:border-white/[0.03] last:border-0">
      {/* Fila del concepto */}
      <div
        className="pl-14 pr-5 py-3 flex items-center cursor-pointer hover:bg-sky-50/40 dark:hover:bg-sky-500/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Badge concepto */}
        <div className="flex-1 min-w-0 pr-4 flex items-center gap-2">
          <Tag size={12} className="text-sky-400 shrink-0" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
            {item.nombre_concepto}
          </span>
        </div>

        {/* Total anual — sm+ */}
        <div className="hidden sm:flex w-36 flex-col items-end gap-0.5 shrink-0">
          <span className="text-[12px] font-mono font-bold text-gray-700 dark:text-gray-300">
            {total > 0 ? fmt(total) : '—'}
          </span>
          <span className="text-[9px] text-gray-400 uppercase">Total anual</span>
        </div>

        {/* Mes actual — md+ */}
        <div className="hidden md:flex w-32 flex-col items-center shrink-0">
          <span className="text-[12px] font-mono font-bold text-gray-700 dark:text-gray-300">
            {valorMes > 0 ? fmt(valorMes) : '—'}
          </span>
          <span className="text-[9px] text-gray-400 uppercase">{MESES_CORTOS[mesActual]}</span>
        </div>

        {/* Acciones */}
        <div className="w-16 flex items-center justify-end gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 rounded-xl text-gray-400 hover:text-sky-600 hover:bg-sky-500/10 transition-all"
          >
            <Edit2 size={13} />
          </button>
          <div className={`p-1 rounded-xl text-gray-400 transition-all duration-200 ${expanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={14} />
          </div>
        </div>
      </div>

      {/* Panel expandido del concepto: grid de 12 meses */}
      {expanded && (
        <div className="pl-14 pr-5 pb-4 animate-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
            {MESES.map((mes, i) => {
              const val = item[mes] || 0;
              const isCurrent = i === mesActual;
              return (
                <div key={mes} className={`flex flex-col items-center p-2 rounded-xl border ${isCurrent
                  ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20'
                  : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'}`}>
                  <span className={`text-[9px] font-bold uppercase ${isCurrent ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400'}`}>
                    {MESES_CORTOS[i]}
                  </span>
                  <span className={`text-[11px] font-mono font-bold mt-0.5 ${val > 0
                    ? (isCurrent ? 'text-sky-700 dark:text-sky-300' : 'text-gray-700 dark:text-gray-300')
                    : 'text-gray-300 dark:text-gray-600'}`}>
                    {val > 0 ? val.toLocaleString('es-MX', { maximumFractionDigits: 0 }) : '—'}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Resumen móvil */}
          <div className="flex sm:hidden justify-between border-t border-gray-100 dark:border-white/5 pt-2 mt-2">
            <div>
              <p className="text-[9px] text-gray-400 uppercase font-bold">Total anual</p>
              <p className="text-sm font-mono font-bold text-gray-700 dark:text-gray-300">{total > 0 ? fmt(total) : '—'}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-gray-400 uppercase font-bold">Mes actual</p>
              <p className="text-sm font-mono font-bold text-gray-700 dark:text-gray-300">{valorMes > 0 ? fmt(valorMes) : '—'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Grupo por colaborador ────────────────────────────────────────────────────
function ColaboradorSection({
  group,
  onEdit,
  onAddConcepto,
}: {
  group: ColaboradorGroup;
  onEdit: (item: OtroIngreso) => void;
  onAddConcepto: (colaborador_id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const totalColaborador = group.items.reduce((s, i) => s + calcTotal(i), 0);

  return (
    <div className="border-b border-gray-100 dark:border-white/5 last:border-0">
      {/* Cabecera del colaborador */}
      <div
        className="px-5 py-3.5 flex items-center cursor-pointer hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        {/* Avatar */}
        <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-sky-500/20 to-sky-500/20 flex items-center justify-center border border-sky-500/10 mr-3">
          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
            {group.nombreCompleto.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </span>
        </div>

        {/* Nombre y unidad */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-800 dark:text-white">
              {group.nombreCompleto}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-bold">
              {group.items.length} concepto{group.items.length !== 1 ? 's' : ''}
            </span>
          </div>
          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase">
            {group.unidad || 'N/A'}
          </span>
        </div>

        {/* Total del colaborador */}
        <div className="hidden sm:flex flex-col items-end mr-6 shrink-0">
          <span className="text-sm font-mono font-bold text-gray-700 dark:text-gray-300">
            {totalColaborador > 0 ? fmt(totalColaborador) : '—'}
          </span>
          <span className="text-[9px] text-gray-400 uppercase">Total colaborador</span>
        </div>

        {/* Botón agregar concepto */}
        <button
          onClick={(e) => { e.stopPropagation(); onAddConcepto(group.colaborador_id); }}
          className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-all text-[11px] font-bold mr-3 shrink-0"
          title="Agregar concepto"
        >
          <Plus size={11} />
          Concepto
        </button>

        {/* Chevron colapsar */}
        <div className={`p-1.5 rounded-xl text-gray-400 transition-all duration-200 ${collapsed ? '-rotate-90' : ''}`}>
          <ChevronDown size={16} />
        </div>
      </div>

      {/* Conceptos del colaborador */}
      {!collapsed && (
        <div className="bg-gray-50/30 dark:bg-white/[0.01]">
          {group.items.map(item => (
            <ConceptoRow key={item.id} item={item} onEdit={() => onEdit(item)} />
          ))}
          {/* Botón "agregar concepto" visible en móvil dentro del grupo */}
          <div className="pl-14 pr-5 py-2 sm:hidden">
            <button
              onClick={() => onAddConcepto(group.colaborador_id)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-500 transition-colors"
            >
              <Plus size={12} /> Agregar concepto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function OtrosIngresos() {
  const [items, setItems] = useState<OtroIngreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ unidad: '', anio: '2026', concepto: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  // selectedItem puede tener datos parciales (colaborador_id pre-llenado al agregar concepto)
  const [selectedItem, setSelectedItem] = useState<Partial<OtroIngreso> | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('otros_ingresos')
        .select(`
          id, colaborador_id, nombre_concepto, anio,
          enero, febrero, marzo, abril, mayo, junio,
          julio, agosto, septiembre, octubre, noviembre, diciembre,
          colaborador:colaborador_id(
            nombre, apellido_paterno,
            unidades_negocio:unidad_negocio_id(nombre, color_hex)
          )
        `)
        .order('anio', { ascending: false });

      if (err) throw err;
      setItems(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado plano
  const filteredItems = items.filter(item => {
    const col = Array.isArray(item.colaborador) ? item.colaborador[0] : item.colaborador;
    const nombre = `${col?.nombre || ''} ${col?.apellido_paterno || ''}`;
    const matchesSearch = !searchTerm ||
      nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nombre_concepto.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnidad = !filters.unidad || col?.unidades_negocio?.nombre === filters.unidad;
    const matchesAnio = !filters.anio || item.anio?.toString() === filters.anio;
    const matchesConcepto = !filters.concepto || item.nombre_concepto === filters.concepto;
    return matchesSearch && matchesUnidad && matchesAnio && matchesConcepto;
  });

  // Agrupar por colaborador
  const grupos: ColaboradorGroup[] = Object.values(
    filteredItems.reduce((acc, item) => {
      const col = Array.isArray(item.colaborador) ? item.colaborador[0] : item.colaborador;
      const id = item.colaborador_id;
      if (!acc[id]) {
        acc[id] = {
          colaborador_id: id,
          nombreCompleto: `${col?.nombre || ''} ${col?.apellido_paterno || ''}`.trim(),
          unidad: col?.unidades_negocio?.nombre || '',
          items: [],
        };
      }
      acc[id].items.push(item);
      return acc;
    }, {} as Record<string, ColaboradorGroup>)
  ).sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));

  const unidades = Array.from(new Set(items.map(i => {
    const col = Array.isArray(i.colaborador) ? i.colaborador[0] : i.colaborador;
    return col?.unidades_negocio?.nombre;
  }).filter(Boolean)));

  const conceptos = Array.from(new Set(items.map(i => i.nombre_concepto).filter(Boolean)));
  const hasFilters = !!(filters.unidad || filters.concepto || filters.anio !== '2026');
  const totalGlobal = filteredItems.reduce((s, r) => s + calcTotal(r), 0);

  const openNew = (colaborador_id?: string) => {
    setSelectedItem(colaborador_id ? { colaborador_id } : null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Otros Ingresos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Despensa, puntualidad, bonos y demás conceptos adicionales
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!loading && filteredItems.length > 0 && (
            <div className="px-4 py-2 rounded-2xl bg-sky-500/10 border border-sky-500/20">
              <p className="text-[9px] font-bold text-sky-500 uppercase">Total filtrado</p>
              <p className="text-lg font-mono font-bold text-sky-600 dark:text-sky-400">{fmt(totalGlobal)}</p>
            </div>
          )}
          <button
            onClick={() => openNew()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl shadow-lg shadow-sky-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} />
            Nuevo Ingreso
          </button>
        </div>
      </div>

      {/* Barra de herramientas */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por colaborador o concepto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-sky-500/50 outline-none transition-all dark:text-white"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-5 py-3 border rounded-2xl transition-all ${showFilters
              ? 'bg-sky-600 border-sky-600 text-white shadow-lg shadow-sky-500/20'
              : 'bg-white dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
          >
            <Filter size={20} />
            Filtros
            {hasFilters && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1" />}
          </button>

          {showFilters && (
            <div className="absolute right-0 mt-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-[24px] shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-200" style={{ width: '290px' }}>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-2">
                  <span className="text-sm font-bold text-gray-800 dark:text-white">Filtros</span>
                  <button onClick={() => setFilters({ unidad: '', anio: '2026', concepto: '' })} className="text-[11px] font-bold text-sky-600 hover:text-sky-500 uppercase tracking-wider">
                    Limpiar
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Año</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['2024', '2025', '2026'].map(y => (
                      <button key={y} onClick={() => setFilters({ ...filters, anio: y })}
                        className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all border ${filters.anio === y
                          ? 'bg-sky-600 border-sky-600 text-white'
                          : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-500'}`}>
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Concepto</label>
                  <select value={filters.concepto} onChange={(e) => setFilters({ ...filters, concepto: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#1a1f2e] border border-gray-100 dark:border-white/5 rounded-2xl text-xs dark:text-white outline-none focus:ring-2 focus:ring-sky-500/50 cursor-pointer appearance-none">
                    <option value="">Todos los conceptos</option>
                    {conceptos.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Unidad de Negocio</label>
                  <select value={filters.unidad} onChange={(e) => setFilters({ ...filters, unidad: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#1a1f2e] border border-gray-100 dark:border-white/5 rounded-2xl text-xs dark:text-white outline-none focus:ring-2 focus:ring-sky-500/50 cursor-pointer appearance-none">
                    <option value="">Todas las unidades</option>
                    {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium">
          Error: {error}
        </div>
      )}

      {/* Lista agrupada */}
      <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[32px] shadow-xl overflow-hidden relative min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
            <p className="text-sm text-gray-500">Cargando ingresos...</p>
          </div>
        ) : grupos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Tag size={36} className="text-gray-300 dark:text-gray-600" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">No se encontraron registros</p>
            <button onClick={() => openNew()} className="mt-1 text-[11px] font-bold text-sky-600 hover:text-sky-500 underline underline-offset-2">
              + Agregar primer ingreso
            </button>
          </div>
        ) : (
          <>
            {/* Cabecera de columnas */}
            <div className="px-5 py-3 border-b border-gray-100 dark:border-white/5 flex items-center bg-gray-50/60 dark:bg-white/[0.02]">
              <div className="w-9 shrink-0 mr-3" />
              <div className="flex-1 pr-4">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Colaborador / Concepto
                </span>
              </div>
              <div className="hidden sm:flex w-36 justify-end shrink-0">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Anual</span>
              </div>
              <div className="hidden md:flex w-32 justify-center shrink-0">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mes Actual</span>
              </div>
              <div className="w-16 shrink-0" />
            </div>

            {/* Grupos */}
            {grupos.map(group => (
              <ColaboradorSection
                key={group.colaborador_id}
                group={group}
                onEdit={(item) => { setSelectedItem(item); setIsModalOpen(true); }}
                onAddConcepto={(cid) => openNew(cid)}
              />
            ))}
          </>
        )}
      </div>

      <OtrosIngresosModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedItem(null); }}
        onSuccess={fetchData}
        initialData={selectedItem}
      />
    </div>
  );
}
