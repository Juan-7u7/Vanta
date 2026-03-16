import { Page, Text, View, Document, StyleSheet, Image, Svg, Defs, LinearGradient, Stop, Rect } from '@react-pdf/renderer';
import React from 'react';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  // Portada
  coverPage: {
    padding: 0,
    backgroundColor: '#1a1f2e',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
  },
  mainTitle: { fontSize: 70, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 14, letterSpacing: 4, opacity: 0.8 },

  // Índice (Sección 2)
  indexPage: {
    padding: 50,
    fontFamily: 'Helvetica',
  },
  indexTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#1a1f2e',
  },
  indexRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eeeeee',
    alignItems: 'center',
  },
  indexCol1: { width: '25%', fontSize: 9, color: '#666' },
  indexCol2: { width: '45%', fontSize: 9, fontWeight: 'bold' },
  indexCol3: { width: '30%', fontSize: 9 },
  indexHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 5,
  },

  // Separador (Sección 3)
  separatorPage: {
    backgroundColor: '#6366f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  separatorTitle: {
    fontSize: 40,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
  },
  
  // Header Cédula (Sección 4 - Imagen 2 style)
  headerTable: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 5,
    marginBottom: 5,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 13, fontWeight: 'bold' },
  headerYear: { fontSize: 13, fontWeight: 'bold' },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoBlock: { flexDirection: 'column', width: '48%' },
  infoLabel: { fontSize: 7.5, color: '#666', textTransform: 'uppercase', marginBottom: 2 },
  infoValue: { fontSize: 10, fontWeight: 'bold' },

  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    minHeight: 16,
    alignItems: 'center',
  },
  tableHeaderBg: { backgroundColor: '#f0f0f0' },
  tableBlueBg: { backgroundColor: '#dae8fc' },
  
  cell: {
    paddingHorizontal: 4,
    fontSize: 7,
    borderRightWidth: 1,
    borderRightColor: '#000',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  cellNoBorder: { borderRightWidth: 0 },
  textRight: { textAlign: 'right' },
  textCenter: { textAlign: 'center' },
  bold: { fontWeight: 'bold' },

  notesSection: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 8,
  },
  noteText: {
    fontSize: 6.5,
    color: '#444',
    marginBottom: 2,
    lineHeight: 1.2,
  },

  signatureSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '30%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginBottom: 4,
  },
  signatureLabel: { fontSize: 7, textAlign: 'center' },
});

