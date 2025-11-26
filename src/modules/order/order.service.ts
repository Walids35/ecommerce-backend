import { and, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { CreateOrderInputType } from "./dto/order.dto";
import { db } from "../../db/data-source";
import { products } from "../../db/schema/product";
import {
  orders,
  orderItems,
  orderStatusHistory,
} from "../../db/schema/orders";
import crypto from "crypto";

export class OrderService {
  // Helper: Generate unique order number
  private async generateOrderNumber(): Promise<string> {
    const uuid = crypto
      .randomUUID()
      .replace(/-/g, "")
      .substring(0, 8)
      .toUpperCase();
    const orderNumber = `ORD-${uuid}`;

    // Verify uniqueness (rare collision, but handle it)
    const existing = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (existing.length > 0) {
      return this.generateOrderNumber(); // Recursive retry
    }

    return orderNumber;
  }

  // Helper: Validate stock availability
  private async validateStock(
    items: Array<{ productId: string; quantity: number }>
  ): Promise<void> {
    for (const item of items) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
        );
      }
    }
  }

  // Helper: Validate order calculations
  private async validateOrderCalculations(
    items: Array<{ productId: string; quantity: number }>,
    providedSubtotal: string
  ): Promise<{ products: any[]; calculatedSubtotal: string }> {
    const productIds = items.map((i) => i.productId);
    const fetchedProducts = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    if (fetchedProducts.length !== items.length) {
      throw new Error("One or more products not found");
    }

    let calculatedSubtotal = 0;
    const productMap = new Map(fetchedProducts.map((p) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);

      const price = parseFloat(product.price);
      calculatedSubtotal += price * item.quantity;
    }

    // Validate (allow 0.01 tolerance for floating point)
    const providedNum = parseFloat(providedSubtotal);
    if (Math.abs(calculatedSubtotal - providedNum) > 0.01) {
      throw new Error(
        `Subtotal mismatch: calculated ${calculatedSubtotal.toFixed(2)}, provided ${providedSubtotal}`
      );
    }

    return {
      products: fetchedProducts,
      calculatedSubtotal: calculatedSubtotal.toFixed(2),
    };
  }

  // Main: Create order (checkout)
  async createOrder(data: CreateOrderInputType) {
    // 1. Validate calculations
    const { products: productList } = await this.validateOrderCalculations(
      data.items,
      data.subtotal
    );

    // 2. Validate stock
    await this.validateStock(data.items);

    // 3. Calculate total
    const totalPrice = (
      parseFloat(data.subtotal) +
      parseFloat(data.shippingCost) +
      parseFloat(data.taxAmount)
    ).toFixed(2);

    // 4. Generate order number
    const orderNumber = await this.generateOrderNumber();

    // 5. Use transaction
    return await db.transaction(async (tx) => {
      // Create order
      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          city: data.city,
          postalCode: data.postalCode,
          streetAddress: data.streetAddress,
          status: "pending",
          paymentMethod: data.paymentMethod,
          isPaid: false,
          subtotal: data.subtotal,
          shippingCost: data.shippingCost,
          taxAmount: data.taxAmount,
          totalPrice,
        })
        .returning();

      // Create order items and decrement stock
      const productMap = new Map(productList.map((p) => [p.id, p]));

      for (const item of data.items) {
        const product = productMap.get(item.productId)!;
        const itemSubtotal = (
          parseFloat(product.price) * item.quantity
        ).toFixed(2);

        // Insert order item with snapshot
        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          productName: product.name,
          unitPrice: product.price,
          quantity: item.quantity,
          subtotal: itemSubtotal,
        });

        // Decrement stock
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }

      // Create initial status history
      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        oldStatus: null,
        newStatus: "pending",
        changedBy: "customer",
      });

      return order;
    });
  }

  // Get order by order number (public)
  async getOrderByOrderNumber(orderNumber: string) {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (!order) throw new Error("Order not found");

    // Fetch items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    // Fetch status history
    const history = await db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(asc(orderStatusHistory.createdAt));

    return {
      ...order,
      items,
      statusHistory: history,
    };
  }

  // List orders with filtering (admin)
  async listOrders(query: {
    status?: string;
    customerEmail?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) {
    const {
      status,
      customerEmail,
      page = 1,
      limit = 10,
      sort = "newest",
    } = query;
    const offset = (page - 1) * limit;

    let whereClause: any[] = [];

    if (status) {
      whereClause.push(eq(orders.status, status as any));
    }

    if (customerEmail) {
      whereClause.push(ilike(orders.customerEmail, `%${customerEmail}%`));
    }

    const orderBy =
      sort === "oldest"
        ? asc(orders.createdAt)
        : sort === "price_high"
        ? desc(orders.totalPrice)
        : sort === "price_low"
        ? asc(orders.totalPrice)
        : desc(orders.createdAt);

    const rows = await db
      .select()
      .from(orders)
      .where(whereClause.length ? and(...whereClause) : undefined)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(orders)
      .where(whereClause.length ? and(...whereClause) : undefined);

    return {
      page,
      limit,
      total: Number(count),
      orders: rows,
    };
  }

  // Get order by ID (admin)
  async getOrderById(id: number) {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) throw new Error("Order not found");

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    const history = await db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, id))
      .orderBy(asc(orderStatusHistory.createdAt));

    return { ...order, items, statusHistory: history };
  }

  // Update order status (admin) - with automatic history
  async updateOrderStatus(orderId: number, newStatus: string, changedBy: string) {
    return await db.transaction(async (tx) => {
      // Get current order
      const [currentOrder] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!currentOrder) throw new Error("Order not found");

      const oldStatus = currentOrder.status;

      // Update order
      const [updated] = await tx
        .update(orders)
        .set({
          status: newStatus as any,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      // Create history record
      await tx.insert(orderStatusHistory).values({
        orderId,
        oldStatus,
        newStatus: newStatus as any,
        changedBy,
      });

      return updated;
    });
  }

  // Update payment status
  async updatePaymentStatus(orderId: number, isPaid: boolean) {
    const [updated] = await db
      .update(orders)
      .set({
        isPaid,
        paidAt: isPaid ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (!updated) throw new Error("Order not found");
    return updated;
  }

  // Delete order (admin) - cascades to items and history
  async deleteOrder(orderId: number): Promise<void> {
    const [deleted] = await db
      .delete(orders)
      .where(eq(orders.id, orderId))
      .returning();

    if (!deleted) throw new Error("Order not found");
  }
}
