import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import { db } from "../../db/data-source";
import { products } from "../../db/schema/product";
import {
  orders,
  orderItems,
  orderStatusHistory,
} from "../../db/schema/orders";
import { categories } from "../../db/schema/categories";
import { subCategories } from "../../db/schema/subcategories";
import { subSubCategories } from "../../db/schema/subsubcategories";
import {
  DateRangeQuery,
  RevenueAnalyticsQuery,
  OrderAnalyticsQuery,
  InventoryAnalyticsQuery,
} from "./dto/analytics.dto";

export class AnalyticsService {
  // Helper: Parse date range or default to 30 days
  private getDateRange(query: DateRangeQuery): {
    startDate: Date;
    endDate: Date;
  } {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    return { startDate, endDate };
  }

  // Overview Dashboard
  async getOverview(query: DateRangeQuery) {
    const { startDate, endDate } = this.getDateRange(query);

    // Execute parallel queries for performance
    const [revenueMetrics, orderMetrics, inventoryMetrics] = await Promise.all(
      [
        this.getRevenueMetrics(startDate, endDate),
        this.getOrderMetrics(startDate, endDate),
        this.getInventoryMetrics(),
      ]
    );

    return {
      dateRange: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
      revenue: revenueMetrics,
      orders: orderMetrics,
      inventory: inventoryMetrics,
    };
  }

  // Revenue metrics for overview
  private async getRevenueMetrics(startDate: Date, endDate: Date) {
    const [result] = await db
      .select({
        total: sql<string>`COALESCE(SUM(CASE WHEN ${orders.isPaid} THEN ${orders.totalPrice}::numeric ELSE 0 END), 0)`,
        paidOrdersCount: sql<number>`COUNT(*) FILTER (WHERE ${orders.isPaid} = true)`,
        unpaidOrdersCount: sql<number>`COUNT(*) FILTER (WHERE ${orders.isPaid} = false)`,
      })
      .from(orders)
      .where(
        and(
          sql`${orders.createdAt} >= ${startDate}`,
          sql`${orders.createdAt} <= ${endDate}`
        )
      );

    const averageOrderValue =
      result.paidOrdersCount > 0
        ? (parseFloat(result.total) / result.paidOrdersCount).toFixed(2)
        : "0.00";

    return {
      total: parseFloat(result.total).toFixed(2),
      averageOrderValue,
      paidOrdersCount: result.paidOrdersCount,
      unpaidOrdersCount: result.unpaidOrdersCount,
    };
  }