const fmt = (val: number) => 
  (val || 0).toLocaleString('es-MX', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const PESOS_Q = [0.09, 0.10, 0.28, 0.53]; 

const RANGOS_BASE = [
  { alcance: '90.00% - 91.99%', pct_bono: 0.70, total: 400.3 },
  { alcance: '92.00% - 94.99%', pct_bono: 0.80, total: 457.5 },
  { alcance: '95.00% - 96.99%', pct_bono: 0.90, total: 514.7 },
  { alcance: '100.00%', pct_bono: 1.00, total: 571.9 },
  { alcance: '110.00%', pct_bono: 1.30, total: 743.4 },
  { alcance: '150.00% - 200.00%', pct_bono: 2.00, total: 1143.7 },
];

export function CovasPDF({ colaboradores, anio }: any) {
  // Obtener unidades únicas para los separadores
  const unidades = Array.from(new Set(colaboradores.map((c: any) => c.unidades_negocio?.nombre)));

  return (
    <Document>
      {/* SECCIÓN 1: Portada */}
      <Page size="A4" style={styles.coverPage}>
        <Svg height="100%" width="100%" style={{ position: 'absolute' }}>
          <Defs>
            <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#4f46e5" />
              <Stop offset="100%" stopColor="#06b6d4" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#grad)" />
        </Svg>
        <Image src="/logo-avalanz-blanco.png" style={{ width: 80, marginBottom: 20 }} />
        <Text style={styles.mainTitle}>COVAS</Text>
        <Text style={styles.subtitle}>PLAN DE COMPENSACIÓN VARIABLE {anio}</Text>
      </Page>

      {/* SECCIÓN 2: Índice de Colaboradores */}
      <Page size="A4" style={styles.indexPage}>
        <Text style={styles.indexTitle}>Índice de Colaboradores</Text>
        
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 2 }}>
          <Text style={[styles.indexCol1, styles.indexHeaderText]}>Unidad</Text>
          <Text style={[styles.indexCol2, styles.indexHeaderText]}>Colaborador</Text>
          <Text style={[styles.indexCol3, styles.indexHeaderText]}>Puesto</Text>
        </View>

        {colaboradores.map((col: any, i: number) => (
          <View key={i} style={styles.indexRow}>
            <Text style={styles.indexCol1}>{col.unidades_negocio?.nombre}</Text>
            <Text style={styles.indexCol2}>{col.nombre} {col.apellido_paterno}</Text>
            <Text style={styles.indexCol3}>{col.puesto}</Text>
          </View>
        ))}
      </Page>

      {/* SECCIÓN 3 y 4: Separadores y Cédulas */}
      {unidades.map((unidad: any, uIdx: number) => (
        <React.Fragment key={uIdx}>
          {/* Separador de Unidad */}
          <Page size="A4" style={styles.separatorPage}>
             <Svg height="100%" width="100%" style={{ position: 'absolute' }}>
                <Defs>
                  <LinearGradient id={`grad${uIdx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#6366f1" />
                    <Stop offset="100%" stopColor="#4338ca" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill={`url(#grad${uIdx})`} />
              </Svg>
             <Image src="/logo-avalanz-blanco.png" style={{ width: 80, marginBottom: 10 }} />
             <Text style={styles.separatorTitle}>{unidad?.toUpperCase()}</Text>
          </Page>

          {/* Cédulas de esta Unidad */}
          {colaboradores
            .filter((c: any) => c.unidades_negocio?.nombre === unidad)
            .map((col: any, cIdx: number) => (
            <Page key={cIdx} size="A4" style={styles.page}>
              <View style={styles.headerTable}>
                <Text style={styles.headerTitle}>PLAN DE COMPENSACIÓN VARIABLE</Text>
                <Text style={styles.headerYear}>{anio}</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>Puesto</Text>
                  <Text style={styles.infoValue}>{col.puesto?.toUpperCase()}</Text>
                  <Text style={[styles.infoLabel, { marginTop: 5 }]}>Sueldo Fijo Mensualizado:</Text>
                  <Text style={styles.infoValue}>$ {fmt(col.sueldoMensual)}</Text>
                </View>
                <View style={[styles.infoBlock, { alignItems: 'flex-end' }]}>
                  <Text style={styles.infoLabel}>Colaborador</Text>
                  <Text style={styles.infoValue}>{col.nombre} {col.apellido_paterno} {col.apellido_materno}</Text>
                  <Text style={[styles.infoLabel, { marginTop: 5 }]}>Matrícula</Text>
                  <Text style={styles.infoValue}>{col.matricula}</Text>
                </View>
              </View>

              {/* Sueldo Base Anual */}
              <View style={styles.table}>
                 <View style={[styles.tableRow, styles.tableHeaderBg]}>
                   <View style={[styles.cell, { width: '40%' }]}><Text style={styles.bold}>CONCEPTO</Text></View>
                   <View style={[styles.cell, { width: '12%' }]}><Text style={[styles.bold, styles.textCenter]}>1Q</Text></View>
                   <View style={[styles.cell, { width: '12%' }]}><Text style={[styles.bold, styles.textCenter]}>2Q</Text></View>
                   <View style={[styles.cell, { width: '12%' }]}><Text style={[styles.bold, styles.textCenter]}>3Q</Text></View>
                   <View style={[styles.cell, { width: '12%' }]}><Text style={[styles.bold, styles.textCenter]}>4Q</Text></View>
                   <View style={[styles.cell, { width: '12%', borderRightWidth: 0 }]}><Text style={[styles.bold, styles.textCenter]}>TOTAL</Text></View>
                 </View>
                 <View style={styles.tableRow}>
                   <View style={[styles.cell, { width: '40%' }]}><Text>SUELDO BASE</Text></View>
                   <View style={[styles.cell, { width: '12%' }]}><Text style={styles.textRight}>{fmt(col.sueldoMensual * 3)}</Text></View>
                   <View style={[styles.cell, { width: '12%' }]}><Text style={styles.textRight}>{fmt(col.sueldoMensual * 3)}</Text></View>
                   <View style={[styles.cell, { width: '12%' }]}><Text style={styles.textRight}>{fmt(col.sueldoMensual * 3)}</Text></View>
                   <View style={[styles.cell, { width: '12%' }]}><Text style={styles.textRight}>{fmt(col.sueldoMensual * 3)}</Text></View>
                   <View style={[styles.cell, { width: '12%', borderRightWidth: 0 }]}><Text style={[styles.textRight, styles.bold]}>{fmt(col.sueldoMensual * 12)}</Text></View>
                 </View>
              </View>

              {/* Tabla de Estructura de Bono Reconstruida */}
              <View style={[styles.table, { marginBottom: 5 }]}>
                <View style={[styles.tableRow, styles.tableBlueBg]}>
                   <View style={[styles.cell, { width: '25%' }]}><Text style={styles.bold}>ALCANCE %</Text></View>
                   <View style={[styles.cell, { width: '15%' }]}><Text style={[styles.bold, styles.textCenter]}>% BONO</Text></View>
                   <View style={[styles.cell, { width: '12%' }]}><Text style={[styles.bold, styles.textCenter]}>1Q</Text></View>
                   <View style={[styles.cell, { width: '12%' }]}><Text style={[styles.bold, styles.textCenter]}>2Q</Text></View>
                   <View style={[styles.cell, { width: '12%' }]}><Text style={[styles.bold, styles.textCenter]}>3Q</Text></View>
                   <View style={[styles.cell, { width: '12%' }]}><Text style={[styles.bold, styles.textCenter]}>4Q</Text></View>
                   <View style={[styles.cell, { width: '12%', borderRightWidth: 0 }]}><Text style={[styles.bold, styles.textCenter]}>TOTAL</Text></View>
                </View>
                
                <View style={styles.tableRow}>
                  <View style={[styles.cell, { width: '25%' }]}><Text>{"< 90%"}</Text></View>
                  <View style={[styles.cell, { width: '15%' }]}><Text style={styles.textCenter}>0.00%</Text></View>
                  <View style={[styles.cell, { width: '12%' }]}><Text style={styles.textRight}>-</Text></View>
                  <View style={[styles.cell, { width: '12%' }]}><Text style={styles.textRight}>-</Text></View>
                  <View style={[styles.cell, { width: '12%' }]}><Text style={styles.textRight}>-</Text></View>
                  <View style={[styles.cell, { width: '12%' }]}><Text style={styles.textRight}>-</Text></View>
                  <View style={[styles.cell, { width: '12%', borderRightWidth: 0 }]}><Text style={styles.textRight}>-</Text></View>
                </View>

                {RANGOS_BASE.map((range, i) => (
                  <View key={i} style={styles.tableRow}>
                    <View style={[styles.cell, { width: '25%' }]}><Text>{range.alcance}</Text></View>
                    <View style={[styles.cell, { width: '15%' }]}><Text style={styles.textCenter}>{(range.pct_bono * 100).toFixed(2)}%</Text></View>
                    <View style={[styles.cell, { width: '12%' }]}><Text style={styles.textRight}>{fmt(range.total * PESOS_Q[0])}</Text></View>
                    <View style={[styles.cell, { width: '12%' }]}><Text style={styles.textRight}>{fmt(range.total * PESOS_Q[1])}</Text></View>
                    <View style={[styles.cell, { width: '12%' }]}><Text style={styles.textRight}>{fmt(range.total * PESOS_Q[2])}</Text></View>
                    <View style={[styles.cell, { width: '12%' }]}><Text style={styles.textRight}>{fmt(range.total * PESOS_Q[3])}</Text></View>
                    <View style={[styles.cell, { width: '12%', borderRightWidth: 0 }]}><Text style={[styles.textRight, styles.bold]}>{fmt(range.total)}</Text></View>
                  </View>
                ))}
              </View>

              <View style={[styles.table, { marginTop: 10 }]}>
                <View style={[styles.tableRow, styles.tableBlueBg]}>
                  <View style={[styles.cell, { width: '70%' }]}><Text style={styles.bold}>TOTAL COMPENSACIÓN VARIABLE A PAGAR (ANUAL ESTIMADO)</Text></View>
                  <View style={[styles.cell, { width: '30%', borderRightWidth: 0 }]}><Text style={[styles.bold, styles.textRight, { fontSize: 12 }]}>$ {fmt(col.totalVariable)}</Text></View>
                </View>
              </View>

              <View style={styles.notesSection}>
                <Text style={styles.noteText}>1: La empresa se reserva el derecho de cambiar o modificar el plan de compensación de acuerdo a la situación de la empresa.</Text>
                <Text style={styles.noteText}>2: Calculado y pagadero mensual, trimestral y anualmente según sea el caso.</Text>
                <Text style={styles.noteText}>3: Para el pago de este plan será condición NO NEGOCIABLE contar con los soportes de los resultados autorizados.</Text>
                <Text style={styles.noteText}>4: Se entiende que los cálculos trimestrales son anticipos del COVA anual.</Text>
              </View>

              <View style={styles.signatureSection}>
                <View style={styles.signatureBox}>
                  <View style={styles.signatureLine} /><Text style={styles.signatureLabel}>COLABORADOR</Text>
                </View>
                <View style={styles.signatureBox}>
                  <View style={styles.signatureLine} /><Text style={styles.signatureLabel}>JEFE DIRECTO</Text>
                </View>
                <View style={styles.signatureBox}>
                  <View style={styles.signatureLine} /><Text style={styles.signatureLabel}>DIRECCIÓN GENERAL</Text>
                </View>
              </View>
            </Page>
          ))}
        </React.Fragment>
      ))}
    </Document>
  );
}
