import { Request, Response } from "express";
import { OrderService } from "../order/order.service";
import { CreateOrderInput } from "../order/dto/order.dto";

const service = new OrderService();

export class CheckoutController {
  async createOrder(req: Request, res: Response) {
    const parsed = CreateOrderInput.parse(req.body);
    const order = await service.createOrder(parsed);

    res.status(201).json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
    });
  }

  async getOrderByNumber(req: Request, res: Response) {
    const orderNumber = req.params.orderNumber;
    const order = await service.getOrderByOrderNumber(orderNumber);
    res.json(order);
  }
}