  // Order metrics for overview
  private async getOrderMetrics(startDate: Date, endDate: Date) {
    const whereClause = and(
      sql`${orders.createdAt} >= ${startDate}`,
      sql`${orders.createdAt} <= ${endDate}`
    );

    // Total orders
    const [{ total }] = await db
      .select({ total: sql<number>`COUNT(*)` })
      .from(orders)
      .where(whereClause);

    // Status breakdown
    const statusBreakdownData = await db
      .select({
        status: orders.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(whereClause)
      .groupBy(orders.status);

    const statusBreakdown = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    statusBreakdownData.forEach((item) => {
      statusBreakdown[item.status as keyof typeof statusBreakdown] =
        item.count;
    });

    // Payment method breakdown
    const paymentMethodData = await db
      .select({
        paymentMethod: orders.paymentMethod,
        count: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(whereClause)
      .groupBy(orders.paymentMethod);

    const paymentMethodBreakdown = {
      devis: 0,
      livraison: 0,
      carte: 0,
    };

    paymentMethodData.forEach((item) => {
      paymentMethodBreakdown[
        item.paymentMethod as keyof typeof paymentMethodBreakdown
      ] = item.count;
    });

    // Average items per order
    const avgItemsResult = await db.execute<{ avgItems: string }>(sql`
      SELECT COALESCE(AVG(item_counts.item_count), 0)::text as "avgItems"
      FROM (
        SELECT order_id, COUNT(*) as item_count
        FROM ${orderItems}
        JOIN ${orders} ON ${orderItems.orderId} = ${orders.id}
        WHERE ${whereClause}
        GROUP BY order_id
      ) as item_counts
    `);
    const avgItems = avgItemsResult.rows[0]?.avgItems || "0";

    // Cancellation rate
    const cancelledCount = statusBreakdown.cancelled;
    const cancellationRate =
      total > 0 ? ((cancelledCount / total) * 100).toFixed(2) : "0.00";

    return {
      total,
      statusBreakdown,
      paymentMethodBreakdown,
      averageItemsPerOrder: parseFloat(avgItems || "0").toFixed(2),
      cancellationRate,
    };
  }

  // Inventory metrics for overview
  private async getInventoryMetrics() {
    const [result] = await db
      .select({
        totalStockValue: sql<string>`COALESCE(SUM(${products.price}::numeric * ${products.stock}), 0)`,
        lowStockCount: sql<number>`SUM(CASE WHEN ${products.stock} > 0 AND ${products.stock} <= 10 THEN 1 ELSE 0 END)`,
        outOfStockCount: sql<number>`SUM(CASE WHEN ${products.stock} = 0 THEN 1 ELSE 0 END)`,
        activeProductsCount: sql<number>`SUM(CASE WHEN ${products.isActive} THEN 1 ELSE 0 END)`,
        inactiveProductsCount: sql<number>`SUM(CASE WHEN NOT ${products.isActive} THEN 1 ELSE 0 END)`,
      })
      .from(products);

    return {
      totalStockValue: parseFloat(result.totalStockValue).toFixed(2),
      lowStockCount: result.lowStockCount,
      outOfStockCount: result.outOfStockCount,
      activeProductsCount: result.activeProductsCount,
      inactiveProductsCount: result.inactiveProductsCount,
    };
  }

  // Revenue Analytics
  async getRevenueAnalytics(query: RevenueAnalyticsQuery) {
    const { startDate, endDate } = this.getDateRange(query);

    // Build where clause
    let whereClause: any[] = [
      eq(orders.isPaid, true),
      sql`${orders.createdAt} >= ${startDate}`,
      sql`${orders.createdAt} <= ${endDate}`,
    ];

    // Summary metrics
    const [summary] = await db
      .select({
        totalRevenue: sql<string>`COALESCE(SUM(${orders.totalPrice}::numeric), 0)`,
        orderCount: sql<number>`COUNT(*)`,
        avgOrderValue: sql<string>`COALESCE(AVG(${orders.totalPrice}::numeric), 0)`,
      })
      .from(orders)
      .where(and(...whereClause));

    // Time series (if groupBy specified)
    const timeSeries = query.groupBy
      ? await this.getRevenueTimeSeries(
          startDate,
          endDate,
          query.groupBy,
          whereClause
        )
      : null;

    // Payment method breakdown
    const byPaymentMethod = await db
      .select({
        paymentMethod: orders.paymentMethod,
        revenue: sql<string>`SUM(${orders.totalPrice}::numeric)`,
        orderCount: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(and(...whereClause))
      .groupBy(orders.paymentMethod);

    const totalRevenue = parseFloat(summary.totalRevenue);
    const byPaymentMethodWithPercentage = byPaymentMethod.map((item) => ({
      ...item,
      revenue: parseFloat(item.revenue).toFixed(2),
      percentage:
        totalRevenue > 0
          ? ((parseFloat(item.revenue) / totalRevenue) * 100).toFixed(2)
          : "0.00",
    }));

    // Category breakdown
    const byCategory = await this.getRevenueByCategoryJoin(whereClause);

    return {
      summary: {
        totalRevenue: parseFloat(summary.totalRevenue).toFixed(2),
        averageOrderValue: parseFloat(summary.avgOrderValue).toFixed(2),
        orderCount: summary.orderCount,
      },
      timeSeries,
      byPaymentMethod: byPaymentMethodWithPercentage,
      byCategory: byCategory.map((item) => ({
        ...item,
        revenue: parseFloat(item.revenue).toFixed(2),
        percentage:
          totalRevenue > 0
            ? ((parseFloat(item.revenue) / totalRevenue) * 100).toFixed(2)
            : "0.00",
      })),
    };
  }

  // Revenue time series
  private async getRevenueTimeSeries(
    startDate: Date,
    endDate: Date,
    groupBy: "day" | "week" | "month",
    whereClause: any[]
  ) {
    const truncFunction =
      groupBy === "day"
        ? sql`DATE_TRUNC('day', ${orders.createdAt})`
        : groupBy === "week"
        ? sql`DATE_TRUNC('week', ${orders.createdAt})`
        : sql`DATE_TRUNC('month', ${orders.createdAt})`;

    const results = await db
      .select({
        period: sql<string>`TO_CHAR(${truncFunction}, 'YYYY-MM-DD')`,
        revenue: sql<string>`SUM(${orders.totalPrice}::numeric)`,
        orderCount: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(and(...whereClause))
      .groupBy(truncFunction)
      .orderBy(truncFunction);

    return results.map((item) => ({
      ...item,
      revenue: parseFloat(item.revenue).toFixed(2),
    }));
  }

  // Revenue by category join
  // Handle products with both subcategory AND subsubcategory
  // Products should be counted once per top-level category
  private async getRevenueByCategoryJoin(whereClause: any[]) {
    // Use Drizzle query builder without aliases to match the whereClause references
    const results = await db.execute<{
      categoryId: number;
      categoryName: string;
      revenue: string;
      orderCount: number;
    }>(sql`
      WITH product_categories AS (
        SELECT
          p.id as product_id,
          COALESCE(
            sc.category_id,
            (SELECT parent_sc.category_id FROM ${subCategories} parent_sc WHERE parent_sc.id = ssc.sub_category_id)
          ) as category_id
        FROM ${products} p
        LEFT JOIN ${subCategories} sc ON p.sub_category_id = sc.id
        LEFT JOIN ${subSubCategories} ssc ON p.subsubcategory_id = ssc.id
      )
      SELECT
        pc.category_id as "categoryId",
        COALESCE(c.name, 'Uncategorized') as "categoryName",
        COALESCE(SUM(${orderItems.subtotal}::numeric), 0)::text as "revenue",
        COUNT(DISTINCT ${orders.id}) as "orderCount"
      FROM ${orders}
      INNER JOIN ${orderItems} ON ${orders.id} = ${orderItems.orderId}
      INNER JOIN product_categories pc ON ${orderItems.productId} = pc.product_id
      LEFT JOIN ${categories} c ON pc.category_id = c.id
      WHERE ${and(...whereClause)}
      GROUP BY pc.category_id, c.name
      ORDER BY SUM(${orderItems.subtotal}::numeric) DESC
    `);

    return results.rows.map((item) => ({
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      revenue: item.revenue,
      orderCount: item.orderCount,
    }));
  }

  // Order Analytics
  async getOrderAnalytics(query: OrderAnalyticsQuery) {
    const { startDate, endDate } = this.getDateRange(query);

    let whereClause: any[] = [
      sql`${orders.createdAt} >= ${startDate}`,
      sql`${orders.createdAt} <= ${endDate}`,
    ];

    if (query.status) {
      whereClause.push(eq(orders.status, query.status as any));
    }

    // Total orders
    const [{ total, avgOrderValue }] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        avgOrderValue: sql<string>`COALESCE(AVG(${orders.totalPrice}::numeric), 0)`,
      })
      .from(orders)
      .where(and(...whereClause));

    // Status distribution
    const statusDist = await db
      .select({
        status: orders.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(and(...whereClause))
      .groupBy(orders.status);

    const statusDistribution = statusDist.map((item) => ({
      status: item.status,
      count: item.count,
      percentage: total > 0 ? ((item.count / total) * 100).toFixed(2) : "0.00",
    }));

    // Payment method distribution
    const paymentDist = await db
      .select({
        paymentMethod: orders.paymentMethod,
        count: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(and(...whereClause))
      .groupBy(orders.paymentMethod);

    const paymentMethodDistribution = paymentDist.map((item) => ({
      paymentMethod: item.paymentMethod,
      count: item.count,
      percentage: total > 0 ? ((item.count / total) * 100).toFixed(2) : "0.00",
    }));

    // Payment status
    const paymentStatus = await db
      .select({
        isPaid: orders.isPaid,
        count: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(and(...whereClause))
      .groupBy(orders.isPaid);

    const paidCount =
      paymentStatus.find((item) => item.isPaid)?.count || 0;
    const unpaidCount =
      paymentStatus.find((item) => !item.isPaid)?.count || 0;

    // Average items per order
    const avgItemsResult = await db.execute<{ avgItems: string }>(sql`
      SELECT COALESCE(AVG(item_counts.item_count), 0)::text as "avgItems"
      FROM (
        SELECT order_id, COUNT(*) as item_count
        FROM ${orderItems}
        JOIN ${orders} ON ${orderItems.orderId} = ${orders.id}
        WHERE ${and(...whereClause)}
        GROUP BY order_id
      ) as item_counts
    `);
    const avgItems = avgItemsResult.rows[0]?.avgItems || "0";

    // Order value distribution
    const orderValueDistribution =
      await this.getOrderValueDistribution(whereClause);

    // Time series
    const timeSeries = await this.getOrderTimeSeries(
      startDate,
      endDate,
      whereClause
    );

    return {
      summary: {
        totalOrders: total,
        averageItemsPerOrder: parseFloat(avgItems || "0").toFixed(2),
        averageOrderValue: parseFloat(avgOrderValue).toFixed(2),
      },
      statusDistribution,
      paymentMethodDistribution,
      paymentStatus: {
        paid: paidCount,
        unpaid: unpaidCount,
        paidPercentage:
          total > 0 ? ((paidCount / total) * 100).toFixed(2) : "0.00",
      },
      orderValueDistribution,
      timeSeries,
    };
  }

  // Order value distribution
  private async getOrderValueDistribution(whereClause: any[]) {
    const buckets = [
      { min: 0, max: 50, label: "0-50" },
      { min: 51, max: 100, label: "51-100" },
      { min: 101, max: 200, label: "101-200" },
      { min: 201, max: 500, label: "201-500" },
      { min: 501, max: 999999, label: "501+" },
    ];

    const results = await Promise.all(
      buckets.map(async (bucket) => {
        const [result] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(orders)
          .where(
            and(
              ...whereClause,
              sql`${orders.totalPrice}::numeric >= ${bucket.min}`,
              sql`${orders.totalPrice}::numeric <= ${bucket.max}`
            )
          );

        return {
          range: bucket.label,
          count: result.count,
        };
      })
    );

    const total = results.reduce((sum, r) => sum + r.count, 0);

    return {
      ranges: results.map((r) => ({
        ...r,
        percentage: total > 0 ? ((r.count / total) * 100).toFixed(2) : "0.00",
      })),
    };
  }

  // Order time series
  private async getOrderTimeSeries(
    startDate: Date,
    endDate: Date,
    whereClause: any[]
  ) {
    const results = await db
      .select({
        date: sql<string>`TO_CHAR(DATE_TRUNC('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
        orderCount: sql<number>`COUNT(*)`,
        revenue: sql<string>`COALESCE(SUM(CASE WHEN ${orders.isPaid} THEN ${orders.totalPrice}::numeric ELSE 0 END), 0)`,
      })
      .from(orders)
      .where(and(...whereClause))
      .groupBy(sql`DATE_TRUNC('day', ${orders.createdAt})`)
      .orderBy(sql`DATE_TRUNC('day', ${orders.createdAt})`);

    return results.map((item) => ({
      ...item,
      revenue: parseFloat(item.revenue).toFixed(2),
    }));
  }

  // Inventory Analytics
  async getInventoryAnalytics(query: InventoryAnalyticsQuery) {
    const { subCategoryId, lowStockThreshold, page, limit } =
      query;
    const offset = (page - 1) * limit;

    let whereClause: any[] = [];

    if (subCategoryId) {
      whereClause.push(
        or(
          eq(products.subCategoryId, subCategoryId),
          eq(products.subSubCategoryId, subCategoryId)
        )
      );
    }

    // Summary metrics
    const [summary] = await db
      .select({
        totalProducts: sql<number>`COUNT(*)`,
        activeProducts: sql<number>`SUM(CASE WHEN ${products.isActive} THEN 1 ELSE 0 END)`,
        inactiveProducts: sql<number>`SUM(CASE WHEN NOT ${products.isActive} THEN 1 ELSE 0 END)`,
        totalStockValue: sql<string>`COALESCE(SUM(${products.price}::numeric * ${products.stock}), 0)`,
        lowStockCount: sql<number>`SUM(CASE WHEN ${products.stock} > 0 AND ${products.stock} <= ${lowStockThreshold} THEN 1 ELSE 0 END)`,
        outOfStockCount: sql<number>`SUM(CASE WHEN ${products.stock} = 0 THEN 1 ELSE 0 END)`,
      })
      .from(products)
      .where(whereClause.length ? and(...whereClause) : undefined);

    // Stock by category
    const stockByCategory = await this.getStockByCategoryJoin();

    // Low stock products
    let lowStockWhere: any[] = [
      sql`${products.stock} > 0`,
      sql`${products.stock} <= ${lowStockThreshold}`,
    ];

    if (whereClause.length > 0) {
      lowStockWhere = [...whereClause, ...lowStockWhere];
    }

    const lowStockProducts = await db
      .select({
        productId: products.id,
        productName: products.name,
        stock: products.stock,
        price: products.price,
        categoryName: sql<string>`COALESCE(
          ${categories.name},
          (SELECT c.name FROM ${categories} c
           INNER JOIN ${subCategories} sc ON c.id = sc.category_id
           WHERE sc.id = ${subSubCategories.subCategoryId}),
          'Uncategorized'
        )`,
        subCategoryName: sql<string>`CASE
          WHEN ${products.subSubCategoryId} IS NOT NULL AND ${products.subCategoryId} IS NOT NULL
            THEN ${subCategories.name} || ' > ' || ${subSubCategories.name}
          WHEN ${subSubCategories.name} IS NOT NULL
            THEN ${subSubCategories.name}
          WHEN ${subCategories.name} IS NOT NULL
            THEN ${subCategories.name}
          ELSE 'Uncategorized'
        END`,
      })
      .from(products)
      .leftJoin(subCategories, eq(products.subCategoryId, subCategories.id))
      .leftJoin(
        subSubCategories,
        eq(products.subSubCategoryId, subSubCategories.id)
      )
      .leftJoin(
        categories,
        eq(categories.id, subCategories.categoryId)
      )
      .where(and(...lowStockWhere))
      .orderBy(asc(products.stock))
      .limit(limit)
      .offset(offset);

    // Out of stock products
    let outOfStockWhere: any[] = [eq(products.stock, 0)];

    if (whereClause.length > 0) {
      outOfStockWhere = [...whereClause, ...outOfStockWhere];
    }

    const outOfStockProducts = await db
      .select({
        productId: products.id,
        productName: products.name,
        categoryName: sql<string>`COALESCE(
          ${categories.name},
          (SELECT c.name FROM ${categories} c
           INNER JOIN ${subCategories} sc ON c.id = sc.category_id
           WHERE sc.id = ${subSubCategories.subCategoryId}),
          'Uncategorized'
        )`,
        subCategoryName: sql<string>`CASE
          WHEN ${products.subSubCategoryId} IS NOT NULL AND ${products.subCategoryId} IS NOT NULL
            THEN ${subCategories.name} || ' > ' || ${subSubCategories.name}
          WHEN ${subSubCategories.name} IS NOT NULL
            THEN ${subSubCategories.name}
          WHEN ${subCategories.name} IS NOT NULL
            THEN ${subCategories.name}
          ELSE 'Uncategorized'
        END`,
      })
      .from(products)
      .leftJoin(subCategories, eq(products.subCategoryId, subCategories.id))
      .leftJoin(
        subSubCategories,
        eq(products.subSubCategoryId, subSubCategories.id)
      )
      .leftJoin(
        categories,
        eq(categories.id, subCategories.categoryId)
      )
      .where(and(...outOfStockWhere))
      .orderBy(asc(products.name));

    // Best selling products
    const bestSellers = await db
      .select({
        productId: orderItems.productId,
        productName: products.name,
        totalQuantitySold: sql<number>`SUM(${orderItems.quantity})`,
        totalRevenue: sql<string>`SUM(${orderItems.subtotal}::numeric)`,
        currentStock: products.stock,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.isPaid, true))
      .groupBy(orderItems.productId, products.name, products.stock)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(10);

    return {
      summary: {
        totalProducts: summary.totalProducts,
        activeProducts: summary.activeProducts,
        inactiveProducts: summary.inactiveProducts,
        totalStockValue: parseFloat(summary.totalStockValue).toFixed(2),
        lowStockCount: summary.lowStockCount,
        outOfStockCount: summary.outOfStockCount,
      },
      stockByCategory,
      lowStockProducts: {
        page,
        limit,
        total: summary.lowStockCount,
        data: lowStockProducts,
      },
      outOfStockProducts: outOfStockProducts,
      bestSellingProducts: bestSellers.map((item) => ({
        ...item,
        totalRevenue: parseFloat(item.totalRevenue).toFixed(2),
      })),
    };
  }

  // Stock by category join
  // Prevent duplicate counting for products with both subcategory and subsubcategory
  // Products are counted once per top-level category they belong to
  private async getStockByCategoryJoin() {
    // Use a CTE/subquery approach to ensure products are counted once
    const results = await db.execute<{
      categoryId: number;
      categoryName: string;
      productCount: number;
      totalStock: number;
      stockValue: string;
    }>(sql`
      SELECT
        c.id as "categoryId",
        c.name as "categoryName",
        COUNT(DISTINCT p.id) as "productCount",
        COALESCE(SUM(p.stock), 0)::integer as "totalStock",
        COALESCE(SUM(p.price::numeric * p.stock), 0)::text as "stockValue"
      FROM ${categories} c
      LEFT JOIN ${subCategories} sc ON c.id = sc.category_id
      LEFT JOIN ${subSubCategories} ssc ON sc.id = ssc.sub_category_id
      LEFT JOIN ${products} p ON (
        (p.sub_category_id = sc.id OR p.subsubcategory_id = ssc.id)
        AND p.is_active = true
      )
      GROUP BY c.id, c.name
      ORDER BY SUM(p.price::numeric * p.stock) DESC NULLS LAST
    `);

    return results.rows.map((item) => ({
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      productCount: item.productCount,
      totalStock: item.totalStock,
      stockValue: parseFloat(item.stockValue || '0').toFixed(2),
    }));
  }
}
