import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const cards = sqliteTable('cards', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  businessName: text('business_name'),
  googleReviewUrl: text('google_review_url'),
  pinHash: text('pin_hash'),
  location: text('location'),
  template: text('template').default('google_quad'),
  status: text('status', { enum: ['unassigned', 'active'] })
    .notNull()
    .default('unassigned'),
  totalScans: integer('total_scans').notNull().default(0),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

export const cardScans = sqliteTable('card_scans', {
  id: text('id').primaryKey(),
  cardId: text('card_id')
    .notNull()
    .references(() => cards.id),
  scannedAt: integer('scanned_at')
    .notNull()
    .default(sql`(unixepoch())`),
  userAgent: text('user_agent'),
});

export const customTemplates = sqliteTable('custom_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  aspect: text('aspect', { enum: ['square', 'vertical', 'horizontal'] })
    .notNull()
    .default('square'),
  width: integer('width').notNull().default(500),
  height: integer('height').notNull().default(500),
  background: text('background').notNull().default('#ffffff'),
  elements: text('elements').notNull(),
  thumbnail: text('thumbnail'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
export type CardScan = typeof cardScans.$inferSelect;
export type NewCardScan = typeof cardScans.$inferInsert;
export type CustomTemplate = typeof customTemplates.$inferSelect;
export type NewCustomTemplate = typeof customTemplates.$inferInsert;
