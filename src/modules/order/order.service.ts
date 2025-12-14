import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { CreateOrderInputType } from "./dto/order.dto";
import { db } from "../../db/data-source";
import { products } from "../../db/schema/product";
import {
  orders,
  orderItems,
  orderStatusHistory,
} from "../../db/schema/orders";
import crypto from "crypto";
import { NotFoundError, BadRequestError } from "../../utils/errors";
import { MailingService } from "../mailing/mailing.service";

export class OrderService {
  private mailingService = new MailingService();
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
        throw new NotFoundError(`Product ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestError(
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
      throw new NotFoundError("One or more products not found");
    }

    let calculatedSubtotal = 0;
    const productMap = new Map(fetchedProducts.map((p) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) throw new NotFoundError(`Product ${item.productId} not found`);

      const price = parseFloat(product.price);
      calculatedSubtotal += price * item.quantity;
    }

    // Validate (allow 0.01 tolerance for floating point)
    const providedNum = parseFloat(providedSubtotal);
    if (Math.abs(calculatedSubtotal - providedNum) > 0.01) {
      throw new BadRequestError(
        `Subtotal mismatch: calculated ${calculatedSubtotal.toFixed(2)}, provided ${providedSubtotal}`
      );
    }

    return {
      products: fetchedProducts,
      calculatedSubtotal: calculatedSubtotal.toFixed(2),
    };
  }

  // Helper: Decrement stock for order items
  private async decrementStock(tx: any, orderId: number): Promise<void> {
    // Fetch order items for this order
    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    if (items.length === 0) {
      throw new BadRequestError("No order items found for stock decrement");
    }

    // Decrement stock for each product
    for (const item of items) {
      // First, check if stock is sufficient
      const [product] = await tx
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product) {
        throw new NotFoundError(`Product ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        throw new BadRequestError(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${item.quantity}`
        );
      }

      // Decrement stock atomically
      await tx
        .update(products)
        .set({
          stock: sql`${products.stock} - ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(products.id, item.productId));
    }
  }

  // Helper: Restore stock for order items
  private async restoreStock(tx: any, orderId: number): Promise<void> {
    // Fetch order items for this order
    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    if (items.length === 0) {
      throw new BadRequestError("No order items found for stock restoration");
    }

    // Restore stock for each product
    for (const item of items) {
      await tx
        .update(products)
        .set({
          stock: sql`${products.stock} + ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(products.id, item.productId));
    }
  }

  // Helper: Check if payment method requires immediate stock decrement
  private shouldDecrementStockOnCreate(paymentMethod: string): boolean {
    return paymentMethod === "livraison" || paymentMethod === "carte";
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
      }

      // Conditional stock decrement - only for livraison and carte, not for devis
      if (this.shouldDecrementStockOnCreate(data.paymentMethod)) {
        await this.decrementStock(tx, order.id);
      }

      // Create initial status history
      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        oldStatus: null,
        newStatus: "pending",
        changedBy: "customer",
      });

      // Fetch items for email
      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      return {
        ...order,
        items,
      };
    });
  }

  // Get order by order number (public)
  async getOrderByOrderNumber(orderNumber: string) {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (!order) throw new NotFoundError("Order not found");

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
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    sortBy?: string;
  }) {
    const {
      status,
      customerEmail,
      search,
      page = 1,
      limit = 10,
      sort = "newest",
      sortBy,
    } = query;
    const offset = (page - 1) * limit;

    let whereClause: any[] = [];

    if (status) {
      whereClause.push(eq(orders.status, status as any));
    }

    if (customerEmail) {
      whereClause.push(ilike(orders.customerEmail, `%${customerEmail}%`));
    }

    // Search across multiple fields
    if (search) {
      const searchPattern = `%${search}%`;
      whereClause.push(
        or(
          ilike(orders.orderNumber, searchPattern),
          ilike(orders.customerName, searchPattern),
          ilike(orders.customerEmail, searchPattern),
          ilike(orders.customerPhone, searchPattern),
          ilike(orders.city, searchPattern)
        )
      );
    }

    // Dynamic sorting with sortBy parameter
    let orderBy;
    if (sortBy) {
      const direction = sort === "asc" ? asc : desc;
      switch (sortBy) {
        case "orderNumber":
          orderBy = direction(orders.orderNumber);
          break;
        case "customerName":
          orderBy = direction(orders.customerName);
          break;
        case "customerEmail":
          orderBy = direction(orders.customerEmail);
          break;
        case "status":
          orderBy = direction(orders.status);
          break;
        case "totalPrice":
          orderBy = direction(orders.totalPrice);
          break;
        case "isPaid":
          orderBy = direction(orders.isPaid);
          break;
        case "createdAt":
          orderBy = direction(orders.createdAt);
          break;
        case "updatedAt":
          orderBy = direction(orders.updatedAt);
          break;
        default:
          orderBy = desc(orders.createdAt);
      }
    } else {
      // Legacy sort parameter support
      orderBy =
        sort === "oldest"
          ? asc(orders.createdAt)
          : sort === "price_high"
          ? desc(orders.totalPrice)
          : sort === "price_low"
          ? asc(orders.totalPrice)
          : desc(orders.createdAt);
    }

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

    if (!order) throw new NotFoundError("Order not found");

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

      if (!currentOrder) throw new NotFoundError("Order not found");

      const oldStatus = currentOrder.status;
      const paymentMethod = currentOrder.paymentMethod;

      // Prevent no-op updates
      if (oldStatus === newStatus) {
        throw new BadRequestError(`Order is already in ${newStatus} status`);
      }

      // --- STOCK MANAGEMENT LOGIC ---

      // Case 1: Devis transitioning TO "processing" - decrement stock
      if (
        paymentMethod === "devis" &&
        newStatus === "processing" &&
        oldStatus !== "processing"
      ) {
        await this.decrementStock(tx, orderId);
      }

      // Case 2: Devis in "processing" transitioning to "cancelled" - restore stock
      if (
        paymentMethod === "devis" &&
        oldStatus === "processing" &&
        newStatus === "cancelled"
      ) {
        await this.restoreStock(tx, orderId);
      }

      // Case 3: Devis reverting FROM "processing" to earlier status - restore stock
      const earlierStatuses = ["pending"];
      if (
        paymentMethod === "devis" &&
        oldStatus === "processing" &&
        earlierStatuses.includes(newStatus)
      ) {
        await this.restoreStock(tx, orderId);
      }

      // Case 4: Livraison/Carte cancellation - restore stock
      if (
        (paymentMethod === "livraison" || paymentMethod === "carte") &&
        newStatus === "cancelled" &&
        oldStatus !== "cancelled"
      ) {
        await this.restoreStock(tx, orderId);
      }

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

      // Send status update email (non-blocking, fire-and-forget)
      this.mailingService.sendOrderStatusUpdate({
        orderNumber: currentOrder.orderNumber,
        customerName: currentOrder.customerName,
        customerEmail: currentOrder.customerEmail,
        oldStatus,
        newStatus,
        statusMessage: this.mailingService.getStatusMessage(newStatus),
        orderTrackingUrl: `${process.env.FRONTEND_URL}/track-order/${currentOrder.orderNumber}`,
        updatedAt: new Date().toISOString(),
      }).catch(err => {
        console.error('Unexpected error in status update email:', err);
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

    if (!updated) throw new NotFoundError("Order not found");
    return updated;
  }

  // Delete order (admin) - cascades to items and history
  async deleteOrder(orderId: number): Promise<void> {
    const [deleted] = await db
      .delete(orders)
      .where(eq(orders.id, orderId))
      .returning();

    if (!deleted) throw new NotFoundError("Order not found");
  }
}
