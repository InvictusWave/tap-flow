"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customTemplates = exports.cardScans = exports.cards = void 0;
var drizzle_orm_1 = require("drizzle-orm");
var sqlite_core_1 = require("drizzle-orm/sqlite-core");
exports.cards = (0, sqlite_core_1.sqliteTable)('cards', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    slug: (0, sqlite_core_1.text)('slug').notNull().unique(),
    businessName: (0, sqlite_core_1.text)('business_name'),
    googleReviewUrl: (0, sqlite_core_1.text)('google_review_url'),
    pinHash: (0, sqlite_core_1.text)('pin_hash'),
    location: (0, sqlite_core_1.text)('location'),
    template: (0, sqlite_core_1.text)('template').default('google_quad'),
    status: (0, sqlite_core_1.text)('status', { enum: ['unassigned', 'active'] })
        .notNull()
        .default('unassigned'),
    totalScans: (0, sqlite_core_1.integer)('total_scans').notNull().default(0),
    createdAt: (0, sqlite_core_1.integer)('created_at')
        .notNull()
        .default((0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["(unixepoch())"], ["(unixepoch())"])))),
    updatedAt: (0, sqlite_core_1.integer)('updated_at')
        .notNull()
        .default((0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["(unixepoch())"], ["(unixepoch())"])))),
});
exports.cardScans = (0, sqlite_core_1.sqliteTable)('card_scans', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    cardId: (0, sqlite_core_1.text)('card_id')
        .notNull()
        .references(function () { return exports.cards.id; }),
    scannedAt: (0, sqlite_core_1.integer)('scanned_at')
        .notNull()
        .default((0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["(unixepoch())"], ["(unixepoch())"])))),
    userAgent: (0, sqlite_core_1.text)('user_agent'),
});
exports.customTemplates = (0, sqlite_core_1.sqliteTable)('custom_templates', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    name: (0, sqlite_core_1.text)('name').notNull(),
    aspect: (0, sqlite_core_1.text)('aspect', { enum: ['square', 'vertical', 'horizontal'] })
        .notNull()
        .default('square'),
    width: (0, sqlite_core_1.integer)('width').notNull().default(500),
    height: (0, sqlite_core_1.integer)('height').notNull().default(500),
    background: (0, sqlite_core_1.text)('background').notNull().default('#ffffff'),
    elements: (0, sqlite_core_1.text)('elements').notNull(),
    thumbnail: (0, sqlite_core_1.text)('thumbnail'),
    createdAt: (0, sqlite_core_1.integer)('created_at')
        .notNull()
        .default((0, drizzle_orm_1.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["(unixepoch())"], ["(unixepoch())"])))),
    updatedAt: (0, sqlite_core_1.integer)('updated_at')
        .notNull()
        .default((0, drizzle_orm_1.sql)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["(unixepoch())"], ["(unixepoch())"])))),
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
