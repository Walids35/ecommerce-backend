export interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: string;
    subtotal: string;
  }>;
  subtotal: string;
  shippingCost: string;
  taxAmount: string;
  totalPrice: string;
  paymentMethod: string;
  shippingAddress: {
    streetAddress: string;
    city: string;
    postalCode: string;
  };
  orderTrackingUrl: string;
}

export interface OrderStatusUpdateData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  oldStatus: string | null;
  newStatus: string;
  statusMessage: string;
  orderTrackingUrl: string;
  updatedAt: string;
}
