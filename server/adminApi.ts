import { Express, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { z } from "zod";
import { transactions, milestones, users, disputes, messages } from "../shared/schema";
import { eq, and, or, asc, desc, SQL, sql, isNull, not } from "drizzle-orm";

// Middleware to check if user is an admin
// This is a placeholder until we implement proper admin roles
// In a real application, you would check a user's role in the database
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // For now, we'll allow any logged-in user to access admin routes
    // In a real application, you would check if the user has admin privileges
    
    next();
  } catch (error) {
    console.error("Admin authentication error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Define validation schemas
const userUpdateSchema = z.object({
  username: z.string().min(3).optional(),
  isActive: z.boolean().optional(),
});

const disputeUpdateSchema = z.object({
  status: z.enum(["open", "reviewing", "resolved", "closed"]).optional(),
  resolution: z.string().optional(),
  resolutionType: z.enum(["refund", "release", "partial", "cancelled"]).optional(),
  assignedToId: z.number().int().positive().optional(),
});

const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Register admin API routes
export function registerAdminApiRoutes(app: Express) {
  const apiPrefix = "/api/admin";
  
  // Apply admin middleware to all admin routes
  app.use(apiPrefix, requireAdmin);
  
  // User Management
  
  // GET /api/admin/users - Get all users
  app.get(`${apiPrefix}/users`, async (req: Request, res: Response) => {
    try {
      const { search, page = "1", limit = "10", isActive } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      
      let query = db.select().from(users);
      
      // Apply search filter
      if (search && typeof search === "string") {
        query = query.where(sql`${users.username} ILIKE ${'%' + search + '%'}`);
      }
      
      // Apply active/inactive filter
      if (isActive !== undefined) {
        // This is a placeholder. In a real application, you would have an isActive field in your users table
        // query = query.where(eq(users.isActive, isActive === "true"));
      }
      
      // Count total
      const totalCount = await db.select({ count: sql<number>`count(*)` }).from(users).execute();
      
      // Get paginated results
      const allUsers = await query.limit(limitNum).offset(offset).orderBy(desc(users.id)).execute();
      
      return res.json({
        users: allUsers,
        pagination: {
          total: totalCount[0]?.count || 0,
          page: pageNum,
          limit: limitNum,
        },
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  // GET /api/admin/users/:id - Get user by ID
  app.get(`${apiPrefix}/users/:id`, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // PATCH /api/admin/users/:id - Update user
  app.patch(`${apiPrefix}/users/:id`, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const validatedData = userUpdateSchema.parse(req.body);
      
      const [updatedUser] = await db.update(users)
        .set({
          username: validatedData.username || user.username,
          // Handle other fields as needed
        })
        .where(eq(users.id, userId))
        .returning();
      
      return res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Transaction Oversight
  
  // GET /api/admin/transactions - Get all transactions
  app.get(`${apiPrefix}/transactions`, async (req: Request, res: Response) => {
    try {
      const { 
        status, 
        buyerId, 
        sellerId, 
        page = "1", 
        limit = "10",
        sort = "createdAt",
        order = "desc",
        search,
        startDate,
        endDate
      } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      
      let queryBuilder = db.select().from(transactions);
      
      // Apply filters
      if (status && typeof status === "string") {
        queryBuilder = queryBuilder.where(eq(transactions.status, status));
      }
      
      if (buyerId && typeof buyerId === "string") {
        queryBuilder = queryBuilder.where(eq(transactions.buyerId, parseInt(buyerId)));
      }
      
      if (sellerId && typeof sellerId === "string") {
        queryBuilder = queryBuilder.where(eq(transactions.sellerId, parseInt(sellerId)));
      }
      
      // Apply search
      if (search && typeof search === "string") {
        queryBuilder = queryBuilder.where(
          or(
            sql`${transactions.title} ILIKE ${'%' + search + '%'}`,
            sql`${transactions.description} ILIKE ${'%' + search + '%'}`
          )
        );
      }
      
      // Apply date range
      if (startDate && typeof startDate === "string") {
        const start = new Date(startDate);
        queryBuilder = queryBuilder.where(sql`${transactions.createdAt} >= ${start}`);
      }
      
      if (endDate && typeof endDate === "string") {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of day
        queryBuilder = queryBuilder.where(sql`${transactions.createdAt} <= ${end}`);
      }
      
      // Count total
      const totalCount = await db.select({ count: sql<number>`count(*)` }).from(queryBuilder.as("filtered_transactions")).execute();
      
      // Apply sorting
      if (sort === "amount") {
        queryBuilder = queryBuilder.orderBy(order === "asc" ? asc(sql`CAST(${transactions.amount} AS DECIMAL)`) : desc(sql`CAST(${transactions.amount} AS DECIMAL)`));
      } else if (sort === "createdAt") {
        queryBuilder = queryBuilder.orderBy(order === "asc" ? asc(transactions.createdAt) : desc(transactions.createdAt));
      } else if (sort === "dueDate") {
        queryBuilder = queryBuilder.orderBy(order === "asc" ? asc(transactions.dueDate) : desc(transactions.dueDate));
      }
      
      // Apply pagination
      queryBuilder = queryBuilder.limit(limitNum).offset(offset);
      
      const allTransactions = await queryBuilder.execute();
      
      // Fetch users for each transaction
      const userIds = new Set<number>();
      allTransactions.forEach(t => {
        userIds.add(t.buyerId);
        userIds.add(t.sellerId);
      });
      
      const usersList = await db.select().from(users).where(sql`${users.id} IN (${Array.from(userIds).join(",")})`).execute();
      
      const usersMap = new Map();
      usersList.forEach(user => {
        usersMap.set(user.id, { id: user.id, username: user.username });
      });
      
      // Add user details to transactions
      const transactionsWithUsers = allTransactions.map(t => ({
        ...t,
        buyer: usersMap.get(t.buyerId) || { id: t.buyerId, username: "Unknown" },
        seller: usersMap.get(t.sellerId) || { id: t.sellerId, username: "Unknown" },
      }));
      
      return res.json({
        transactions: transactionsWithUsers,
        pagination: {
          total: totalCount[0]?.count || 0,
          page: pageNum,
          limit: limitNum,
        },
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  
  // GET /api/admin/transactions/:id - Get transaction by ID
  app.get(`${apiPrefix}/transactions/:id`, async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      const transaction = await db.query.transactions.findFirst({
        where: eq(transactions.id, transactionId),
        with: {
          buyer: { columns: { id: true, username: true } },
          seller: { columns: { id: true, username: true } },
          milestones: true,
        },
      });
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      return res.json(transaction);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      return res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });
  
  // Dispute Resolution
  
  // GET /api/admin/disputes - Get all disputes
  app.get(`${apiPrefix}/disputes`, async (req: Request, res: Response) => {
    try {
      const { 
        status, 
        transactionId, 
        assignedToId,
        page = "1", 
        limit = "10" 
      } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      
      let queryBuilder = db.select().from(disputes);
      
      // Apply filters
      if (status && typeof status === "string") {
        queryBuilder = queryBuilder.where(eq(disputes.status, status));
      }
      
      if (transactionId && typeof transactionId === "string") {
        queryBuilder = queryBuilder.where(eq(disputes.transactionId, parseInt(transactionId)));
      }
      
      if (assignedToId) {
        if (assignedToId === "unassigned") {
          queryBuilder = queryBuilder.where(isNull(disputes.assignedToId));
        } else if (typeof assignedToId === "string") {
          queryBuilder = queryBuilder.where(eq(disputes.assignedToId, parseInt(assignedToId)));
        }
      }
      
      // Count total
      const totalCount = await db.select({ count: sql<number>`count(*)` }).from(queryBuilder.as("filtered_disputes")).execute();
      
      // Apply pagination and sorting
      queryBuilder = queryBuilder
        .orderBy(desc(disputes.createdAt))
        .limit(limitNum)
        .offset(offset);
      
      const allDisputes = await queryBuilder.execute();
      
      // Fetch related transactions
      const transactionIds = allDisputes.map(d => d.transactionId);
      const relatedTransactions = await db.select().from(transactions).where(sql`${transactions.id} IN (${transactionIds.join(",")})`).execute();
      
      const transactionsMap = new Map();
      relatedTransactions.forEach(t => {
        transactionsMap.set(t.id, t);
      });
      
      // Fetch users
      const userIds = new Set<number>();
      allDisputes.forEach(d => {
        userIds.add(d.raisedById);
        if (d.assignedToId) userIds.add(d.assignedToId);
      });
      
      relatedTransactions.forEach(t => {
        userIds.add(t.buyerId);
        userIds.add(t.sellerId);
      });
      
      const usersList = await db.select().from(users).where(sql`${users.id} IN (${Array.from(userIds).join(",")})`).execute();
      
      const usersMap = new Map();
      usersList.forEach(user => {
        usersMap.set(user.id, { id: user.id, username: user.username });
      });
      
      // Add related data to disputes
      const disputesWithRelations = allDisputes.map(d => ({
        ...d,
        transaction: transactionsMap.get(d.transactionId) || null,
        raisedBy: usersMap.get(d.raisedById) || { id: d.raisedById, username: "Unknown" },
        assignedTo: d.assignedToId ? (usersMap.get(d.assignedToId) || { id: d.assignedToId, username: "Unknown" }) : null,
      }));
      
      return res.json({
        disputes: disputesWithRelations,
        pagination: {
          total: totalCount[0]?.count || 0,
          page: pageNum,
          limit: limitNum,
        },
      });
    } catch (error) {
      console.error("Error fetching disputes:", error);
      return res.status(500).json({ message: "Failed to fetch disputes" });
    }
  });
  
  // GET /api/admin/disputes/:id - Get dispute by ID
  app.get(`${apiPrefix}/disputes/:id`, async (req: Request, res: Response) => {
    try {
      const disputeId = parseInt(req.params.id);
      
      if (isNaN(disputeId)) {
        return res.status(400).json({ message: "Invalid dispute ID" });
      }
      
      const dispute = await db.query.disputes.findFirst({
        where: eq(disputes.id, disputeId),
        with: {
          transaction: {
            with: {
              buyer: { columns: { id: true, username: true } },
              seller: { columns: { id: true, username: true } },
            },
          },
          raisedBy: { columns: { id: true, username: true } },
          assignedTo: { columns: { id: true, username: true } },
          milestone: true,
          evidence: true,
        },
      });
      
      if (!dispute) {
        return res.status(404).json({ message: "Dispute not found" });
      }
      
      return res.json(dispute);
    } catch (error) {
      console.error("Error fetching dispute:", error);
      return res.status(500).json({ message: "Failed to fetch dispute" });
    }
  });
  
  // PATCH /api/admin/disputes/:id - Update dispute
  app.patch(`${apiPrefix}/disputes/:id`, async (req: Request, res: Response) => {
    try {
      const disputeId = parseInt(req.params.id);
      
      if (isNaN(disputeId)) {
        return res.status(400).json({ message: "Invalid dispute ID" });
      }
      
      const dispute = await db.query.disputes.findFirst({
        where: eq(disputes.id, disputeId),
      });
      
      if (!dispute) {
        return res.status(404).json({ message: "Dispute not found" });
      }
      
      const validatedData = disputeUpdateSchema.parse(req.body);
      
      const [updatedDispute] = await db.update(disputes)
        .set({
          status: validatedData.status || dispute.status,
          resolution: validatedData.resolution !== undefined ? validatedData.resolution : dispute.resolution,
          resolutionType: validatedData.resolutionType || dispute.resolutionType,
          assignedToId: validatedData.assignedToId || dispute.assignedToId,
        })
        .where(eq(disputes.id, disputeId))
        .returning();
      
      // If dispute is resolved, update transaction and milestone status accordingly
      if (validatedData.status === "resolved" && validatedData.resolutionType) {
        const transaction = await db.query.transactions.findFirst({
          where: eq(transactions.id, dispute.transactionId),
        });
        
        if (transaction) {
          let newStatus;
          let newEscrowStatus;
          
          switch (validatedData.resolutionType) {
            case "refund":
              newStatus = "refunded";
              newEscrowStatus = "refunded";
              break;
            case "release":
              newStatus = "completed";
              newEscrowStatus = "released";
              break;
            case "partial":
              newStatus = "partially_completed";
              newEscrowStatus = "partially_released";
              break;
            case "cancelled":
              newStatus = "cancelled";
              newEscrowStatus = "cancelled";
              break;
          }
          
          if (newStatus && newEscrowStatus) {
            await db.update(transactions)
              .set({
                status: newStatus,
                escrowStatus: newEscrowStatus,
              })
              .where(eq(transactions.id, dispute.transactionId));
            
            // If there's a specific milestone in dispute, update it
            if (dispute.milestoneId) {
              await db.update(milestones)
                .set({
                  status: newStatus,
                  escrowStatus: newEscrowStatus,
                })
                .where(eq(milestones.id, dispute.milestoneId));
            }
          }
        }
      }
      
      return res.json(updatedDispute);
    } catch (error) {
      console.error("Error updating dispute:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to update dispute" });
    }
  });
  
  // Reports & Analytics
  
  // GET /api/admin/reports/transactions - Generate transaction reports
  app.get(`${apiPrefix}/reports/transactions`, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, type, status } = req.query;
      const validation = dateRangeSchema.safeParse({ startDate, endDate });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid date range", errors: validation.error.errors });
      }
      
      let queryBuilder = db.select({
        totalCount: sql<number>`count(*)`,
        totalAmount: sql<string>`SUM(CAST(${transactions.amount} AS DECIMAL))`,
      }).from(transactions);
      
      // Apply date range filter
      if (startDate && typeof startDate === "string") {
        const start = new Date(startDate);
        queryBuilder = queryBuilder.where(sql`${transactions.createdAt} >= ${start}`);
      }
      
      if (endDate && typeof endDate === "string") {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of day
        queryBuilder = queryBuilder.where(sql`${transactions.createdAt} <= ${end}`);
      }
      
      // Apply type filter
      if (type && typeof type === "string") {
        queryBuilder = queryBuilder.where(eq(transactions.type, type));
      }
      
      // Apply status filter
      if (status && typeof status === "string") {
        queryBuilder = queryBuilder.where(eq(transactions.status, status));
      }
      
      const totalStats = await queryBuilder.execute();
      
      // Get transactions by status
      const statusStats = await db.select({
        status: transactions.status,
        count: sql<number>`count(*)`,
        totalAmount: sql<string>`SUM(CAST(${transactions.amount} AS DECIMAL))`,
      })
      .from(transactions)
      .groupBy(transactions.status)
      .execute();
      
      // Get transactions by month
      const monthlyStats = await db.select({
        month: sql<string>`TO_CHAR(${transactions.createdAt}, 'YYYY-MM')`,
        count: sql<number>`count(*)`,
        totalAmount: sql<string>`SUM(CAST(${transactions.amount} AS DECIMAL))`,
      })
      .from(transactions)
      .groupBy(sql`TO_CHAR(${transactions.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${transactions.createdAt}, 'YYYY-MM')`)
      .execute();
      
      return res.json({
        summary: {
          totalTransactions: totalStats[0]?.totalCount || 0,
          totalAmount: totalStats[0]?.totalAmount || "0",
        },
        byStatus: statusStats,
        byMonth: monthlyStats,
      });
    } catch (error) {
      console.error("Error generating transaction report:", error);
      return res.status(500).json({ message: "Failed to generate transaction report" });
    }
  });
  
  // GET /api/admin/reports/users - Generate user reports
  app.get(`${apiPrefix}/reports/users`, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const validation = dateRangeSchema.safeParse({ startDate, endDate });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid date range", errors: validation.error.errors });
      }
      
      // Total user count
      const userCount = await db.select({ count: sql<number>`count(*)` }).from(users).execute();
      
      // New users in date range
      let newUserQuery = db.select({ count: sql<number>`count(*)` }).from(users);
      
      if (startDate && typeof startDate === "string") {
        const start = new Date(startDate);
        newUserQuery = newUserQuery.where(sql`${users.createdAt} >= ${start}`);
      }
      
      if (endDate && typeof endDate === "string") {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of day
        newUserQuery = newUserQuery.where(sql`${users.createdAt} <= ${end}`);
      }
      
      const newUsers = await newUserQuery.execute();
      
      // User sign-ups by month
      const monthlySignups = await db.select({
        month: sql<string>`TO_CHAR(${users.createdAt}, 'YYYY-MM')`,
        count: sql<number>`count(*)`,
      })
      .from(users)
      .groupBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`)
      .execute();
      
      // Most active users (by transaction count)
      const activeBuyers = await db.select({
        userId: transactions.buyerId,
        transactionCount: sql<number>`count(*)`,
      })
      .from(transactions)
      .groupBy(transactions.buyerId)
      .orderBy(sql<number>`count(*)`, "desc")
      .limit(5)
      .execute();
      
      const activeSellers = await db.select({
        userId: transactions.sellerId,
        transactionCount: sql<number>`count(*)`,
      })
      .from(transactions)
      .groupBy(transactions.sellerId)
      .orderBy(sql<number>`count(*)`, "desc")
      .limit(5)
      .execute();
      
      // Fetch user details for active users
      const userIds = [
        ...activeBuyers.map(u => u.userId),
        ...activeSellers.map(u => u.userId),
      ];
      
      const activeUsers = await db.select().from(users).where(sql`${users.id} IN (${Array.from(new Set(userIds)).join(",")})`).execute();
      
      const usersMap = new Map();
      activeUsers.forEach(user => {
        usersMap.set(user.id, { id: user.id, username: user.username });
      });
      
      // Add user details to active users lists
      const buyersWithDetails = activeBuyers.map(buyer => ({
        ...buyer,
        user: usersMap.get(buyer.userId) || { id: buyer.userId, username: "Unknown" },
      }));
      
      const sellersWithDetails = activeSellers.map(seller => ({
        ...seller,
        user: usersMap.get(seller.userId) || { id: seller.userId, username: "Unknown" },
      }));
      
      return res.json({
        summary: {
          totalUsers: userCount[0]?.count || 0,
          newUsers: newUsers[0]?.count || 0,
        },
        monthlySignups,
        mostActiveBuyers: buyersWithDetails,
        mostActiveSellers: sellersWithDetails,
      });
    } catch (error) {
      console.error("Error generating user report:", error);
      return res.status(500).json({ message: "Failed to generate user report" });
    }
  });
  
  // GET /api/admin/reports/disputes - Generate dispute reports
  app.get(`${apiPrefix}/reports/disputes`, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, status } = req.query;
      const validation = dateRangeSchema.safeParse({ startDate, endDate });
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid date range", errors: validation.error.errors });
      }
      
      // Total dispute count
      let disputeQuery = db.select({ count: sql<number>`count(*)` }).from(disputes);
      
      // Apply date range filter
      if (startDate && typeof startDate === "string") {
        const start = new Date(startDate);
        disputeQuery = disputeQuery.where(sql`${disputes.createdAt} >= ${start}`);
      }
      
      if (endDate && typeof endDate === "string") {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // End of day
        disputeQuery = disputeQuery.where(sql`${disputes.createdAt} <= ${end}`);
      }
      
      // Apply status filter
      if (status && typeof status === "string") {
        disputeQuery = disputeQuery.where(eq(disputes.status, status));
      }
      
      const disputeCount = await disputeQuery.execute();
      
      // Disputes by status
      const disputesByStatus = await db.select({
        status: disputes.status,
        count: sql<number>`count(*)`,
      })
      .from(disputes)
      .groupBy(disputes.status)
      .execute();
      
      // Disputes by resolution type
      const disputesByResolution = await db.select({
        resolutionType: disputes.resolutionType,
        count: sql<number>`count(*)`,
      })
      .from(disputes)
      .where(not(isNull(disputes.resolutionType)))
      .groupBy(disputes.resolutionType)
      .execute();
      
      // Average time to resolution
      const resolutionTime = await db.select({
        avgDays: sql<number>`AVG(EXTRACT(EPOCH FROM (${disputes.updatedAt} - ${disputes.createdAt})) / 86400)`,
      })
      .from(disputes)
      .where(eq(disputes.status, "resolved"))
      .execute();
      
      // Disputes by month
      const disputesByMonth = await db.select({
        month: sql<string>`TO_CHAR(${disputes.createdAt}, 'YYYY-MM')`,
        count: sql<number>`count(*)`,
      })
      .from(disputes)
      .groupBy(sql`TO_CHAR(${disputes.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${disputes.createdAt}, 'YYYY-MM')`)
      .execute();
      
      return res.json({
        summary: {
          totalDisputes: disputeCount[0]?.count || 0,
          averageResolutionTime: resolutionTime[0]?.avgDays || 0,
        },
        byStatus: disputesByStatus,
        byResolutionType: disputesByResolution,
        byMonth: disputesByMonth,
      });
    } catch (error) {
      console.error("Error generating dispute report:", error);
      return res.status(500).json({ message: "Failed to generate dispute report" });
    }
  });
}