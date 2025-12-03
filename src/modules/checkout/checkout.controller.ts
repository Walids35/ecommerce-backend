import { Request, Response } from "express";
import { OrderService } from "../order/order.service";
import { CreateOrderInput } from "../order/dto/order.dto";
import { sendSuccess, sendCreated } from "../../utils/response";
import { MailingService } from "../mailing/mailing.service";

const service = new OrderService();
const mailingService = new MailingService();

export class CheckoutController {
  async createOrder(req: Request, res: Response) {
    const parsed = CreateOrderInput.parse(req.body);
    const order = await service.createOrder(parsed);

    // Send order confirmation email (non-blocking, fire-and-forget)
    mailingService.sendOrderConfirmation({
      orderNumber: order.orderNumber,
      customerName: parsed.customerName,
      customerEmail: parsed.customerEmail,
      items: order.items.map((item: any) => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      taxAmount: order.taxAmount,
      totalPrice: order.totalPrice,
      paymentMethod: order.paymentMethod,
      shippingAddress: {
        streetAddress: parsed.streetAddress,
        city: parsed.city,
        postalCode: parsed.postalCode,
      },
      orderTrackingUrl: `${process.env.FRONTEND_URL}/track-order/${order.orderNumber}`,
    }).catch(err => {
      // Extra safety: catch any unexpected errors
      console.error('Unexpected error in email sending:', err);
    });

    sendCreated(
      res,
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalPrice: order.totalPrice,
        createdAt: order.createdAt,
      },
      "Order created successfully"
    );
  }

  async getOrderByNumber(req: Request, res: Response) {
    const orderNumber = req.params.orderNumber;
    const order = await service.getOrderByOrderNumber(orderNumber);
    sendSuccess(res, order, "Order retrieved successfully");
  }
}
