export interface OrderPdfData {
  // Document metadata
  orderNumber: string;
  createdAt: Date;

  // Customer information
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    streetAddress: string;
    city: string;
    postalCode: string;
  };

  // Order items
  items: OrderItem[];

  // Pricing
  subtotal: string;
  shippingCost: string;
  taxAmount: string;
  totalPrice: string;

  // Payment
  paymentMethod: 'devis' | 'livraison' | 'carte';
}

export interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
}

export type DocumentType = 'devis' | 'facture';
