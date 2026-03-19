import { supabase } from '../lib/supabase';
import { calcularBonoMensual } from '../utils/covasLogic';

/**
 * Obtiene y transforma toda la información de un colaborador para el reporte COVAS.
 */
export async function getColaboradorDataForReport(
  colaborador_id: string, 
  mes: string,
  anio: number
) {
  const nombreMesColumna = mes.toLowerCase().trim();
  
  try {
    // 1. Obtener datos del colaborador y su esquema (con join de tipo)
    const { data: col, error: errCol } = await supabase
      .from('colaboradores')
      .select('*, esquemas_pago(tipo)')
      .eq('id', colaborador_id)
      .single();

    if (errCol || !col) throw new Error("Colaborador no encontrado");

    // 2. Obtener Metas y Bonos de metas_indicadores
    const { data: rawIndicadores, error: errInd } = await supabase
      .from('metas_indicadores')
      .select(`id, nombre_indicador, tipo_indicador, ${nombreMesColumna}`)
      .eq('colaborador_id', colaborador_id)
      .eq('anio', anio);

    if (errInd) throw errInd;

    // 3. Obtener Alcance Real de la tabla alcance_real
    const { data: rawAlcance } = await supabase
      .from('alcance_real')
      .select(nombreMesColumna)
      .eq('colaborador_id', colaborador_id)
      .eq('anio', anio)
      .single();

    const valorAlcanceReal = rawAlcance ? Number((rawAlcance as any)[nombreMesColumna] || 0) : 0;

    // 4. Determinar Bono Objetivo / Monto Pactado
    const allIndicators = rawIndicadores || [];
    const bonoRegistro = allIndicators.find(i => {
      const t = i.tipo_indicador?.toLowerCase().trim();
      return t === 'bono' || t === 'comision' || t === 'comisión';
    });

    const montoPactado = bonoRegistro ? Number((bonoRegistro as any)[nombreMesColumna] || 0) : 0;

    // 5. Salario Mensual Base
    const { data: salarioRow } = await supabase
      .from('salarios_mensuales')
      .select(nombreMesColumna)
      .eq('colaborador_id', colaborador_id)
      .eq('anio', anio)
      .single();

    // 6. Aprobaciones
    const { data: aprob } = await supabase
      .from('pasos_aprobacion')
      .select('paso_captura, paso_validacion, paso_autorizacion, paso_direccion')
      .eq('colaborador_id', colaborador_id)
      .eq('mes', nombreMesColumna)
      .eq('anio', anio)
      .single();

    // 7. Otros Ingresos
    const { data: otrosIngresosRows } = await supabase
      .from('otros_ingresos')
      .select(`nombre_concepto, ${nombreMesColumna}`)
      .eq('colaborador_id', colaborador_id)
      .eq('anio', anio);

    const otrosIngresos = (otrosIngresosRows || []).map(oi => ({
      concepto: oi.nombre_concepto,
      monto: Number((oi as any)[nombreMesColumna] || 0)
    }));

    // 8. Escalones de Bonos
    let { data: escalones } = await supabase
      .from('escalones_bonos')
      .select('limite_inferior, limite_superior, porcentaje_pago')
      .eq('esquema_id', col.esquema_pago_id)
      .order('limite_inferior', { ascending: true });

    if (!escalones || escalones.length === 0) {
      console.warn(`[WARN] Sin escalones para ${col.nombre}. Usando fallback 90%->100%`);
      escalones = [
        { limite_inferior: 0, limite_superior: 89.9, porcentaje_pago: 0 },
        { limite_inferior: 90, limite_superior: 9999, porcentaje_pago: 100 }
      ];
    }

    // 9. Calcular resultados finales
    const metas = allIndicators.filter(i => {
      const t = i.tipo_indicador?.toLowerCase().trim();
      return t === 'meta' || t === 'comisión' || t === 'comision';
    });
    
    // Si no hay 'metas' explícitas, tratar otros como tales (excepto el bono mismo)
    const finalMetas = metas.length > 0 ? metas : allIndicators.filter(i => {
       const t = i.tipo_indicador?.toLowerCase().trim();
       return t !== 'bono';
    });

    const esquemaTipo = (col.esquemas_pago as any)?.tipo || 'porcentaje';

    const comisiones = finalMetas.map(m => {
      const metaVal = Number((m as any)[nombreMesColumna] || 0);
      
      let valorDeReferencia = 0;
      if (esquemaTipo === 'meses') {
        const fechaIngreso = new Date(col.fecha_ingreso);
        const hoy = new Date();
        valorDeReferencia = (hoy.getFullYear() - fechaIngreso.getFullYear()) * 12 + (hoy.getMonth() - fechaIngreso.getMonth());
      }

      const resultado = calcularBonoMensual(
        valorAlcanceReal,
        metaVal,
        montoPactado,
        col.tipo_colaborador || col.puesto,
        escalones,
        esquemaTipo,
        valorDeReferencia
      );

      return {
        nombre: m.nombre_indicador,
        meta: metaVal,
        alcance: valorAlcanceReal,
        cumplimiento: resultado.cumplimiento,
        aplicaBono: resultado.aplicaBono,
        bonoObjetivo: montoPactado,
        montoBono: resultado.montoBono 
      };
    });

    return {
      nombre: `${col.nombre} ${col.apellido_paterno || ''}`.trim(),
      matricula: col.matricula,
      puesto: col.puesto,
      sueldoBase: salarioRow ? Number((salarioRow as any)[nombreMesColumna] || 0) : 0,
      comisiones,
      otrosIngresos,
      esquema_tipo: esquemaTipo,
      aprobaciones: {
        paso_captura: !!aprob?.paso_captura,
        paso_validacion: !!aprob?.paso_validacion,
        paso_autorizacion: !!aprob?.paso_autorizacion,
        paso_direccion: !!aprob?.paso_direccion
      }
    };

  } catch (err) {
    console.error("Error financiero en getColaboradorDataForReport:", err);
    return null;
  }
}
