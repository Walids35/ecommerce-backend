import PDFDocument from 'pdfkit';
import { OrderPdfData, OrderItem, DocumentType } from './pdf.types';
import { PDF_CONFIG, TERMS_AND_CONDITIONS_FR } from './pdf.config';

export class PdfGeneratorService {
  /**
   * Generate PDF for order (Devis or Facture)
   * Returns Buffer for email attachment
   */
  async generateOrderPdf(data: OrderPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });

        doc.on('error', (error) => {
          reject(error);
        });

        // Determine document type
        const documentType = this.getDocumentType(data.paymentMethod);

        // Draw all sections
        this.drawHeader(doc, documentType, data.orderNumber, data.createdAt);
        this.drawCustomerInfo(doc, data);
        const itemsEndY = this.drawItemsTable(doc, data.items);
        this.drawPricingSummary(doc, data, itemsEndY);
        this.drawFooter(doc, documentType, data.paymentMethod);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Helper: Determine document type based on payment method
   */
  private getDocumentType(paymentMethod: string): DocumentType {
    return paymentMethod === 'devis' ? 'devis' : 'facture';
  }

  /**
   * Helper: Calculate validity date (30 days from now)
   */
  private getValidityDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + PDF_CONFIG.validityDays);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Helper: Draw company header with branding
   */
  private drawHeader(
    doc: PDFKit.PDFDocument,
    documentType: DocumentType,
    orderNumber: string,
    createdAt: Date
  ): void {
    const { companyName, companyAddress, companyPhone, companyEmail } = PDF_CONFIG;

    // Company name (large, bold, left)
    doc
      .fontSize(24)
      .font(PDF_CONFIG.fonts.bold)
      .fillColor(PDF_CONFIG.colors.primary)
      .text(companyName, 50, 50);

    // Document type and order number (right aligned)
    const docTypeLabel = documentType === 'devis' ? 'DEVIS' : 'FACTURE';
    doc
      .fontSize(20)
      .text(docTypeLabel, 400, 50, { align: 'right', width: 145 });

    doc
      .fontSize(12)
      .font(PDF_CONFIG.fonts.regular)
      .text(`N° ${orderNumber}`, 400, 75, { align: 'right', width: 145 });

    // Company contact info (small, left)
    doc
      .fontSize(9)
      .fillColor(PDF_CONFIG.colors.secondary)
      .text(companyAddress, 50, 90)
      .text(`Tél: ${companyPhone} | Email: ${companyEmail}`, 50, 105);

    // Date (right)
    const currentDate = createdAt.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc
      .fillColor(PDF_CONFIG.colors.secondary)
      .text(`Date: ${currentDate}`, 400, 90, { align: 'right', width: 145 });

    // Horizontal line separator
    doc
      .strokeColor(PDF_CONFIG.colors.primary)
      .moveTo(50, 130)
      .lineTo(545, 130)
      .stroke();
  }

  /**
   * Helper: Draw customer information section
   */
  private drawCustomerInfo(doc: PDFKit.PDFDocument, data: OrderPdfData): void {
    const startY = 150;

    doc
      .fontSize(11)
      .font(PDF_CONFIG.fonts.bold)
      .fillColor(PDF_CONFIG.colors.primary)
      .text('Facturé à:', 50, startY);

    doc
      .fontSize(10)
      .font(PDF_CONFIG.fonts.regular)
      .fillColor(PDF_CONFIG.colors.primary)
      .text(data.customerName, 50, startY + 20)
      .text(data.customerEmail, 50, startY + 35)
      .text(data.customerPhone, 50, startY + 50)
      .text(data.shippingAddress.streetAddress, 50, startY + 70)
      .text(
        `${data.shippingAddress.postalCode} ${data.shippingAddress.city}`,
        50,
        startY + 85
      );
  }

  /**
   * Helper: Draw items table
   * Returns the Y position where the table ends
   */
  private drawItemsTable(doc: PDFKit.PDFDocument, items: OrderItem[]): number {
    const tableTop = 260;
    const tableLeft = 50;

    // Table headers
    doc
      .fontSize(10)
      .font(PDF_CONFIG.fonts.bold)
      .fillColor(PDF_CONFIG.colors.primary);

    doc.text('Produit', tableLeft, tableTop);
    doc.text('Qté', tableLeft + 300, tableTop);
    doc.text('Prix unitaire', tableLeft + 350, tableTop);
    doc.text('Total', tableLeft + 445, tableTop, { align: 'right', width: 50 });

    // Header underline
    doc
      .strokeColor(PDF_CONFIG.colors.primary)
      .moveTo(tableLeft, tableTop + 15)
      .lineTo(545, tableTop + 15)
      .stroke();

    // Table rows
    let currentY = tableTop + 25;
    doc.font(PDF_CONFIG.fonts.regular);

    items.forEach((item) => {
      // Product name (with wrapping support)
      const nameWidth = 280;
      doc.text(item.productName, tableLeft, currentY, {
        width: nameWidth,
        lineBreak: true,
      });

      // Quantity
      doc.text(item.quantity.toString(), tableLeft + 300, currentY);

      // Unit price
      doc.text(`${PDF_CONFIG.currency}${item.unitPrice}`, tableLeft + 350, currentY);

      // Subtotal
      doc.text(`${PDF_CONFIG.currency}${item.subtotal}`, tableLeft + 445, currentY, {
        align: 'right',
        width: 50,
      });

      currentY += 25;
    });

    return currentY;
  }

  /**
   * Helper: Draw pricing breakdown
   */
  private drawPricingSummary(
    doc: PDFKit.PDFDocument,
    data: OrderPdfData,
    startY: number
  ): void {
    const rightAlign = 545;
    const labelX = 350;
    let y = startY + 20;

    doc
      .fontSize(10)
      .font(PDF_CONFIG.fonts.regular)
      .fillColor(PDF_CONFIG.colors.primary);

    // Subtotal
    doc.text('Sous-total:', labelX, y);
    doc.text(`${PDF_CONFIG.currency}${data.subtotal}`, rightAlign, y, {
      align: 'right',
      width: 50,
    });
    y += 20;

    // Shipping
    doc.text('Frais de livraison:', labelX, y);
    doc.text(`${PDF_CONFIG.currency}${data.shippingCost}`, rightAlign, y, {
      align: 'right',
      width: 50,
    });
    y += 20;

    // Tax
    doc.text('Taxes:', labelX, y);
    doc.text(`${PDF_CONFIG.currency}${data.taxAmount}`, rightAlign, y, {
      align: 'right',
      width: 50,
    });
    y += 25;

    // Total line
    doc
      .strokeColor(PDF_CONFIG.colors.primary)
      .moveTo(labelX, y)
      .lineTo(rightAlign, y)
      .stroke();
    y += 10;

    // Total (bold, larger)
    doc.fontSize(12).font(PDF_CONFIG.fonts.bold);
    doc.text('TOTAL:', labelX, y);
    doc.text(`${PDF_CONFIG.currency}${data.totalPrice}`, rightAlign, y, {
      align: 'right',
      width: 50,
    });
  }

  /**
   * Helper: Draw footer with terms and validity/payment status
   */
  private drawFooter(
    doc: PDFKit.PDFDocument,
    documentType: DocumentType,
    paymentMethod: string
  ): void {
    const footerTop = 650;

    // Validity period (for devis) or payment status (for facture)
    doc
      .fontSize(10)
      .font(PDF_CONFIG.fonts.bold)
      .fillColor(PDF_CONFIG.colors.primary);

    if (documentType === 'devis') {
      const validityDate = this.getValidityDate();
      doc.text(`Validité: jusqu'au ${validityDate}`, 50, footerTop);
    } else {
      const paymentStatus =
        paymentMethod === 'carte'
          ? 'Paiement par carte bancaire - Réglé'
          : 'Paiement à la livraison';
      doc.text(`Statut: ${paymentStatus}`, 50, footerTop);
    }

    // Terms and conditions
    const terms = TERMS_AND_CONDITIONS_FR[documentType];
    doc
      .fontSize(7)
      .font(PDF_CONFIG.fonts.regular)
      .fillColor(PDF_CONFIG.colors.secondary);

    let y = footerTop + 25;
    terms.forEach((term) => {
      doc.text(`• ${term}`, 50, y, { width: 495 });
      y += 12;
    });

    // Company legal info
    y += 10;
    if (PDF_CONFIG.companySiret || PDF_CONFIG.companyTva) {
      const legalInfo = [];
      if (PDF_CONFIG.companySiret) legalInfo.push(`SIRET: ${PDF_CONFIG.companySiret}`);
      if (PDF_CONFIG.companyTva) legalInfo.push(`TVA: ${PDF_CONFIG.companyTva}`);

      doc.fontSize(6).text(legalInfo.join(' | '), 50, y, {
        align: 'center',
        width: 495,
      });
    }
  }
}
