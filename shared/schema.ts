import { pgTable, text, serial, integer, boolean, timestamp, foreignKey, decimal, varchar, primaryKey, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User model - Current database structure
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Transaction model - Enhanced with payment and escrow status
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'product', 'service', 'digital', 'custom'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  dueDate: timestamp("due_date"),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending', 'funded', 'active', 'completed', 'cancelled', 'disputed'
  escrowStatus: varchar("escrow_status", { length: 20 }).default("awaiting_payment").notNull(), // 'awaiting_payment', 'funded', 'released', 'refunded'
  paymentMethod: varchar("payment_method", { length: 50 }), // 'card', 'upi', 'netbanking', 'wallet', 'crypto'
  paymentStatus: varchar("payment_status", { length: 20 }).default("unpaid").notNull(), // 'unpaid', 'processing', 'paid', 'failed'
  paymentId: text("payment_id"), // External payment reference ID
  paymentDetails: jsonb("payment_details"), // Store additional payment info
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  adminId: integer("admin_id").references(() => users.id), // For disputes/mediation
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Milestone model - Enhanced with proof of completion 
export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  completedAt: timestamp("completed_at"),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending', 'submitted', 'completed', 'rejected'
  escrowStatus: varchar("escrow_status", { length: 20 }).default("awaiting_funding").notNull(), // 'awaiting_funding', 'funded', 'released', 'refunded'
  completionProof: text("completion_proof"), // URL or description of work completed
  rejectionReason: text("rejection_reason"), // If milestone is rejected
  transactionId: integer("transaction_id").notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Dispute model
export const disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).default("open").notNull(), // 'open', 'reviewing', 'resolved', 'closed'
  resolution: text("resolution"),
  resolutionType: varchar("resolution_type", { length: 20 }), // 'refund', 'release', 'partial', 'cancelled'
  transactionId: integer("transaction_id").notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  milestoneId: integer("milestone_id").references(() => milestones.id), // Optional - dispute might be milestone specific
  raisedById: integer("raised_by_id").notNull().references(() => users.id),
  assignedToId: integer("assigned_to_id").references(() => users.id), // Admin assigned to dispute
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Evidence for disputes
export const disputeEvidence = pgTable("dispute_evidence", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url"), // URL to uploaded evidence file
  fileType: varchar("file_type", { length: 50 }), // Type of evidence (document, image, etc.)
  disputeId: integer("dispute_id").notNull().references(() => disputes.id, { onDelete: 'cascade' }),
  submittedById: integer("submitted_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat messages for in-app communication
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  transactionId: integer("transaction_id").references(() => transactions.id, { onDelete: 'cascade' }),
  disputeId: integer("dispute_id").references(() => disputes.id, { onDelete: 'cascade' }),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat groups (for group conversations between multiple parties)
export const chatGroups = pgTable("chat_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: varchar("type", { length: 20 }).default("transaction").notNull(), // 'transaction', 'dispute', 'team'
  transactionId: integer("transaction_id").references(() => transactions.id, { onDelete: 'cascade' }),
  disputeId: integer("dispute_id").references(() => disputes.id, { onDelete: 'cascade' }),
  createdById: integer("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat group members
export const chatGroupMembers = pgTable("chat_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => chatGroups.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar("role", { length: 20 }).default("member").notNull(), // 'admin', 'member'
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Transaction activity logs
export const transactionLogs = pgTable("transaction_logs", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  milestoneId: integer("milestone_id").references(() => milestones.id),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(), // 'created', 'funded', 'milestone_completed', 'released', 'disputed', etc.
  details: jsonb("details"), // Additional details about the action
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  buyerTransactions: many(transactions, { relationName: "buyer" }),
  sellerTransactions: many(transactions, { relationName: "seller" }),
  mediatedTransactions: many(transactions, { relationName: "admin" }),
  raisedDisputes: many(disputes, { relationName: "raised_by" }),
  assignedDisputes: many(disputes, { relationName: "assigned_to" }),
  sentMessages: many(messages, { relationName: "sender" }),
  submittedEvidence: many(disputeEvidence, { relationName: "submitted_by" }),
  chatGroups: many(chatGroupMembers, { relationName: "group_member" }),
  createdChatGroups: many(chatGroups, { relationName: "created_by" }),
  transactionLogs: many(transactionLogs, { relationName: "action_by" }),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  buyer: one(users, { fields: [transactions.buyerId], references: [users.id], relationName: "buyer" }),
  seller: one(users, { fields: [transactions.sellerId], references: [users.id], relationName: "seller" }),
  admin: one(users, { fields: [transactions.adminId], references: [users.id], relationName: "admin" }),
  milestones: many(milestones),
  disputes: many(disputes),
  messages: many(messages),
  logs: many(transactionLogs),
  chatGroup: many(chatGroups),
}));

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
  transaction: one(transactions, { fields: [milestones.transactionId], references: [transactions.id] }),
  disputes: many(disputes),
  logs: many(transactionLogs),
}));

