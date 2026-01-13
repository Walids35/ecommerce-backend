import { Request, Response } from "express";
import { OrderService } from "../order/order.service";
import { CreateOrderInput } from "../order/dto/order.dto";
import { AdminCreateOrderInput } from "./dto/admin-checkout.dto";
import { sendSuccess, sendCreated } from "../../utils/response";
import { MailingService } from "../mailing/mailing.service";
import { db } from "../../db/data-source";
import { user } from "../../db/schema/users";
import { eq } from "drizzle-orm";
import { UnauthorizedError, NotFoundError, BadRequestError } from "../../utils/errors";
import { AuthRequest } from "../../middlewares/auth";

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

  /**
   * Validate that a user ID belongs to a client user (customer or business-customer)
   * @private
   */
  private async validateClientUser(userId: string) {
    const [userData] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userData) {
      throw new NotFoundError("User not found");
    }

    if (userData.role !== "customer" && userData.role !== "business-customer") {
      throw new BadRequestError(
        `Cannot create order for user with role "${userData.role}". Only customers and business-customers are allowed.`
      );
    }

    return userData;
  }

  /**
   * Admin manual checkout - Create order on behalf of a client user
   * POST /api/checkout/admin
   */
  async createOrderForClient(req: AuthRequest, res: Response) {
    const parsed = AdminCreateOrderInput.parse(req.body);

    // Get admin info from authenticated user
    const adminEmail = req.user?.email;
    if (!adminEmail) {
      throw new UnauthorizedError("Admin authentication required");
    }

    // Validate that selected user is a client
    const clientUser = await this.validateClientUser(parsed.userId);

    // Create order for the client user
    const order = await service.createOrder(parsed, parsed.userId, adminEmail);

    // Send order confirmation email to client
    mailingService.sendOrderConfirmation({
      orderNumber: order.orderNumber,
      customerName: clientUser.name,
      customerEmail: clientUser.email,
      customerPhone: clientUser.phone || "N/A",
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
        clientUserId: clientUser.id,
        clientUserEmail: clientUser.email,
        createdAt: order.createdAt,
      },
      "Order created successfully for client"
    );
  }
}
