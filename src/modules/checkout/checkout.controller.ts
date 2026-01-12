import { Request, Response } from "express";
import { OrderService } from "../order/order.service";
import { CreateOrderInput } from "../order/dto/order.dto";
import { sendSuccess, sendCreated } from "../../utils/response";
import { MailingService } from "../mailing/mailing.service";
import { db } from "../../db/data-source";
import { user } from "../../db/schema/users";
import { eq } from "drizzle-orm";
import { UnauthorizedError, NotFoundError } from "../../utils/errors";

const service = new OrderService();
const mailingService = new MailingService();

export class CheckoutController {
  async createOrder(req: Request, res: Response) {
    const parsed = CreateOrderInput.parse(req.body);

    // Get userId from authenticated user (required now)
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new UnauthorizedError("Authentication required to place an order");
    }

    // Fetch user data for emails
    const [userData] = await db
      .select({
        name: user.name,
        email: user.email,
        phone: user.phone,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userData) {
      throw new NotFoundError("User not found");
    }

    const order = await service.createOrder(parsed, userId);

    // Send order confirmation email with user data
    mailingService.sendOrderConfirmation({
      orderNumber: order.orderNumber,
      customerName: userData.name,
      customerEmail: userData.email,
      customerPhone: userData.phone || "N/A",
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
