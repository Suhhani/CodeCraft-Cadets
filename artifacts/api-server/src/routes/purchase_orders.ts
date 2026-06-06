import { Router } from "express";
import { db, purchaseOrdersTable, activityLogsTable, approvalsTable } from "@workspace/db";
import { eq, type SQL } from "drizzle-orm";
import { requireAuth, getLocalUser } from "../lib/auth";
import { nextPoNumber } from "../lib/counters";

const router = Router();

router.get("/purchase-orders", requireAuth, async (req, res) => {
  try {
    const { status } = req.query as Record<string, string>;
    const pos = status
      ? await db.select().from(purchaseOrdersTable).where(eq(purchaseOrdersTable.status, status as any))
      : await db.select().from(purchaseOrdersTable);

    res.json(pos.map(p => ({
      ...p,
      deliveryDate: p.deliveryDate?.toISOString() || null,
      createdAt: p.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "listPurchaseOrders error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/purchase-orders", requireAuth, async (req, res) => {
  try {
    const user = getLocalUser(req);
    const { rfqId, quotationId, vendorId, vendorName, items, taxRate, deliveryDate } = req.body;

    const subtotal = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    const [po] = await db.insert(purchaseOrdersTable).values({
      poNumber: nextPoNumber(),
      rfqId: rfqId || null,
      quotationId: quotationId || null,
      vendorId,
      vendorName: vendorName || "Unknown Vendor",
      items,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
    }).returning();

    // Create approval request
    await db.insert(approvalsTable).values({
      entityType: "purchase_order",
      entityId: po.id,
      entityTitle: `PO ${po.poNumber}`,
      requestedById: user?.id || 0,
      requestedByName: user?.name || "System",
      status: "pending",
    });

    await db.insert(activityLogsTable).values({
      userId: user?.id,
      userName: user?.name,
      action: "created",
      entityType: "purchase_order",
      entityId: po.id,
      entityTitle: po.poNumber,
      description: `Purchase Order ${po.poNumber} created for ${po.vendorName}`,
    });

    res.status(201).json({
      ...po,
      deliveryDate: po.deliveryDate?.toISOString() || null,
      createdAt: po.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "createPurchaseOrder error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/purchase-orders/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [po] = await db.select().from(purchaseOrdersTable).where(eq(purchaseOrdersTable.id, id)).limit(1);
    if (!po) return res.status(404).json({ error: "Purchase order not found" });
    res.json({
      ...po,
      deliveryDate: po.deliveryDate?.toISOString() || null,
      createdAt: po.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "getPurchaseOrder error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/purchase-orders/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, deliveryDate } = req.body;
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (deliveryDate !== undefined) updateData.deliveryDate = new Date(deliveryDate);

    const [po] = await db.update(purchaseOrdersTable).set(updateData).where(eq(purchaseOrdersTable.id, id)).returning();
    if (!po) return res.status(404).json({ error: "Purchase order not found" });
    res.json({
      ...po,
      deliveryDate: po.deliveryDate?.toISOString() || null,
      createdAt: po.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "updatePurchaseOrder error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
