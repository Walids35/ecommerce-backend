import { Response } from "express";
import { OrderService } from "./order.service";
import {
  UpdateOrderStatusInput,
  UpdatePaymentStatusInput,
} from "./dto/order.dto";
import { sendSuccess, sendPaginated } from "../../utils/response";
import { AuthRequest } from "../../middlewares/auth";

const service = new OrderService();

export class OrderController {
  async listOrders(req: AuthRequest, res: Response) {
    const result = await service.listOrders({
      status: req.query.status as string,
      customerEmail: req.query.customerEmail as string,
      search: req.query.search as string,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
      sort: req.query.sort as string,
      sortBy: req.query.sortBy as string,
    });

    sendPaginated(
      res,
      result.orders,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
      "Orders retrieved successfully"
    );
  }

  async getOrderById(req: AuthRequest, res: Response) {
    const orderId = Number(req.params.id);
    const order = await service.getOrderById(orderId);
    sendSuccess(res, order, "Order retrieved successfully");
  }

  async updateStatus(req: AuthRequest, res: Response) {
    const orderId = Number(req.params.id);
    const parsed = UpdateOrderStatusInput.parse(req.body);
    const changedBy = req.user?.email || "admin";

    const order = await service.updateOrderStatus(
      orderId,
      parsed.status,
      changedBy
    );
    sendSuccess(res, order, "Order status updated successfully");
  }

  async updatePayment(req: AuthRequest, res: Response) {
    const orderId = Number(req.params.id);
    const parsed = UpdatePaymentStatusInput.parse(req.body);
    const order = await service.updatePaymentStatus(orderId, parsed.isPaid);
    sendSuccess(res, order, "Payment status updated successfully");
  }

  async deleteOrder(req: AuthRequest, res: Response) {
    const orderId = Number(req.params.id);
    await service.deleteOrder(orderId);
    sendSuccess(res, null, "Order deleted successfully");
  }

  /**
   * Get authenticated user's own orders (customer order history)
   */
  async getMyOrders(req: AuthRequest, res: Response) {
    const userId = req.user!.id;

    const result = await service.getOrdersByUserId(userId, {
      status: req.query.status as string,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
      sort: req.query.sort as string,
    });

    sendPaginated(
      res,
      result.orders,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
      "Your orders retrieved successfully"
    );
  }
}