export const disputesRelations = relations(disputes, ({ one, many }) => ({
  transaction: one(transactions, { fields: [disputes.transactionId], references: [transactions.id] }),
  milestone: one(milestones, { fields: [disputes.milestoneId], references: [milestones.id] }),
  raisedBy: one(users, { fields: [disputes.raisedById], references: [users.id], relationName: "raised_by" }),
  assignedTo: one(users, { fields: [disputes.assignedToId], references: [users.id], relationName: "assigned_to" }),
  evidence: many(disputeEvidence),
  messages: many(messages),
  chatGroup: many(chatGroups),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id], relationName: "sender" }),
  transaction: one(transactions, { fields: [messages.transactionId], references: [transactions.id] }),
  dispute: one(disputes, { fields: [messages.disputeId], references: [disputes.id] }),
}));

export const disputeEvidenceRelations = relations(disputeEvidence, ({ one }) => ({
  dispute: one(disputes, { fields: [disputeEvidence.disputeId], references: [disputes.id] }),
  submittedBy: one(users, { fields: [disputeEvidence.submittedById], references: [users.id], relationName: "submitted_by" }),
}));

export const chatGroupsRelations = relations(chatGroups, ({ one, many }) => ({
  transaction: one(transactions, { fields: [chatGroups.transactionId], references: [transactions.id] }),
  dispute: one(disputes, { fields: [chatGroups.disputeId], references: [disputes.id] }),
  createdBy: one(users, { fields: [chatGroups.createdById], references: [users.id], relationName: "created_by" }),
  members: many(chatGroupMembers),
}));

export const chatGroupMembersRelations = relations(chatGroupMembers, ({ one }) => ({
  group: one(chatGroups, { fields: [chatGroupMembers.groupId], references: [chatGroups.id] }),
  user: one(users, { fields: [chatGroupMembers.userId], references: [users.id], relationName: "group_member" }),
}));

export const transactionLogsRelations = relations(transactionLogs, ({ one }) => ({
  transaction: one(transactions, { fields: [transactionLogs.transactionId], references: [transactions.id] }),
  milestone: one(milestones, { fields: [transactionLogs.milestoneId], references: [milestones.id] }),
  user: one(users, { fields: [transactionLogs.userId], references: [users.id], relationName: "action_by" }),
}));

// Create Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
}).omit({ createdAt: true });

export const insertTransactionSchema = createInsertSchema(transactions, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  description: (schema) => schema.min(10, "Description must be at least 10 characters"),
}).omit({ createdAt: true, updatedAt: true, escrowStatus: true, paymentStatus: true, paymentDetails: true });

export const insertMilestoneSchema = createInsertSchema(milestones, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  description: (schema) => schema.min(10, "Description must be at least 10 characters"),
}).omit({ createdAt: true, updatedAt: true, completedAt: true, rejectionReason: true, completionProof: true, escrowStatus: true });

export const insertDisputeSchema = createInsertSchema(disputes, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  description: (schema) => schema.min(10, "Description must be at least 10 characters"),
}).omit({ createdAt: true, updatedAt: true, resolution: true, resolutionType: true, assignedToId: true });

export const insertMessageSchema = createInsertSchema(messages, {
  content: (schema) => schema.min(1, "Message cannot be empty"),
}).omit({ createdAt: true, isRead: true });

export const insertChatGroupSchema = createInsertSchema(chatGroups, {
  name: (schema) => schema.min(3, "Group name must be at least 3 characters"),
}).omit({ createdAt: true, updatedAt: true });

export const insertEvidenceSchema = createInsertSchema(disputeEvidence, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  fileUrl: (schema) => schema.url("File URL must be valid"),
}).omit({ createdAt: true });

// Types for TypeScript
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type Milestone = typeof milestones.$inferSelect;

export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type Dispute = typeof disputes.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertChatGroup = z.infer<typeof insertChatGroupSchema>;
export type ChatGroup = typeof chatGroups.$inferSelect;

export type InsertChatGroupMember = typeof chatGroupMembers.$inferInsert;
export type ChatGroupMember = typeof chatGroupMembers.$inferSelect;

