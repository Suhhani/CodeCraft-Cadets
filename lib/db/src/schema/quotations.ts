import { pgTable, text, serial, timestamp, pgEnum, integer, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const quotationStatusEnum = pgEnum("quotation_status", ["submitted", "under_review", "accepted", "rejected"]);

export const quotationsTable = pgTable("quotations", {
  id: serial("id").primaryKey(),
  rfqId: integer("rfq_id").notNull(),
  vendorId: integer("vendor_id").notNull(),
  vendorName: text("vendor_name").notNull(),
  items: jsonb("items").notNull().$type<Array<{rfqItemName: string; unitPrice: number; quantity: number; totalPrice: number}>>(),
  totalAmount: real("total_amount").notNull(),
  deliveryTimeline: text("delivery_timeline").notNull(),
  notes: text("notes"),
  status: quotationStatusEnum("status").notNull().default("submitted"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertQuotationSchema = createInsertSchema(quotationsTable).omit({ id: true, submittedAt: true });
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type Quotation = typeof quotationsTable.$inferSelect;
