import { pgTable, text, serial, timestamp, pgEnum, integer, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const poStatusEnum = pgEnum("po_status", ["draft", "sent", "acknowledged", "delivered", "completed", "cancelled"]);

export const purchaseOrdersTable = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  poNumber: text("po_number").notNull().unique(),
  rfqId: integer("rfq_id"),
  quotationId: integer("quotation_id"),
  vendorId: integer("vendor_id").notNull(),
  vendorName: text("vendor_name").notNull(),
  items: jsonb("items").notNull().$type<Array<{name: string; quantity: number; unit: string; unitPrice: number; totalPrice: number}>>(),
  subtotal: real("subtotal").notNull(),
  taxRate: real("tax_rate").notNull(),
  taxAmount: real("tax_amount").notNull(),
  totalAmount: real("total_amount").notNull(),
  status: poStatusEnum("status").notNull().default("draft"),
  deliveryDate: timestamp("delivery_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrdersTable).omit({ id: true, createdAt: true, poNumber: true });
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = typeof purchaseOrdersTable.$inferSelect;
