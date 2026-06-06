import { pgTable, text, serial, timestamp, pgEnum, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rfqStatusEnum = pgEnum("rfq_status", ["draft", "open", "closed", "awarded", "cancelled"]);

export const rfqsTable = pgTable("rfqs", {
  id: serial("id").primaryKey(),
  rfqNumber: text("rfq_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  items: jsonb("items").notNull().$type<Array<{name: string; description?: string; quantity: number; unit: string}>>(),
  deadline: timestamp("deadline").notNull(),
  status: rfqStatusEnum("status").notNull().default("draft"),
  assignedVendorIds: jsonb("assigned_vendor_ids").notNull().$type<number[]>().default([]),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRfqSchema = createInsertSchema(rfqsTable).omit({ id: true, createdAt: true, rfqNumber: true });
export type InsertRfq = z.infer<typeof insertRfqSchema>;
export type Rfq = typeof rfqsTable.$inferSelect;
