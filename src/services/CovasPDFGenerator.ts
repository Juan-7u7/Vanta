import jsPDF from 'jspdf';


/**
 * Generador Modular de COVAS 2026
 * Enfoque: Limpio, profesional y optimizado para impresión.
 */

export interface PDFData {
  colaborador: {
    nombre: string;
    matricula: string;
    unidad: string;
  };
  periodo: {
    mes: string;
    anio: number;
  };
}

export class CovasPDFService {
  private doc: jsPDF;

  constructor() {
    // Configuración Global: Tamaño Letter (215.9 x 279.4 mm)
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });
    
    // Configuración base de fuente
    this.doc.setFont('helvetica');
  }

  /**
   * Genera la Página 1: Portada
   */
  public async generarPortada(data: PDFData) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const pageHeight = this.doc.internal.pageSize.getHeight();


    // 1. Logo Centrado Superior
    const logoW = 60;
    const logoH = 30;
    const logoX = (pageWidth - logoW) / 2;
    const logoY = 30;

    try {
      this.doc.addImage('/vanta-logo.png', 'PNG', logoX, logoY, logoW, logoH);
    } catch (e) {
      // Respaldo de texto si la imagen no carga
      this.doc.setFontSize(20);
      this.doc.text('VANTA MEDIA', pageWidth / 2, logoY + 15, { align: 'center' });
    }

    // 2. Título: COVAS 2026
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(30);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('COVAS 2026', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });

    // 3. Subtítulo: PLAN DE COMPENSACIÓN VARIABLE
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('PLAN DE COMPENSACIÓN VARIABLE', pageWidth / 2, pageHeight / 2 - 5, { align: 'center' });

    // 4. Detalles del Periodo
    this.doc.setFontSize(12);
    this.doc.setTextColor(80, 80, 80);
    this.doc.text(`Periodo: ${data.periodo.mes} ${data.periodo.anio}`, pageWidth / 2, pageHeight / 2 + 15, { align: 'center' });

    // 5. Identificación (Recuadro Limpio al Fondo)
    const boxW = 120;
    const boxH = 40;
    const boxX = (pageWidth - boxW) / 2;
    const boxY = pageHeight - 70;

    // Dibujar recuadro de identificación
    this.doc.setDrawColor(230, 230, 230); // Gris muy claro
    this.doc.setLineWidth(0.5);
    this.doc.rect(boxX, boxY, boxW, boxH);

    // Texto dentro del recuadro
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'bold');
    
    const textStartX = boxX + 10;
    const textStartY = boxY + 12;

    this.doc.text('DATOS DEL COLABORADOR', pageWidth / 2, boxY + 7, { align: 'center' });
    this.doc.line(boxX + 20, boxY + 9, boxX + boxW - 20, boxY + 9); // Línea decorativa interna

    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Nombre:`, textStartX, textStartY + 5);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(data.colaborador.nombre.toUpperCase(), textStartX + 20, textStartY + 5);

    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Matrícula:`, textStartX, textStartY + 13);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(data.colaborador.matricula, textStartX + 20, textStartY + 13);

    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Unidad:`, textStartX, textStartY + 21);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(data.colaborador.unidad.toUpperCase(), textStartX + 20, textStartY + 21);

    return this;
  }

  /**
   * Método para añadir nuevas páginas en fases posteriores
   */
  public nuevaPagina() {
    this.doc.addPage();
    return this;
  }

  /**
   * Obtiene el documento para persistencia
   */
  public getDoc() {
    return this.doc;
  }

  /**
   * Descarga del PDF
   */
  public guardar(nombreArchivo: string = 'COVAS_2026.pdf') {
    this.doc.save(nombreArchivo);
  }
}

/**
 * Función Base solicitada para orquestar la generación
 */
export const generarPDFCompesaciones = async (data: PDFData) => {
  const service = new CovasPDFService();
  
  // Fase 1: Portada
  await service.generarPortada(data);
  
  // Nota: No llamamos a service.guardar() aquí para permitir 
  // que en siguientes pasos añadamos más páginas.
  return service;
};
