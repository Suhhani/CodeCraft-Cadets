import { Router } from "express";
import { db, invoicesTable, purchaseOrdersTable, activityLogsTable } from "@workspace/db";
import { eq, and, type SQL } from "drizzle-orm";
import { requireAuth, getLocalUser } from "../lib/auth";
import { nextInvoiceNumber } from "../lib/counters";

const router = Router();

router.get("/invoices", requireAuth, async (req, res) => {
  try {
    const { status, purchaseOrderId } = req.query as Record<string, string>;
    const conditions: SQL[] = [];
    if (status) conditions.push(eq(invoicesTable.status, status as any));
    if (purchaseOrderId) conditions.push(eq(invoicesTable.purchaseOrderId, parseInt(purchaseOrderId)));

    const invoices = conditions.length
      ? await db.select().from(invoicesTable).where(and(...conditions))
      : await db.select().from(invoicesTable);

    res.json(invoices.map(i => ({
      ...i,
      dueDate: i.dueDate.toISOString(),
      paidAt: i.paidAt?.toISOString() || null,
      createdAt: i.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "listInvoices error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/invoices", requireAuth, async (req, res) => {
  try {
    const user = getLocalUser(req);
    const { purchaseOrderId, dueDate } = req.body;

    const [po] = await db.select().from(purchaseOrdersTable).where(eq(purchaseOrdersTable.id, purchaseOrderId)).limit(1);
    if (!po) return res.status(404).json({ error: "Purchase order not found" });

    const [invoice] = await db.insert(invoicesTable).values({
      invoiceNumber: nextInvoiceNumber(),
      purchaseOrderId: po.id,
      poNumber: po.poNumber,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      items: po.items,
      subtotal: po.subtotal,
      taxRate: po.taxRate,
      taxAmount: po.taxAmount,
      totalAmount: po.totalAmount,
      dueDate: new Date(dueDate),
    }).returning();

    await db.insert(activityLogsTable).values({
      userId: user?.id,
      userName: user?.name,
      action: "generated",
      entityType: "invoice",
      entityId: invoice.id,
      entityTitle: invoice.invoiceNumber,
      description: `Invoice ${invoice.invoiceNumber} generated for PO ${po.poNumber}`,
    });

    res.status(201).json({
      ...invoice,
      dueDate: invoice.dueDate.toISOString(),
      paidAt: null,
      createdAt: invoice.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "createInvoice error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/invoices/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id)).limit(1);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json({
      ...invoice,
      dueDate: invoice.dueDate.toISOString(),
      paidAt: invoice.paidAt?.toISOString() || null,
      createdAt: invoice.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "getInvoice error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/invoices/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, paidAt } = req.body;
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (paidAt !== undefined) updateData.paidAt = new Date(paidAt);

    const [invoice] = await db.update(invoicesTable).set(updateData).where(eq(invoicesTable.id, id)).returning();
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json({
      ...invoice,
      dueDate: invoice.dueDate.toISOString(),
      paidAt: invoice.paidAt?.toISOString() || null,
      createdAt: invoice.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "updateInvoice error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/invoices/:id/send-email", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id)).limit(1);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    // Mark as sent
    await db.update(invoicesTable).set({ status: "sent" }).where(eq(invoicesTable.id, id));

    res.json({ message: `Invoice ${invoice.invoiceNumber} sent via email` });
  } catch (err) {
    req.log.error({ err }, "sendInvoiceEmail error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
