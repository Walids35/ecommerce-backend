import { resend, MAILING_CONFIG } from './mailing.config';
import { generateOrderConfirmationEmail } from './templates/order-confirmation';
import { generateOrderStatusUpdateEmail } from './templates/order-status-update';
import { OrderConfirmationData, OrderStatusUpdateData } from './dto/mailing.dto';
import { PdfGeneratorService } from './pdf/pdf-generator.service';

export class MailingService {
  private pdfGenerator: PdfGeneratorService;

  constructor() {
    this.pdfGenerator = new PdfGeneratorService();
  }
  /**
   * Send order confirmation email
   * Non-blocking: logs errors but doesn't throw
   */
  async sendOrderConfirmation(data: OrderConfirmationData): Promise<void> {
    try {
      const { subject, html } = generateOrderConfirmationEmail(data);

      // Generate PDF attachment
      let pdfBuffer: Buffer | null = null;
      let pdfFilename = '';

      try {
        pdfBuffer = await this.pdfGenerator.generateOrderPdf({
          orderNumber: data.orderNumber,
          createdAt: new Date(),
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone || 'N/A',
          shippingAddress: data.shippingAddress,
          items: data.items,
          subtotal: data.subtotal,
          shippingCost: data.shippingCost,
          taxAmount: data.taxAmount,
          totalPrice: data.totalPrice,
          paymentMethod: data.paymentMethod as 'devis' | 'livraison' | 'carte',
        });

        // Determine filename based on payment method
        const docType = data.paymentMethod === 'devis' ? 'Devis' : 'Facture';
        pdfFilename = `${docType}_${data.orderNumber}.pdf`;
      } catch (pdfError) {
        // Log PDF generation error but continue with email
        console.error('❌ PDF generation failed for order:', {
          orderNumber: data.orderNumber,
          error: pdfError instanceof Error ? pdfError.message : 'Unknown error',
        });
      }

      // Send email with or without attachment
      const emailPayload: any = {
        from: `${MAILING_CONFIG.fromName} <${MAILING_CONFIG.fromEmail}>`,
        to: data.customerEmail,
        replyTo: MAILING_CONFIG.replyTo,
        subject,
        html,
      };

      // Add attachment if PDF was generated successfully
      if (pdfBuffer) {
        emailPayload.attachments = [
          {
            content: pdfBuffer.toString('base64'),
            filename: pdfFilename,
          },
        ];
      }

      const result = await resend.emails.send(emailPayload);

      console.log(`✅ Order confirmation email sent to ${data.customerEmail}`, {
        orderId: data.orderNumber,
        emailId: result.data?.id,
        pdfAttached: !!pdfBuffer,
      });
    } catch (error) {
      // Non-blocking: log error but don't throw
      console.error('❌ Failed to send order confirmation email:', {
        orderNumber: data.orderNumber,
        customerEmail: data.customerEmail,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send order status update email
   * Non-blocking: logs errors but doesn't throw
   */
  async sendOrderStatusUpdate(data: OrderStatusUpdateData): Promise<void> {
    try {
      const { subject, html } = generateOrderStatusUpdateEmail(data);

      const result = await resend.emails.send({
        from: `${MAILING_CONFIG.fromName} <${MAILING_CONFIG.fromEmail}>`,
        to: data.customerEmail,
        replyTo: MAILING_CONFIG.replyTo,
        subject,
        html,
      });

      console.log(`✅ Status update email sent to ${data.customerEmail}`, {
        orderId: data.orderNumber,
        status: data.newStatus,
        emailId: result.data?.id,
      });
    } catch (error) {
      console.error('❌ Failed to send status update email:', {
        orderNumber: data.orderNumber,
        customerEmail: data.customerEmail,
        status: data.newStatus,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Helper: Map status enum to user-friendly message
   */
  getStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      pending: 'Order Received',
      confirmed: 'Order Confirmed',
      processing: 'Order is Being Processed',
      shipped: 'Order Shipped',
      delivered: 'Order Delivered',
      cancelled: 'Order Cancelled',
    };
    return messages[status] || 'Order Status Updated';
  }
}
