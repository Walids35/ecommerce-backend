import { Request, Response } from "express";
import { OrderService } from "./order.service";
import {
  UpdateOrderStatusInput,
  UpdatePaymentStatusInput,
} from "./dto/order.dto";

const service = new OrderService();

interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export class OrderController {
  async listOrders(req: AuthRequest, res: Response) {
    const orders = await service.listOrders({
      status: req.query.status as string,
      customerEmail: req.query.customerEmail as string,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
      sort: req.query.sort as string,
    });
    res.json(orders);
  }

  async getOrderById(req: AuthRequest, res: Response) {
    const orderId = Number(req.params.id);
    const order = await service.getOrderById(orderId);
    res.json(order);
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
    res.json(order);
  }

  async updatePayment(req: AuthRequest, res: Response) {
    const orderId = Number(req.params.id);
    const parsed = UpdatePaymentStatusInput.parse(req.body);
    const order = await service.updatePaymentStatus(orderId, parsed.isPaid);
    res.json(order);
  }

  async deleteOrder(req: AuthRequest, res: Response) {
    const orderId = Number(req.params.id);
    await service.deleteOrder(orderId);
    res.json({ message: "Order deleted successfully" });
  }
}
