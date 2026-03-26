/** final 2.1 - Auditoría Lógica Financiera */
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatCurrency, aplicarAjustePorGrupo } from '../utils/covasLogic';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#FFFFFF', color: '#1F2937' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  brand: { fontSize: 14, fontWeight: 'black', color: '#111827' },
  colaboradorInfo: { textAlign: 'right' },
  nombre: { fontSize: 16, fontWeight: 'bold' },
  puesto: { fontSize: 9, color: '#6B7280' },
  periodo: { fontSize: 8, fontWeight: 'bold', color: '#3B82F6', textTransform: 'uppercase' },

  // CARDS
  cardsContainer: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  card: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#F9FAFB', borderWeight: 1, borderColor: '#F3F4F6' },
  cardLabel: { fontSize: 7, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase', marginBottom: 4 },
  cardValue: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  cardValueBlue: { fontSize: 14, fontWeight: 'bold', color: '#2563EB' },

  // TABLES
  sectionTitle: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 2 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 4, marginBottom: 4 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6', paddingVertical: 4, alignItems: 'center' },
  columnHeader: { fontSize: 7, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase' },
  cell: { fontSize: 8, color: '#374151' },
  cellBold: { fontSize: 8, fontWeight: 'bold' },
  cellGreen: { fontSize: 8, fontWeight: 'bold', color: '#059669' },

  colNombre: { width: '28%' },
  colEsquema: { width: '12%' },
  colMeta: { width: '15%', textAlign: 'right' },
  colAlcance: { width: '15%', textAlign: 'right' },
  colPct: { width: '15%', textAlign: 'right' },
  colBono: { width: '15%', textAlign: 'right' },

  // AJUSTE & OTROS
  highlightRow: { flexDirection: 'row', backgroundColor: '#F0F9FF', padding: 8, marginTop: 4, borderRadius: 6 },
  highlightLabel: { flex: 1, fontSize: 8, fontWeight: 'bold', color: '#0369A1' },
  highlightValue: { fontSize: 8, fontWeight: 'bold', color: '#0369A1' },

  // FIRMAS
  signaturesContainer: { marginTop: 30, flexDirection: 'row', gap: 8 },
  signatureBox: { flex: 1, height: 70, borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 8, padding: 6, justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FAFAFA' },
  signatureTitle: { fontSize: 6, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase' },
  statusBadge: { fontSize: 7, fontWeight: 'bold', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  statusApproved: { color: '#059669', backgroundColor: '#D1FAE5' },
  statusPending: { color: '#6B7280', backgroundColor: '#F3F4F6' },

  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', borderTopWidth: 0.5, borderTopColor: '#F3F4F6', paddingTop: 10 },
  footerText: { fontSize: 7, color: '#9CA3AF' }
});

const Signature = ({ title, status }: { title: string, status: boolean }) => (
  <View style={styles.signatureBox}>
    <Text style={styles.signatureTitle}>{title}</Text>
    <View style={[styles.statusBadge, status ? styles.statusApproved : styles.statusPending]}>
      <Text>{status ? 'APROBADO' : 'PENDIENTE'}</Text>
    </View>
    <Text style={{ fontSize: 6, color: '#9CA3AF' }}>{status ? new Date().toLocaleDateString('es-MX') : ''}</Text>
  </View>
);

export const CovasDocument = ({ data, periodo }: { data: any[], periodo: { mes: string, anio: number } }) => {
  console.log('--- AUDITORÍA FINANCIERA COVAS ---');
  return (
    <Document title={`COVAS_${periodo.mes.toUpperCase()}_${periodo.anio}`}>
      {data.map((col, idx) => {
        const sumaBonos = col.comisiones.reduce((acc: number, c: any) => acc + (c.montoBono || 0), 0);
        const sumaOtros = (col.otrosIngresos || []).reduce((acc: number, o: any) => acc + (o.monto || 0), 0);
        
        const resAjuste = aplicarAjustePorGrupo(col.comisiones.map((c: any) => ({
          montoBono: c.montoBono,
          cumplimiento: c.cumplimiento
        })));

        const percepcionTotal = col.sueldoBase + sumaBonos + sumaOtros + resAjuste.ajuste;

        console.log(`Colaborador: ${col.nombre}`);
        console.log(` > Base: ${col.sueldoBase}`);
        console.log(` > Bonos: ${sumaBonos}`);
        console.log(` > Otros: ${sumaOtros}`);
        console.log(` > Ajuste: ${resAjuste.ajuste} (${resAjuste.motivo})`);
        console.log(` > TOTAL: ${percepcionTotal}`);

        return (
          <Page key={idx} size="A4" style={styles.page}>
            <View style={styles.header}>
              <View>
                <Text style={styles.brand}>VANTA MEDIA</Text>
                <Text style={{ fontSize: 7, color: '#9CA3AF' }}>PLAN DE COMPENSACIÓN VARIABLE</Text>
              </View>
              <View style={styles.colaboradorInfo}>
                <Text style={styles.nombre}>{col.nombre}</Text>
                <Text style={styles.puesto}>{col.puesto} | {col.matricula}</Text>
                <Text style={styles.periodo}>{periodo.mes} {periodo.anio}</Text>
              </View>
            </View>

            <View style={styles.cardsContainer}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Sueldo Base</Text>
                <Text style={styles.cardValue}>{formatCurrency(col.sueldoBase)}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Bonos Ganados</Text>
                <Text style={styles.cardValue}>{formatCurrency(sumaBonos + resAjuste.ajuste)}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Otros Ingresos</Text>
                <Text style={styles.cardValue}>{formatCurrency(sumaOtros)}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Percepción Total</Text>
                <Text style={styles.cardValueBlue}>{formatCurrency(percepcionTotal)}</Text>
              </View>
            </View>

            {/* TABLA INDICADORES */}
            <View>
              <Text style={styles.sectionTitle}>Indicadores de Desempeño</Text>
              <View style={styles.tableHeader}>
                <View style={styles.colNombre}><Text style={styles.columnHeader}>Indicador</Text></View>
                <View style={styles.colEsquema}><Text style={styles.columnHeader}>Esquema</Text></View>
                <View style={styles.colMeta}><Text style={styles.columnHeader}>Meta</Text></View>
                <View style={styles.colAlcance}><Text style={styles.columnHeader}>Alcance</Text></View>
                <View style={styles.colPct}><Text style={styles.columnHeader}>% Cumpl.</Text></View>
                <View style={styles.colBono}><Text style={styles.columnHeader}>Bono</Text></View>
              </View>
              {col.comisiones.map((c: any, i: number) => (
                <View key={i} style={styles.tableRow}>
                  <View style={styles.colNombre}><Text style={styles.cell}>{c.nombre}</Text></View>
                  <View style={styles.colEsquema}><Text style={styles.cell}>{(c.esquema_tipo || 'porcentaje').toUpperCase()}</Text></View>
                  <View style={styles.colMeta}><Text style={styles.cell}>{c.meta.toLocaleString('es-MX')}</Text></View>
                  <View style={styles.colAlcance}><Text style={styles.cell}>{c.alcance.toLocaleString('es-MX')}</Text></View>
                  <View style={styles.colPct}>
                    <Text style={[styles.cell, c.cumplimiento >= 100 ? styles.cellGreen : {}]}>
                      {c.cumplimiento.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.colBono}><Text style={styles.cellBold}>{formatCurrency(c.montoBono)}</Text></View>
                </View>
              ))}
              {resAjuste.ajuste !== 0 && (
                <View style={styles.highlightRow}>
                  <Text style={styles.highlightLabel}>AJUSTE GRUPAL: {resAjuste.motivo}</Text>
                  <Text style={styles.highlightValue}>{resAjuste.ajuste > 0 ? '+' : ''}{formatCurrency(resAjuste.ajuste)}</Text>
                </View>
              )}
            </View>

            {/* OTROS INGRESOS DETALLE */}
            {col.otrosIngresos && col.otrosIngresos.length > 0 && (
              <View style={{ marginTop: 15 }}>
                <Text style={styles.sectionTitle}>Desglose de Otros Ingresos</Text>
                {col.otrosIngresos.map((o: any, i: number) => (
                  <View key={i} style={styles.tableRow}>
                    <View style={{ flex: 1 }}><Text style={styles.cell}>{o.concepto}</Text></View>
                    <View style={{ width: 100, textAlign: 'right' }}><Text style={styles.cellBold}>{formatCurrency(o.monto)}</Text></View>
                  </View>
                ))}
              </View>
            )}

            <View style={{ marginTop: 'auto' }}>
              <Text style={styles.sectionTitle}>Aprobaciones</Text>
              <View style={styles.signaturesContainer}>
                <Signature title="Captura" status={col.aprobaciones.paso_captura} />
                <Signature title="Validación" status={col.aprobaciones.paso_validacion} />
                <Signature title="Autorización" status={col.aprobaciones.paso_autorizacion} />
                <Signature title="Dirección" status={col.aprobaciones.paso_direccion} />
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Comprobante oficial de compensación variable. Confidencial Vanta Media 2026.
              </Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};
