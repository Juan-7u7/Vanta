import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { UploadCloud, FileType, CheckCircle2, XCircle, Loader2, Download, Play, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Columnas obligatorias de la plantilla
const REQUIRED_COLS = [
  'matricula', 'nombre', 'apellido_paterno', 'apellido_materno', 
  'email', 'puesto', 'area', 'fecha_ingreso', 
  'unidad_negocio_nombre', 'perfil_nombre'
];

// Función para normalizar fechas al formato YYYY-MM-DD que espera la DB
const normalizarFecha = (val: string): string | null => {
  if (!val) return null;
  const s = val.trim();
  
  // Caso: YYYY-MM-DD (ya correcto)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  
  // Caso: DD/MM/YYYY
  const partsDMY = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (partsDMY) {
    const [_, d, m, y] = partsDMY;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Caso: MM/DD/YYYY (común en Excel versión USA)
  // Nota: Si es ambiguo (01/02/2024), asumimos DD/MM/YYYY por ser el estándar en LATAM
  
  return s; // Si no coincide, retornamos original para que la DB arroje su error controlado
};

interface ColaboradorRow {
  fila: number;
  matricula: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  email: string;
  puesto: string;
  area: string;
  fecha_ingreso: string;
  unidad_negocio_nombre: string;
  perfil_nombre: string;
  // Campos calculados para resolución:
  unidad_negocio_id?: number | null;
  perfil_id?: number | null;
  // Estado de validación
  valido: boolean;
  errores: string[];
}

export default function CargaMasiva() {
  const { user } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Catálogos
  const [unidades, setUnidades] = useState<{ id: number; nombre: string }[]>([]);
  const [perfiles, setPerfiles] = useState<{ id: number; nombre_perfil: string }[]>([]);
  const [emailsRegistrados, setEmailsRegistrados] = useState<Set<string>>(new Set());
  const [matriculasRegistradas, setMatriculasRegistradas] = useState<Set<string>>(new Set());

  // Estado del flujo
  const [datosPrevia, setDatosPrevia] = useState<ColaboradorRow[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progreso, setProgreso] = useState(0);
  
  // Resumen
  const [terminado, setTerminado] = useState(false);
  const [resultados, setResultados] = useState({ exitosos: 0, fallidos: 0, errores: [] as string[] });

  useEffect(() => {
    verificarAcceso();
  }, [user]);

  const verificarAcceso = async () => {
    if (!user) return;
    try {
      setCheckingAccess(true);
      const { data, error: err } = await supabase
        .from('colaboradores')
        .select(`perfil_id`)
        .eq('auth_id', user.id)
        .single();
        
      if (err) throw err;

      const { data: pfData } = await supabase
        .from('perfiles_seguridad')
        .select('nivel_acceso')
        .eq('id', data.perfil_id)
        .single();

      if (pfData?.nivel_acceso === 1) {
        setIsAdmin(true);
        cargarCatalogos();
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

  const cargarCatalogos = async () => {
    try {
      // Unidades
      const { data: udNeg } = await supabase.from('unidades_negocio').select('id, nombre');
      if (udNeg) setUnidades(udNeg);

      // Perfiles
      const { data: pfs } = await supabase.from('perfiles_seguridad').select('id, nombre_perfil');
      if (pfs) setPerfiles(pfs);

      // Correos y matrículas para validar duplicados
      const { data: cols } = await supabase.from('colaboradores').select('email, matricula');
      if (cols) {
        const setE = new Set<string>();
        const setM = new Set<string>();
        cols.forEach(c => {
          if (c.email) setE.add(c.email.toLowerCase().trim());
          if (c.matricula) setM.add(String(c.matricula).toLowerCase().trim());
        });
        setEmailsRegistrados(setE);
        setMatriculasRegistradas(setM);
      }
    } catch (e) {
      console.error("Error al descargar catálogos", e);
    }
  };

  // 1. Manejo del Archivo (React Dropzone)
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    
    setTerminado(false);
    setResultados({ exitosos: 0, fallidos: 0, errores: [] });
    setDatosPrevia([]);
    setIsProcessingFile(true);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false }) as any[];
        procesarFilas(rows);
      };
      reader.readAsBinaryString(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          procesarFilas(results.data as any[]);
        },
        error: (error) => {
          console.error("Error al leer CSV:", error);
          alert("No se pudo leer el archivo CSV.");
          setIsProcessingFile(false);
        }
      });
    }
  }, [unidades, perfiles, emailsRegistrados, matriculasRegistradas]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1 
  });

  // 2. Lógica de Procesamiento y Mapeo
  const procesarFilas = (rows: any[]) => {
    const preview: ColaboradorRow[] = [];
    const localEmails = new Set(emailsRegistrados); // Para validar duplicados DENTRO del mismo excel

    rows.forEach((rowRaw, index) => {
      // Normalizamos nombres de columnas minúsculas
      const row: any = {};
      Object.keys(rowRaw).forEach(k => {
        row[k.toLowerCase().trim()] = rowRaw[k];
      });

      const parsedRow: ColaboradorRow = {
        fila: index + 2, // Considerando Header en la fila 1
        matricula: String(row.matricula || '').trim(),
        nombre: String(row.nombre || '').trim(),
        apellido_paterno: String(row.apellido_paterno || '').trim(),
        apellido_materno: String(row.apellido_materno || '').trim(),
        email: String(row.email || '').trim().toLowerCase(),
        puesto: String(row.puesto || '').trim(),
        area: String(row.area || '').trim(),
        fecha_ingreso: normalizarFecha(String(row.fecha_ingreso || '').trim()) || '',
        unidad_negocio_nombre: String(row.unidad_negocio_nombre || '').trim(),
        perfil_nombre: String(row.perfil_nombre || '').trim(),
        valido: true,
        errores: []
      };

      // Validar Obligatorios
      if (!parsedRow.nombre || !parsedRow.apellido_paterno || !parsedRow.perfil_nombre || !parsedRow.unidad_negocio_nombre) {
        parsedRow.valido = false;
        parsedRow.errores.push("Faltan campos obligatorios (nombre, apellidos, unidad o perfil).");
      }

      // Validar Matrícula y Duplicados
      if (parsedRow.matricula) {
        if (matriculasRegistradas.has(parsedRow.matricula.toLowerCase())) {
          parsedRow.valido = false;
          parsedRow.errores.push(`La matrícula "${parsedRow.matricula}" ya existe en el sistema.`);
        }
      }

      // Validar Fecha
      if (parsedRow.fecha_ingreso && !/^\d{4}-\d{2}-\d{2}$/.test(parsedRow.fecha_ingreso)) {
         parsedRow.valido = false;
         parsedRow.errores.push("Formato de fecha inválido. Se recomienda YYYY-MM-DD (2024-01-25) o DD/MM/YYYY.");
      }

      // Validar Correo y Duplicados
      if (parsedRow.email) {
        const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (!emailRegex.test(parsedRow.email)) {
          parsedRow.valido = false;
          parsedRow.errores.push("Formato de email inválido.");
        } else if (localEmails.has(parsedRow.email)) {
          parsedRow.valido = false;
          parsedRow.errores.push("Email ya registrado o duplicado en el archivo.");
        } else {
          localEmails.add(parsedRow.email); // Reservarlo
        }
      }

      // Resolucion de IDs - Búsqueda en catálogo (Case Insensitive)
      const uId = unidades.find(u => u.nombre.toLowerCase() === parsedRow.unidad_negocio_nombre.toLowerCase())?.id;
      if (uId) {
        parsedRow.unidad_negocio_id = uId;
      } else {
        parsedRow.valido = false;
        parsedRow.errores.push(`Unidad de M. no encontrada: "${parsedRow.unidad_negocio_nombre}".`);
      }

      const pId = perfiles.find(p => p.nombre_perfil.toLowerCase() === parsedRow.perfil_nombre.toLowerCase())?.id;
      if (pId) {
        parsedRow.perfil_id = pId;
      } else {
        parsedRow.valido = false;
        parsedRow.errores.push(`Perfil no encontrado: "${parsedRow.perfil_nombre}".`);
      }

      preview.push(parsedRow);
    });

    setDatosPrevia(preview);
    setIsProcessingFile(false);
  };

  // 3. Descarga de Plantilla
  const descargarPlantilla = () => {
    // Generar CSV
    const csvContent = REQUIRED_COLS.join(",") + "\n" +
      "1001,Juan,Perez,Lopez,juan@empresa.com,Desarrollador,Sistemas,2024-01-15,Vanta Media,Administrador";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_colaboradores.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Inserción a Supabase
  const confirmarCarga = async () => {
    const batch = datosPrevia.filter(d => d.valido);
    if (batch.length === 0) {
      alert("No hay registros válidos para insertar.");
      return;
    }

    setIsUploading(true);
    setProgreso(0);

    let exito = 0;
    let fallbackFallos = 0;
    const errorsMsg = [];

    // Por seguridad, insertaremos en batches pequeños o uno a uno para atrapar errores individuales. 
    // Para 50-100 empleados, uno a uno es suficientemente rápido con asincronía y no rompe todo el lote.
    const CHUNK_SIZE = 10;
    for (let i = 0; i < batch.length; i += CHUNK_SIZE) {
      const chunk = batch.slice(i, i + CHUNK_SIZE);
      
      const toInsert = chunk.map(b => ({
        matricula: b.matricula,
        nombre: b.nombre,
        apellido_paterno: b.apellido_paterno,
        apellido_materno: b.apellido_materno,
        email: b.email,
        puesto: b.puesto,
        area: b.area,
        fecha_ingreso: b.fecha_ingreso || null,
        unidad_negocio_id: b.unidad_negocio_id,
        perfil_id: b.perfil_id,
        razon_social: 'VANTA MEDIA S.A. DE C.V.', // Valor general del sistema
        esta_activo: true
      }));

      const { error } = await supabase.from('colaboradores').insert(toInsert);
      
      if (error) {
        fallbackFallos += chunk.length;
        errorsMsg.push(`Error en lote ${i/CHUNK_SIZE + 1}: ${error.message}`);
      } else {
        exito += chunk.length;
      }

      setProgreso(Math.round(((i + chunk.length) / batch.length) * 100));
    }

    setResultados({
      exitosos: exito,
      fallidos: fallbackFallos + datosPrevia.filter(d => !d.valido).length,
      errores: errorsMsg
    });
    
    // Recargar correos para no dejar volver a insertarlos
    cargarCatalogos();
    
    setTerminado(true);
    setIsUploading(false);
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

  const listosParaInterar = datosPrevia.filter(d => d.valido).length;
  const conErrores = datosPrevia.filter(d => !d.valido).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <UploadCloud className="w-8 h-8 text-indigo-600 dark:text-indigo-500" />
            Carga Masiva de Colaboradores
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Importa múltiples colaboradores a la vez mediante archivo CSV o Excel.
          </p>
        </div>
        <button
          onClick={descargarPlantilla}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-800 dark:text-white font-bold rounded-xl border border-gray-200 dark:border-white/10 transition-colors"
        >
          <Download size={18} />
          Descargar Plantilla
        </button>
      </div>

      {!terminado && datosPrevia.length === 0 && (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-[32px] p-16 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200
            ${isDragActive 
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]' 
              : 'border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-indigo-400'}`}
        >
          <input {...getInputProps()} />
          <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mb-6 shadow-inner">
            {isProcessingFile 
              ? <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
              : <FileType className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            }
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            Arrastra tu archivo aquí
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
            Soporta formatos <strong className="text-gray-800 dark:text-gray-200">.CSV</strong> y <strong className="text-gray-800 dark:text-gray-200">.XLSX</strong>.<br/>Usa la plantilla para evitar errores de columnas.
          </p>
          <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95">
            Explorar Archivos
          </button>
        </div>
      )}

      {!terminado && datosPrevia.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-end gap-4 bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Previsualización de Datos</h3>
              <div className="flex items-center gap-4 mt-2 text-sm font-medium">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={16}/> {listosParaInterar} listos
                </span>
                <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <AlertCircle size={16}/> {conErrores} con errores
                </span>
              </div>
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => setDatosPrevia([])}
                disabled={isUploading}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Descartar Archivo
              </button>
              <button
                onClick={confirmarCarga}
                disabled={isUploading || listosParaInterar === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                Confirmar Carga
              </button>
            </div>
          </div>

          {/* Barra de Progreso */}
          {isUploading && (
            <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-3 mb-4 overflow-hidden">
              <div className="bg-indigo-600 h-3 rounded-full transition-all duration-300" style={{ width: `${progreso}%` }}></div>
            </div>
          )}

          {/* Tabla de Preview */}
          <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-100 dark:bg-[#1f2433] z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Fila</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Colaborador / Email</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Unidad de Negocio</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Perfil</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-center">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {datosPrevia.map((row, i) => (
                  <tr key={i} className={`hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors ${!row.valido ? 'bg-red-50/50 dark:bg-red-500/5' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{row.fila}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-800 dark:text-gray-200 text-xs">
                        {row.nombre} {row.apellido_paterno} {row.apellido_materno}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">{row.email || 'Sin email'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {row.unidad_negocio_nombre}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                      {row.perfil_nombre}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.valido ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-lg uppercase">
                          <CheckCircle2 size={12}/> Listo
                        </span>
                      ) : (
                        <div className="flex flex-col items-center gap-1 group relative">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-[10px] font-bold rounded-lg uppercase cursor-help">
                            <XCircle size={12}/> Error
                          </span>
                          <div className="hidden group-hover:block absolute bottom-full mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg shadow-lg z-20">
                            {row.errores.join(' • ')}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pantalla Final */}
      {terminado && (
        <div className="bg-white/50 dark:bg-black/20 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-[32px] p-10 text-center animate-in zoom-in-95">
          <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Carga Completada</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            El archivo ha sido procesado. Los colaboradores listados a continuación ya cuentan con acceso en el sistema y están disponibles en las nóminas.
          </p>
          
          <div className="flex justify-center gap-6 mb-8">
            <div className="px-6 py-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Creados con Éxito</p>
              <p className="text-4xl font-black text-emerald-700 dark:text-emerald-300">{resultados.exitosos}</p>
            </div>
            {(resultados.fallidos > 0) && (
              <div className="px-6 py-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                <p className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase mb-1">No insertados</p>
                <p className="text-4xl font-black text-red-700 dark:text-red-300">{resultados.fallidos}</p>
              </div>
            )}
          </div>

          {resultados.errores.length > 0 && (
            <div className="mb-8 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-left">
              <p className="text-xs font-bold text-red-500 uppercase mb-2 flex items-center gap-2">
                <AlertCircle size={14}/> Detalles de errores de base de datos:
              </p>
              <ul className="space-y-1">
                {resultados.errores.slice(0, 5).map((err, idx) => (
                  <li key={idx} className="text-[10px] text-red-400 font-mono">• {err}</li>
                ))}
                {resultados.errores.length > 5 && <li className="text-[10px] text-red-400 font-mono">... y {resultados.errores.length - 5} más</li>}
              </ul>
            </div>
          )}

          <button
            onClick={() => { setTerminado(false); setDatosPrevia([]); }}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-transform active:scale-95"
          >
            Subir Otro Archivo
          </button>
        </div>
      )}
    </div>
  );
}