export type InsertDisputeEvidence = z.infer<typeof insertEvidenceSchema>;
export type DisputeEvidence = typeof disputeEvidence.$inferSelect;

export type TransactionLog = typeof transactionLogs.$inferSelect;

// Content pages schema
export const contentPages = pgTable("content_pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // 'product', 'resources', 'company'
  subcategory: text("subcategory").notNull(), // 'features', 'pricing', etc.
  isPublished: boolean("is_published").default(true).notNull(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contentPagesRelations = relations(contentPages, ({ one }) => ({
  // Relations can be added later if needed
}));

// Blog schema
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").references(() => users.id),
  coverImage: text("cover_image"),
  isPublished: boolean("is_published").default(false).notNull(),
  publishedAt: timestamp("published_at"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
}));

// API reference schema
export const apiDocs = pgTable("api_docs", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  version: text("version").notNull(),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(), // GET, POST, PUT, DELETE, etc.
  description: text("description").notNull(),
  requestParams: text("request_params"), // JSON stringified
  requestBody: text("request_body"), // JSON stringified
  responseExample: text("response_example"), // JSON stringified
  category: text("category").notNull(), // 'authentication', 'transactions', etc.
  isPublished: boolean("is_published").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const apiDocsRelations = relations(apiDocs, ({ one }) => ({
  // Relations can be added later if needed
}));

// Community schema
export const communityThreads = pgTable("community_threads", {
  id: serial("id").primaryKey(), 
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  category: text("category").notNull(), // 'general', 'help', 'feature-requests', etc.
  isPinned: boolean("is_pinned").default(false).notNull(),
  isLocked: boolean("is_locked").default(false).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const communityReplies = pgTable("community_replies", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").references(() => communityThreads.id).notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  isAcceptedAnswer: boolean("is_accepted_answer").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const communityThreadsRelations = relations(communityThreads, ({ one, many }) => ({
  author: one(users, {
    fields: [communityThreads.authorId],
    references: [users.id],
  }),
  replies: many(communityReplies),
}));

export const communityRepliesRelations = relations(communityReplies, ({ one }) => ({
  thread: one(communityThreads, {
    fields: [communityReplies.threadId],
    references: [communityThreads.id],
  }),
  author: one(users, {
    fields: [communityReplies.authorId],
    references: [users.id],
  }),
}));

// Contact forms schema
export const contactRequests = pgTable("contact_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  phone: text("phone"),
  message: text("message").notNull(),
  department: text("department").notNull(), // 'sales', 'support', 'partnership', etc.
  status: text("status").default("pending").notNull(), // 'pending', 'in_progress', 'resolved'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contactRequestsRelations = relations(contactRequests, ({ one }) => ({
  // Relations can be added later if needed
}));

// Create schemas for validation
export const insertContentPageSchema = createInsertSchema(contentPages, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  content: (schema) => schema.min(10, "Content must be at least 10 characters"),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  content: (schema) => schema.min(10, "Content must be at least 10 characters"),
  summary: (schema) => schema.min(10, "Summary must be at least 10 characters"),
});

export const insertApiDocSchema = createInsertSchema(apiDocs, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  description: (schema) => schema.min(10, "Description must be at least 10 characters"),
});

export const insertCommunityThreadSchema = createInsertSchema(communityThreads, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  content: (schema) => schema.min(10, "Content must be at least 10 characters"),
});

export const insertCommunityReplySchema = createInsertSchema(communityReplies, {
  content: (schema) => schema.min(10, "Reply must be at least 10 characters"),
});

export const insertContactRequestSchema = createInsertSchema(contactRequests, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  email: (schema) => schema.email("Please enter a valid email address"),
  message: (schema) => schema.min(10, "Message must be at least 10 characters"),
});

// Export schema types
export type ContentPage = typeof contentPages.$inferSelect;
export type InsertContentPage = z.infer<typeof insertContentPageSchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type ApiDoc = typeof apiDocs.$inferSelect;
export type InsertApiDoc = z.infer<typeof insertApiDocSchema>;

export type CommunityThread = typeof communityThreads.$inferSelect;
export type InsertCommunityThread = z.infer<typeof insertCommunityThreadSchema>;

export type CommunityReply = typeof communityReplies.$inferSelect;
export type InsertCommunityReply = z.infer<typeof insertCommunityReplySchema>;

export type ContactRequest = typeof contactRequests.$inferSelect;
export type InsertContactRequest = z.infer<typeof insertContactRequestSchema>;
