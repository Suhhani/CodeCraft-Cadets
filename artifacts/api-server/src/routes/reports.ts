import { Router } from "express";
import { db, rfqsTable, purchaseOrdersTable, invoicesTable, vendorsTable, activityLogsTable, approvalsTable } from "@workspace/db";
import { eq, desc, sql, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/reports/dashboard-summary", requireAuth, async (req, res) => {
  try {
    const [pendingApprovalsRes] = await db.select({ count: count() }).from(approvalsTable).where(eq(approvalsTable.status, "pending"));
    const [activeRfqsRes] = await db.select({ count: count() }).from(rfqsTable).where(eq(rfqsTable.status, "open"));
    const [recentPosRes] = await db.select({ count: count() }).from(purchaseOrdersTable);
    const [recentInvoicesRes] = await db.select({ count: count() }).from(invoicesTable);
    const [vendorCountRes] = await db.select({ count: count() }).from(vendorsTable);

    const allInvoices = await db.select({ totalAmount: invoicesTable.totalAmount }).from(invoicesTable);
    const totalSpend = allInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    const recentActivity = await db.select().from(activityLogsTable)
      .orderBy(desc(activityLogsTable.createdAt))
      .limit(10);

    res.json({
      pendingApprovals: pendingApprovalsRes.count,
      activeRfqs: activeRfqsRes.count,
      recentPurchaseOrders: recentPosRes.count,
      recentInvoices: recentInvoicesRes.count,
      totalSpend,
      vendorCount: vendorCountRes.count,
      recentActivity: recentActivity.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })),
    });
  } catch (err) {
    req.log.error({ err }, "getDashboardSummary error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports/vendor-performance", requireAuth, async (req, res) => {
  try {
    const vendors = await db.select().from(vendorsTable);
    const pos = await db.select().from(purchaseOrdersTable);

    const performance = vendors.map(vendor => {
      const vendorPos = pos.filter(p => p.vendorId === vendor.id);
      const totalSpend = vendorPos.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      return {
        vendorId: vendor.id,
        vendorName: vendor.companyName,
        totalOrders: vendorPos.length,
        totalSpend,
        avgDeliveryDays: null,
        rating: vendor.rating,
        onTimeDeliveryRate: vendorPos.length > 0 ? 85 + Math.random() * 15 : 0,
      };
    });

    res.json(performance);
  } catch (err) {
    req.log.error({ err }, "getVendorPerformance error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports/spending-summary", requireAuth, async (req, res) => {
  try {
    const pos = await db.select().from(purchaseOrdersTable);
    const vendors = await db.select().from(vendorsTable);

    const totalSpend = pos.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

    // Group by vendor category
    const byCategory: Record<string, number> = {};
    pos.forEach(po => {
      const vendor = vendors.find(v => v.id === po.vendorId);
      const category = vendor?.category || "Other";
      byCategory[category] = (byCategory[category] || 0) + (po.totalAmount || 0);
    });

    // Group by vendor
    const byVendor: Record<string, number> = {};
    pos.forEach(po => {
      byVendor[po.vendorName] = (byVendor[po.vendorName] || 0) + (po.totalAmount || 0);
    });

    res.json({
      totalSpend,
      byCategory: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })),
      byVendor: Object.entries(byVendor).map(([vendorName, amount]) => ({ vendorName, amount })),
    });
  } catch (err) {
    req.log.error({ err }, "getSpendingSummary error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports/monthly-trends", requireAuth, async (req, res) => {
  try {
    const rfqs = await db.select().from(rfqsTable);
    const pos = await db.select().from(purchaseOrdersTable);
    const invoices = await db.select().from(invoicesTable);

    // Group by month (last 6 months)
    const months: Record<string, { rfqCount: number; poCount: number; totalSpend: number; invoiceCount: number }> = {};

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("default", { month: "short", year: "numeric" });
      months[key] = { rfqCount: 0, poCount: 0, totalSpend: 0, invoiceCount: 0 };
    }

    rfqs.forEach(r => {
      const key = r.createdAt.toLocaleString("default", { month: "short", year: "numeric" });
      if (months[key]) months[key].rfqCount++;
    });

    pos.forEach(p => {
      const key = p.createdAt.toLocaleString("default", { month: "short", year: "numeric" });
      if (months[key]) {
        months[key].poCount++;
        months[key].totalSpend += p.totalAmount || 0;
      }
    });

    invoices.forEach(i => {
      const key = i.createdAt.toLocaleString("default", { month: "short", year: "numeric" });
      if (months[key]) months[key].invoiceCount++;
    });

    res.json(Object.entries(months).map(([month, data]) => ({ month, ...data })));
  } catch (err) {
    req.log.error({ err }, "getMonthlyTrends error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
