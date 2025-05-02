import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { 
  users, transactions, milestones, disputes, messages, chatGroups, chatGroupMembers, 
  disputeEvidence, transactionLogs, 
  insertUserSchema, insertTransactionSchema, insertMilestoneSchema, insertDisputeSchema,
  insertMessageSchema, insertChatGroupSchema, insertEvidenceSchema
} from "@shared/schema";
import { eq, and, desc, or, isNull, not, gte, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { z } from "zod";
import { ZodError } from "zod-validation-error";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "@db";
import Razorpay from "razorpay";
import crypto from "crypto";

const PgStore = pgSession(session);

// Initialize Razorpay client (will use API keys when provided)
let razorpayClient: Razorpay | null = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayClient = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// User roles
const ROLE = {
  USER: 'user',
  ADMIN: 'admin'
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup with PostgreSQL store
  app.use(
    session({
      store: new PgStore({
        pool: pool,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "middlesman-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
    })
  );

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Admin role middleware (temporary implementation until role field is added)
  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Note: We're temporarily allowing all authenticated users to perform admin actions
    // until we add the role field to the users table
    // In a real app, you would check the role here
    
    next();
  };

  // API Prefix
  const apiPrefix = "/api";

  // Auth routes
  app.post(`${apiPrefix}/auth/register`, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, validatedData.username),
      });
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);
      
      // Create user - only using fields that exist in the current database schema
      const [newUser] = await db.insert(users).values({
        username: validatedData.username,
        password: hashedPassword,
      }).returning({ 
        id: users.id, 
        username: users.username
      });
      
      // Set session
      req.session.userId = newUser.id;
      
      return res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(`${apiPrefix}/auth/login`, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.username, username),
      });
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return user data without sensitive information
      const { password: _, ...userData } = user;
      return res.json(userData);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(`${apiPrefix}/auth/logout`, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.json({ message: "Logged out successfully" });
    });
  });

  app.get(`${apiPrefix}/auth/me`, (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Get current user - only return fields that exist in the database
    db.query.users.findFirst({
      where: eq(users.id, req.session.userId),
      columns: {
        id: true,
        username: true,
        createdAt: true,
      },
    }).then(user => {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    }).catch(error => {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    });
  });

  // User management
  app.get(`${apiPrefix}/users/search`, requireAuth, async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const matchedUsers = await db.query.users.findMany({
        where: (users, { like }) => like(users.username, `%${query}%`),
        columns: {
          id: true,
          username: true,
          createdAt: true
        },
        limit: 10
      });
      
      return res.json(matchedUsers);
    } catch (error) {
      console.error("Error searching users:", error);
      return res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Transaction routes
  app.get(`${apiPrefix}/transactions`, requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { status, type } = req.query;
      
      let query = db.query.transactions;
      const queryOptions: any = {
        where: (transactions: any, { or, eq, and, like }: any) => {
          let conditions = or(
            eq(transactions.buyerId, userId),
            eq(transactions.sellerId, userId)
          );
          
          // Add status filter if provided
          if (status && typeof status === 'string') {
            conditions = and(
              conditions,
              eq(transactions.status, status)
            );
          }
          
          // Add type filter if provided
          if (type && typeof type === 'string') {
            conditions = and(
              conditions,
              eq(transactions.type, type)
            );
          }
          
          return conditions;
        },
        with: {
          buyer: {
            columns: {
              id: true,
              username: true,
              email: true
            },
          },
          seller: {
            columns: {
              id: true,
              username: true,
              email: true
            }
          },
          milestones: true,
        },
        orderBy: [desc(transactions.createdAt)],
      };
      
      const userTransactions = await query.findMany(queryOptions);
      
      return res.json(userTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get(`${apiPrefix}/transactions/:id`, requireAuth, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      // All users can only view their own transactions for now
      // until role field is added to the schema
      const whereCondition = (transactions: any, { and, or, eq }: any) => and(
        eq(transactions.id, transactionId),
        or(
          eq(transactions.buyerId, userId),
          eq(transactions.sellerId, userId)
        )
      );
      
      // Get transaction with related data
      const transaction = await db.query.transactions.findFirst({
        where: whereCondition,
        with: {
          buyer: {
            columns: {
              id: true,
              username: true,
              email: true
            },
          },
          seller: {
            columns: {
              id: true,
              username: true,
              email: true
            }
          },
          milestones: true,
          disputes: {
            with: {
              raisedBy: {
                columns: {
                  id: true,
                  username: true
                }
              }
            }
          }
        },
      });
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Get transaction logs
      const logs = await db.query.transactionLogs.findMany({
        where: eq(transactionLogs.transactionId, transactionId),
        with: {
          user: {
            columns: {
              id: true,
              username: true
            }
          }
        },
        orderBy: [desc(transactionLogs.createdAt)]
      });
      
      return res.json({
        ...transaction,
        logs
      });
    } catch (error) {
      console.error("Error fetching transaction:", error);
      return res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });

  app.post(`${apiPrefix}/transactions`, requireAuth, async (req, res) => {
    try {
      const buyerId = req.session.userId;
      
      // Find seller by username
      const sellerIdentifier = req.body.sellerEmail;
      const seller = await db.query.users.findFirst({
        where: eq(users.username, sellerIdentifier)
      });
      
      if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
      }
      
      // Parse and validate transaction data
      const transactionData = {
        title: req.body.title,
        description: req.body.description,
        type: req.body.type,
        amount: req.body.amount,
        currency: req.body.currency,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        status: "pending",
        escrowStatus: "awaiting_payment",
        paymentStatus: "unpaid",
        buyerId,
        sellerId: seller.id,
        updatedAt: new Date()
      };
      
      // Create transaction with milestones
      const [newTransaction] = await db.insert(transactions)
        .values(transactionData)
        .returning();
      
      // Add milestones if provided
      if (req.body.milestones && req.body.milestones.length > 0) {
        const milestonesData = req.body.milestones.map((milestone: any) => ({
          title: milestone.title,
          description: milestone.description,
          amount: milestone.amount,
          dueDate: new Date(milestone.dueDate),
          status: "pending",
          escrowStatus: "awaiting_funding",
          transactionId: newTransaction.id,
          updatedAt: new Date()
        }));
        
        await db.insert(milestones).values(milestonesData);
      }
      
      // Create transaction log
      await db.insert(transactionLogs).values({
        transactionId: newTransaction.id,
        userId: buyerId,
        action: "created",
        details: { message: "Transaction created" },
      });
      
      // Create a chat group for this transaction
      const [chatGroup] = await db.insert(chatGroups).values({
        name: `Chat for ${newTransaction.title}`,
        type: "transaction",
        transactionId: newTransaction.id,
        createdById: buyerId,
        updatedAt: new Date()
      }).returning();
      
      // Add both buyer and seller to the chat group
      await db.insert(chatGroupMembers).values([
        {
          groupId: chatGroup.id,
          userId: buyerId,
          role: "admin" // Transaction creator is admin of the chat
        },
        {
          groupId: chatGroup.id,
          userId: seller.id,
          role: "member"
        }
      ]);
      
      // Get complete transaction with relations
      const completeTransaction = await db.query.transactions.findFirst({
        where: eq(transactions.id, newTransaction.id),
        with: {
          buyer: {
            columns: {
              id: true,
              username: true,
              email: true
            },
          },
          seller: {
            columns: {
              id: true,
              username: true,
              email: true
            }
          },
          milestones: true,
        },
      });
      
      return res.status(201).json(completeTransaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating transaction:", error);
      return res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Payment and Escrow Management
  app.post(`${apiPrefix}/transactions/:id/create-payment`, requireAuth, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      // Check if user is the buyer
      const transaction = await db.query.transactions.findFirst({
        where: (transactions, { and, eq }) => and(
          eq(transactions.id, transactionId),
          eq(transactions.buyerId, userId)
        ),
      });
      
      if (!transaction) {
        return res.status(403).json({ message: "Not authorized to fund this transaction" });
      }
      
      // Check if transaction is in a valid state for payment
      if (transaction.status !== "pending" || transaction.escrowStatus !== "awaiting_payment") {
        return res.status(400).json({ 
          message: "Transaction cannot be funded in its current state",
          status: transaction.status,
          escrowStatus: transaction.escrowStatus
        });
      }
      
      // If Razorpay client is not initialized, return error (for development)
      if (!razorpayClient) {
        // For development, we'll simulate payment order creation
        return res.json({
          id: `order_${Math.random().toString(36).substring(2, 15)}`,
          amount: parseFloat(transaction.amount.toString()) * 100,
          currency: transaction.currency,
          receipt: `transaction_${transaction.id}`,
          notes: {
            transactionId: transaction.id.toString(),
            description: transaction.title
          },
          // This is demo data, will be replaced with real Razorpay integration
          demo: true,
          key_id: "razorpay_test_key_id" 
        });
      }
      
      // Create Razorpay order
      const amount = parseFloat(transaction.amount.toString()) * 100; // Convert to smallest currency unit
      const currency = transaction.currency;
      
      const order = await razorpayClient.orders.create({
        amount: amount,
        currency: currency,
        receipt: `transaction_${transaction.id}`,
        notes: {
          transactionId: transaction.id.toString(),
          buyerId: userId.toString()
        }
      });
      
      // Update transaction with payment details
      await db.update(transactions)
        .set({
          paymentStatus: "processing",
          paymentId: order.id,
          updatedAt: new Date()
        })
        .where(eq(transactions.id, transactionId));
      
      // Create transaction log
      await db.insert(transactionLogs).values({
        transactionId: transaction.id,
        userId: userId,
        action: "payment_initiated",
        details: { orderId: order.id }
      });
      
      return res.json({
        ...order,
        key_id: process.env.RAZORPAY_KEY_ID
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      return res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.post(`${apiPrefix}/transactions/:id/payment-callback`, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
      
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      // Get transaction
      const transaction = await db.query.transactions.findFirst({
        where: eq(transactions.id, transactionId)
      });
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // If Razorpay client is not initialized, simulate verification (for development)
      if (!razorpayClient) {
        // Update transaction to funded status
        await db.update(transactions)
          .set({
            paymentStatus: "paid",
            escrowStatus: "funded",
            status: "active",
            paymentDetails: {
              paymentId: razorpay_payment_id || 'demo_payment_id',
              orderId: razorpay_order_id || 'demo_order_id',
              signature: razorpay_signature || 'demo_signature',
              method: req.body.method || 'card',
              time: new Date().toISOString()
            },
            updatedAt: new Date()
          })
          .where(eq(transactions.id, transactionId));
        
        // Create transaction log
        await db.insert(transactionLogs).values({
          transactionId: transaction.id,
          userId: transaction.buyerId,
          action: "payment_completed",
          details: { 
            paymentId: razorpay_payment_id || 'demo_payment_id',
            method: req.body.method || 'card'
          }
        });
        
        // Update all milestones to funded
        await db.update(milestones)
          .set({
            escrowStatus: "funded",
            updatedAt: new Date()
          })
          .where(eq(milestones.transactionId, transactionId));
        
        return res.json({ success: true, message: "Payment verified successfully" });
      }
      
      // For production, verify payment signature
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');
      
      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ message: "Invalid payment signature" });
      }
      
      // Update transaction to funded status
      await db.update(transactions)
        .set({
          paymentStatus: "paid",
          escrowStatus: "funded",
          status: "active",
          paymentDetails: {
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            signature: razorpay_signature,
            method: req.body.method || 'card',
            time: new Date().toISOString()
          },
          updatedAt: new Date()
        })
        .where(eq(transactions.id, transactionId));
      
      // Create transaction log
      await db.insert(transactionLogs).values({
        transactionId: transaction.id,
        userId: transaction.buyerId,
        action: "payment_completed",
        details: { 
          paymentId: razorpay_payment_id,
          method: req.body.method || 'card'
        }
      });
      
      // Update all milestones to funded
      await db.update(milestones)
        .set({
          escrowStatus: "funded",
          updatedAt: new Date()
        })
        .where(eq(milestones.transactionId, transactionId));
      
      return res.json({ success: true, message: "Payment verified successfully" });
    } catch (error) {
      console.error("Error verifying payment:", error);
      return res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // Milestone routes
  app.get(`${apiPrefix}/transactions/:transactionId/milestones`, requireAuth, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.transactionId);
      const userId = req.session.userId;
      
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      // Check if user has access to this transaction
      const transaction = await db.query.transactions.findFirst({
        where: (transactions, { and, or, eq }) => and(
          eq(transactions.id, transactionId),
          or(
            eq(transactions.buyerId, userId),
            eq(transactions.sellerId, userId)
          )
        ),
      });
      
      if (!transaction) {
        return res.status(403).json({ message: "Not authorized to view these milestones" });
      }
      
      // Get milestones
      const transactionMilestones = await db.query.milestones.findMany({
        where: eq(milestones.transactionId, transactionId),
        orderBy: [desc(milestones.dueDate)]
      });
      
      return res.json(transactionMilestones);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      return res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });

  app.post(`${apiPrefix}/transactions/:transactionId/milestones/:milestoneId/submit`, requireAuth, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.transactionId);
      const milestoneId = parseInt(req.params.milestoneId);
      const userId = req.session.userId;
      const { completionProof } = req.body;
      
      if (isNaN(transactionId) || isNaN(milestoneId)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }
      
      // Check if user is the seller
      const transaction = await db.query.transactions.findFirst({
        where: (transactions, { and, eq }) => and(
          eq(transactions.id, transactionId),
          eq(transactions.sellerId, userId)
        ),
      });
      
      if (!transaction) {
        return res.status(403).json({ message: "Not authorized to submit this milestone" });
      }
      
      // Check milestone exists and belongs to transaction
      const milestone = await db.query.milestones.findFirst({
        where: and(
          eq(milestones.id, milestoneId),
          eq(milestones.transactionId, transactionId)
        ),
      });
      
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      // Check milestone status
      if (milestone.status !== "pending" || milestone.escrowStatus !== "funded") {
        return res.status(400).json({ 
          message: "Milestone cannot be submitted in its current state", 
          status: milestone.status,
          escrowStatus: milestone.escrowStatus
        });
      }
      
      // Update milestone
      const [updatedMilestone] = await db.update(milestones)
        .set({
          status: "submitted",
          completionProof: completionProof || "Work completed as described",
          updatedAt: new Date()
        })
        .where(and(
          eq(milestones.id, milestoneId),
          eq(milestones.transactionId, transactionId)
        ))
        .returning();
      
      // Create transaction log
      await db.insert(transactionLogs).values({
        transactionId: transactionId,
        milestoneId: milestoneId,
        userId: userId,
        action: "milestone_submitted",
        details: { milestone: milestone.title }
      });
      
      return res.json(updatedMilestone);
    } catch (error) {
      console.error("Error submitting milestone:", error);
      return res.status(500).json({ message: "Failed to submit milestone" });
    }
  });

  app.patch(`${apiPrefix}/transactions/:transactionId/milestones/:milestoneId/approve`, requireAuth, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.transactionId);
      const milestoneId = parseInt(req.params.milestoneId);
      const userId = req.session.userId;
      
      if (isNaN(transactionId) || isNaN(milestoneId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Check if user is the buyer (only buyers can approve milestones)
      const transaction = await db.query.transactions.findFirst({
        where: (transactions, { and, eq }) => and(
          eq(transactions.id, transactionId),
          eq(transactions.buyerId, userId)
        ),
      });
      
      if (!transaction) {
        return res.status(403).json({ message: "Not authorized to approve this milestone" });
      }
      
      // Get the milestone
      const milestone = await db.query.milestones.findFirst({
        where: and(
          eq(milestones.id, milestoneId),
          eq(milestones.transactionId, transactionId)
        ),
      });
      
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      // Verify milestone is in a valid state for approval (must be submitted or pending)
      if (milestone.status !== "submitted" && milestone.status !== "pending") {
        return res.status(400).json({ 
          message: "Milestone cannot be approved in its current state", 
          status: milestone.status 
        });
      }
      
      // Update milestone status
      const [updatedMilestone] = await db.update(milestones)
        .set({
          status: "completed",
          escrowStatus: "released",
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(milestones.id, milestoneId),
          eq(milestones.transactionId, transactionId)
        ))
        .returning();
      
      // Create transaction log
      await db.insert(transactionLogs).values({
        transactionId: transactionId,
        milestoneId: milestoneId,
        userId: userId,
        action: "milestone_completed",
        details: { milestone: milestone.title }
      });
      
      // Check if all milestones are completed to update transaction status
      const allMilestones = await db.query.milestones.findMany({
        where: eq(milestones.transactionId, transactionId),
      });
      
      const allCompleted = allMilestones.every(m => m.status === "completed");
      
      if (allCompleted) {
        await db.update(transactions)
          .set({
            status: "completed",
            escrowStatus: "released",
            updatedAt: new Date()
          })
          .where(eq(transactions.id, transactionId));
        
        // Create transaction log for completion
        await db.insert(transactionLogs).values({
          transactionId: transactionId,
          userId: userId,
          action: "transaction_completed",
          details: { message: "All milestones completed" }
        });
      } else if (transaction.status === "pending") {
        // If transaction was pending and a milestone was approved, set to active
        await db.update(transactions)
          .set({
            status: "active",
            updatedAt: new Date()
          })
          .where(eq(transactions.id, transactionId));
      }
      
      return res.json(updatedMilestone);
    } catch (error) {
      console.error("Error approving milestone:", error);
      return res.status(500).json({ message: "Failed to approve milestone" });
    }
  });

  app.patch(`${apiPrefix}/transactions/:transactionId/milestones/:milestoneId/reject`, requireAuth, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.transactionId);
      const milestoneId = parseInt(req.params.milestoneId);
      const userId = req.session.userId;
      const { rejectionReason } = req.body;
      
      if (isNaN(transactionId) || isNaN(milestoneId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      if (!rejectionReason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }
      
      // Check if user is the buyer
      const transaction = await db.query.transactions.findFirst({
        where: (transactions, { and, eq }) => and(
          eq(transactions.id, transactionId),
          eq(transactions.buyerId, userId)
        ),
      });
      
      if (!transaction) {
        return res.status(403).json({ message: "Not authorized to reject this milestone" });
      }
      
      // Check milestone state - can only reject submitted milestones
      const milestone = await db.query.milestones.findFirst({
        where: and(
          eq(milestones.id, milestoneId),
          eq(milestones.transactionId, transactionId)
        ),
      });
      
      if (!milestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      if (milestone.status !== "submitted") {
        return res.status(400).json({ 
          message: "Can only reject submitted milestones", 
          status: milestone.status 
        });
      }
      
      // Update milestone status
      const [updatedMilestone] = await db.update(milestones)
        .set({
          status: "pending", // Reset to pending
          rejectionReason,
          completionProof: null, // Clear the proof
          updatedAt: new Date()
        })
        .where(and(
          eq(milestones.id, milestoneId),
          eq(milestones.transactionId, transactionId)
        ))
        .returning();
      
      // Create transaction log
      await db.insert(transactionLogs).values({
        transactionId,
        milestoneId,
        userId,
        action: "milestone_rejected",
        details: { 
          milestone: milestone.title,
          reason: rejectionReason
        }
      });
      
      return res.json(updatedMilestone);
    } catch (error) {
      console.error("Error rejecting milestone:", error);
      return res.status(500).json({ message: "Failed to reject milestone" });
    }
  });

  // Dispute Management
  app.post(`${apiPrefix}/transactions/:transactionId/disputes`, requireAuth, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.transactionId);
      const userId = req.session.userId;
      const { title, description, milestoneId } = req.body;
      
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      // Check if user is part of the transaction
      const transaction = await db.query.transactions.findFirst({
        where: (transactions, { and, or, eq }) => and(
          eq(transactions.id, transactionId),
          or(
            eq(transactions.buyerId, userId),
            eq(transactions.sellerId, userId)
          )
        ),
      });
      
      if (!transaction) {
        return res.status(403).json({ message: "Not authorized to raise a dispute for this transaction" });
      }
      
      // Validate if milestone exists and belongs to transaction if provided
      if (milestoneId) {
        const milestone = await db.query.milestones.findFirst({
          where: and(
            eq(milestones.id, milestoneId),
            eq(milestones.transactionId, transactionId)
          ),
        });
        
        if (!milestone) {
          return res.status(404).json({ message: "Milestone not found or doesn't belong to this transaction" });
        }
      }
      
      // Create dispute
      const validatedData = insertDisputeSchema.parse({
        title,
        description,
        transactionId,
        milestoneId: milestoneId || null,
        raisedById: userId
      });
      
      const [newDispute] = await db.insert(disputes)
        .values({
          ...validatedData,
          status: "open",
          updatedAt: new Date()
        })
        .returning();
      
      // Update transaction status
      await db.update(transactions)
        .set({
          status: "disputed",
          updatedAt: new Date()
        })
        .where(eq(transactions.id, transactionId));
      
      // Create transaction log
      await db.insert(transactionLogs).values({
        transactionId,
        milestoneId: milestoneId || null,
        userId,
        action: "dispute_created",
        details: { 
          disputeId: newDispute.id,
          title: newDispute.title
        }
      });
      
      // Create a chat group for this dispute
      const [chatGroup] = await db.insert(chatGroups).values({
        name: `Dispute: ${newDispute.title}`,
        type: "dispute",
        transactionId,
        disputeId: newDispute.id,
        createdById: userId,
        updatedAt: new Date()
      }).returning();
      
      // Add both buyer and seller to the dispute chat group
      await db.insert(chatGroupMembers).values([
        {
          groupId: chatGroup.id,
          userId: transaction.buyerId,
          role: "member"
        },
        {
          groupId: chatGroup.id,
          userId: transaction.sellerId,
          role: "member"
        }
      ]);
      
      // Find an admin to assign (simplified version - in production would have load balancing)
      const admin = await db.query.users.findFirst({
        where: eq(users.role, ROLE.ADMIN),
        columns: { id: true }
      });
      
      if (admin) {
        // Assign admin to dispute
        await db.update(disputes)
          .set({
            assignedToId: admin.id,
            status: "reviewing",
            updatedAt: new Date()
          })
          .where(eq(disputes.id, newDispute.id));
        
        // Add admin to dispute chat
        await db.insert(chatGroupMembers).values({
          groupId: chatGroup.id,
          userId: admin.id,
          role: "admin"
        });
      }
      
      // Return complete dispute with relations
      const completeDispute = await db.query.disputes.findFirst({
        where: eq(disputes.id, newDispute.id),
        with: {
          raisedBy: {
            columns: {
              id: true,
              username: true
            }
          },
          assignedTo: {
            columns: {
              id: true,
              username: true,
              role: true
            }
          },
          transaction: {
            columns: {
              id: true,
              title: true,
              amount: true,
              currency: true
            }
          },
          milestone: true
        }
      });
      
      return res.status(201).json(completeDispute);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating dispute:", error);
      return res.status(500).json({ message: "Failed to create dispute" });
    }
  });

  app.get(`${apiPrefix}/disputes`, requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { status } = req.query;
      
      // Get user role
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { role: true }
      });
      
      let whereCondition;
      if (user?.role === ROLE.ADMIN) {
        // Admins can see all disputes or ones assigned to them
        whereCondition = status && typeof status === 'string'
          ? (disputes: any) => eq(disputes.status, status)
          : undefined;
      } else {
        // Regular users can only see disputes they raised or are part of the transaction
        whereCondition = async () => {
          // Get transactions where user is buyer or seller
          const userTransactions = await db.query.transactions.findMany({
            where: (transactions, { or, eq }) => or(
              eq(transactions.buyerId, userId),
              eq(transactions.sellerId, userId)
            ),
            columns: { id: true }
          });
          
          const transactionIds = userTransactions.map(t => t.id);
          
          return (disputes: any, { or, eq, and, inArray }: any) => {
            let conditions = or(
              eq(disputes.raisedById, userId),
              inArray(disputes.transactionId, transactionIds)
            );
            
            if (status && typeof status === 'string') {
              conditions = and(conditions, eq(disputes.status, status));
            }
            
            return conditions;
          };
        };
      }
      
      // Get disputes
      const allDisputes = await db.query.disputes.findMany({
        where: await whereCondition,
        with: {
          raisedBy: {
            columns: {
              id: true,
              username: true
            }
          },
          assignedTo: {
            columns: {
              id: true,
              username: true,
              role: true
            }
          },
          transaction: {
            columns: {
              id: true,
              title: true,
              amount: true,
              currency: true
            }
          },
          milestone: {
            columns: {
              id: true,
              title: true,
              amount: true
            }
          }
        },
        orderBy: [desc(disputes.createdAt)]
      });
      
      return res.json(allDisputes);
    } catch (error) {
      console.error("Error fetching disputes:", error);
      return res.status(500).json({ message: "Failed to fetch disputes" });
    }
  });

  app.get(`${apiPrefix}/disputes/:id`, requireAuth, async (req, res) => {
    try {
      const disputeId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      if (isNaN(disputeId)) {
        return res.status(400).json({ message: "Invalid dispute ID" });
      }
      
      // Get user role
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { role: true }
      });
      
      // Check if user has access to this dispute
      const dispute = await db.query.disputes.findFirst({
        where: eq(disputes.id, disputeId),
        with: {
          transaction: true
        }
      });
      
      if (!dispute) {
        return res.status(404).json({ message: "Dispute not found" });
      }
      
      const hasAccess = user?.role === ROLE.ADMIN || 
                         dispute.raisedById === userId ||
                         dispute.assignedToId === userId ||
                         dispute.transaction.buyerId === userId ||
                         dispute.transaction.sellerId === userId;
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Not authorized to view this dispute" });
      }
      
      // Get complete dispute with relations
      const completeDispute = await db.query.disputes.findFirst({
        where: eq(disputes.id, disputeId),
        with: {
          raisedBy: {
            columns: {
              id: true,
              username: true,
              email: true
            }
          },
          assignedTo: {
            columns: {
              id: true,
              username: true,
              role: true
            }
          },
          transaction: {
            with: {
              buyer: {
                columns: {
                  id: true,
                  username: true,
                  email: true
                }
              },
              seller: {
                columns: {
                  id: true,
                  username: true,
                  email: true
                }
              }
            }
          },
          milestone: true,
          evidence: {
            with: {
              submittedBy: {
                columns: {
                  id: true,
                  username: true
                }
              }
            },
            orderBy: [desc(disputeEvidence.createdAt)]
          }
        }
      });
      
      // Get messages from dispute chat group
      const chatGroup = await db.query.chatGroups.findFirst({
        where: eq(chatGroups.disputeId, disputeId),
        with: {
          members: {
            with: {
              user: {
                columns: {
                  id: true,
                  username: true
                }
              }
            }
          }
        }
      });
      
      return res.json({
        ...completeDispute,
        chatGroup
      });
    } catch (error) {
      console.error("Error fetching dispute:", error);
      return res.status(500).json({ message: "Failed to fetch dispute" });
    }
  });

  app.post(`${apiPrefix}/disputes/:id/evidence`, requireAuth, async (req, res) => {
    try {
      const disputeId = parseInt(req.params.id);
      const userId = req.session.userId;
      const { title, description, fileUrl, fileType } = req.body;
      
      if (isNaN(disputeId)) {
        return res.status(400).json({ message: "Invalid dispute ID" });
      }
      
      // Check if dispute exists and user is allowed to submit evidence
      const dispute = await db.query.disputes.findFirst({
        where: eq(disputes.id, disputeId),
        with: {
          transaction: true
        }
      });
      
      if (!dispute) {
        return res.status(404).json({ message: "Dispute not found" });
      }
      
      // Check if user is part of this dispute
      const isParticipant = dispute.raisedById === userId || 
                            dispute.transaction.buyerId === userId ||
                            dispute.transaction.sellerId === userId;
      
      if (!isParticipant) {
        return res.status(403).json({ message: "Not authorized to submit evidence for this dispute" });
      }
      
      // Create evidence
      const validatedData = insertEvidenceSchema.parse({
        title,
        description,
        fileUrl,
        fileType,
        disputeId,
        submittedById: userId
      });
      
      const [newEvidence] = await db.insert(disputeEvidence)
        .values(validatedData)
        .returning();
      
      // Create transaction log
      await db.insert(transactionLogs).values({
        transactionId: dispute.transactionId,
        milestoneId: dispute.milestoneId || null,
        userId,
        action: "evidence_submitted",
        details: { 
          disputeId: dispute.id,
          evidenceId: newEvidence.id,
          title: newEvidence.title
        }
      });
      
      // Return evidence with submitter info
      const completeEvidence = await db.query.disputeEvidence.findFirst({
        where: eq(disputeEvidence.id, newEvidence.id),
        with: {
          submittedBy: {
            columns: {
              id: true,
              username: true
            }
          }
        }
      });
      
      return res.status(201).json(completeEvidence);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error submitting evidence:", error);
      return res.status(500).json({ message: "Failed to submit evidence" });
    }
  });

  app.patch(`${apiPrefix}/disputes/:id/resolve`, requireAuth, async (req, res) => {
    try {
      const disputeId = parseInt(req.params.id);
      const userId = req.session.userId;
      const { resolution, resolutionType } = req.body;
      
      if (isNaN(disputeId)) {
        return res.status(400).json({ message: "Invalid dispute ID" });
      }
      
      if (!resolution || !resolutionType) {
        return res.status(400).json({ message: "Resolution and resolution type are required" });
      }
      
      // Verify user is admin or assigned to dispute
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { role: true }
      });
      
      const dispute = await db.query.disputes.findFirst({
        where: eq(disputes.id, disputeId),
        with: {
          transaction: true,
          milestone: true
        }
      });
      
      if (!dispute) {
        return res.status(404).json({ message: "Dispute not found" });
      }
      
      const isAssigned = dispute.assignedToId === userId;
      const isAdmin = user?.role === ROLE.ADMIN;
      
      if (!isAdmin && !isAssigned) {
        return res.status(403).json({ message: "Not authorized to resolve this dispute" });
      }
      
      // Process resolution based on type
      switch (resolutionType) {
        case 'refund':
          // Refund the buyer - escrow status changes to refunded
          await db.update(transactions)
            .set({
              status: "cancelled",
              escrowStatus: "refunded",
              updatedAt: new Date()
            })
            .where(eq(transactions.id, dispute.transactionId));
          
          // Update milestone statuses if applicable
          if (dispute.milestoneId) {
            await db.update(milestones)
              .set({
                status: "cancelled",
                escrowStatus: "refunded",
                updatedAt: new Date()
              })
              .where(eq(milestones.id, dispute.milestoneId));
          } else {
            // Update all milestones for this transaction
            await db.update(milestones)
              .set({
                status: "cancelled",
                escrowStatus: "refunded",
                updatedAt: new Date()
              })
              .where(eq(milestones.transactionId, dispute.transactionId));
          }
          break;
          
        case 'release':
          // Release funds to seller
          if (dispute.milestoneId) {
            // Release specific milestone
            await db.update(milestones)
              .set({
                status: "completed",
                escrowStatus: "released",
                completedAt: new Date(),
                updatedAt: new Date()
              })
              .where(eq(milestones.id, dispute.milestoneId));
            
            // Check if all milestones completed
            const allMilestones = await db.query.milestones.findMany({
              where: eq(milestones.transactionId, dispute.transactionId),
            });
            
            const allCompleted = allMilestones.every(m => m.status === "completed");
            
            if (allCompleted) {
              await db.update(transactions)
                .set({
                  status: "completed",
                  escrowStatus: "released",
                  updatedAt: new Date()
                })
                .where(eq(transactions.id, dispute.transactionId));
            } else {
              await db.update(transactions)
                .set({
                  status: "active", // Return to active state
                  updatedAt: new Date()
                })
                .where(eq(transactions.id, dispute.transactionId));
            }
          } else {
            // Release all milestones and complete transaction
            await db.update(milestones)
              .set({
                status: "completed",
                escrowStatus: "released",
                completedAt: new Date(),
                updatedAt: new Date()
              })
              .where(eq(milestones.transactionId, dispute.transactionId));
            
            await db.update(transactions)
              .set({
                status: "completed",
                escrowStatus: "released",
                updatedAt: new Date()
              })
              .where(eq(transactions.id, dispute.transactionId));
          }
          break;
          
        case 'partial':
          // Partial resolution - requires more complex handling in real implementation
          // This would typically involve custom refund/release amounts
          await db.update(transactions)
            .set({
              status: "completed", // Consider transaction completed but with special resolution
              updatedAt: new Date()
            })
            .where(eq(transactions.id, dispute.transactionId));
          break;
          
        case 'cancelled':
          // Cancel transaction
          await db.update(transactions)
            .set({
              status: "cancelled",
              updatedAt: new Date()
            })
            .where(eq(transactions.id, dispute.transactionId));
          
          await db.update(milestones)
            .set({
              status: "cancelled",
              updatedAt: new Date()
            })
            .where(eq(milestones.transactionId, dispute.transactionId));
          break;
          
        default:
          return res.status(400).json({ message: "Invalid resolution type" });
      }
      
      // Update dispute status
      const [resolvedDispute] = await db.update(disputes)
        .set({
          status: "resolved",
          resolution,
          resolutionType,
          updatedAt: new Date()
        })
        .where(eq(disputes.id, disputeId))
        .returning();
      
      // Create transaction log
      await db.insert(transactionLogs).values({
        transactionId: dispute.transactionId,
        milestoneId: dispute.milestoneId || null,
        userId,
        action: "dispute_resolved",
        details: { 
          disputeId,
          resolution,
          resolutionType
        }
      });
      
      return res.json(resolvedDispute);
    } catch (error) {
      console.error("Error resolving dispute:", error);
      return res.status(500).json({ message: "Failed to resolve dispute" });
    }
  });

  // Messaging
  app.get(`${apiPrefix}/chat-groups`, requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      // Get chat groups the user is a member of
      const userGroups = await db.query.chatGroupMembers.findMany({
        where: eq(chatGroupMembers.userId, userId),
        with: {
          group: {
            with: {
              transaction: {
                columns: {
                  id: true,
                  title: true
                }
              },
              dispute: {
                columns: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      });
      
      // Format the response
      const chatGroups = userGroups.map(membership => ({
        id: membership.group.id,
        name: membership.group.name,
        type: membership.group.type,
        transactionId: membership.group.transactionId,
        transactionTitle: membership.group.transaction?.title,
        disputeId: membership.group.disputeId,
        disputeTitle: membership.group.dispute?.title,
        role: membership.role,
        joinedAt: membership.joinedAt
      }));
      
      return res.json(chatGroups);
    } catch (error) {
      console.error("Error fetching chat groups:", error);
      return res.status(500).json({ message: "Failed to fetch chat groups" });
    }
  });

  app.get(`${apiPrefix}/chat-groups/:id/messages`, requireAuth, async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group ID" });
      }
      
      // Check if user is a member of this group
      const membership = await db.query.chatGroupMembers.findFirst({
        where: and(
          eq(chatGroupMembers.groupId, groupId),
          eq(chatGroupMembers.userId, userId)
        )
      });
      
      if (!membership) {
        return res.status(403).json({ message: "Not a member of this chat group" });
      }
      
      // Get messages
      const groupMessages = await db.query.messages.findMany({
        where: (messages, { or, and, eq }) => {
          const group = db.query.chatGroups.findFirst({
            where: eq(chatGroups.id, groupId)
          });
          
          if (!group) return false;
          
          return or(
            and(
              eq(messages.transactionId, group.transactionId || 0),
              not(isNull(group.transactionId))
            ),
            and(
              eq(messages.disputeId, group.disputeId || 0),
              not(isNull(group.disputeId))
            )
          );
        },
        with: {
          sender: {
            columns: {
              id: true,
              username: true
            }
          }
        },
        orderBy: [desc(messages.createdAt)]
      });
      
      // Mark unread messages as read
      await db.update(messages)
        .set({ isRead: true })
        .where(and(
          or(
            eq(messages.transactionId, groupMessages[0]?.transactionId || 0),
            eq(messages.disputeId, groupMessages[0]?.disputeId || 0)
          ),
          not(eq(messages.senderId, userId)),
          eq(messages.isRead, false)
        ));
      
      return res.json(groupMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      return res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post(`${apiPrefix}/chat-groups/:id/messages`, requireAuth, async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const userId = req.session.userId;
      const { content } = req.body;
      
      if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group ID" });
      }
      
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      // Check if user is a member of this group
      const membership = await db.query.chatGroupMembers.findFirst({
        where: and(
          eq(chatGroupMembers.groupId, groupId),
          eq(chatGroupMembers.userId, userId)
        )
      });
      
      if (!membership) {
        return res.status(403).json({ message: "Not a member of this chat group" });
      }
      
      // Get group info to determine message type
      const group = await db.query.chatGroups.findFirst({
        where: eq(chatGroups.id, groupId)
      });
      
      if (!group) {
        return res.status(404).json({ message: "Chat group not found" });
      }
      
      // Create message based on group type
      const messageData = {
        content,
        senderId: userId,
        transactionId: group.transactionId || null,
        disputeId: group.disputeId || null,
        isRead: false
      };
      
      const [newMessage] = await db.insert(messages)
        .values(messageData)
        .returning();
      
      // Get complete message with sender info
      const completeMessage = await db.query.messages.findFirst({
        where: eq(messages.id, newMessage.id),
        with: {
          sender: {
            columns: {
              id: true,
              username: true
            }
          }
        }
      });
      
      return res.status(201).json(completeMessage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error sending message:", error);
      return res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get(`${apiPrefix}/transaction-receipts/:id`, requireAuth, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      // Check if user is part of this transaction
      const transaction = await db.query.transactions.findFirst({
        where: (transactions, { and, or, eq }) => and(
          eq(transactions.id, transactionId),
          or(
            eq(transactions.buyerId, userId),
            eq(transactions.sellerId, userId)
          )
        ),
        with: {
          buyer: {
            columns: {
              id: true,
              username: true,
              email: true,
              fullName: true
            }
          },
          seller: {
            columns: {
              id: true,
              username: true,
              email: true,
              fullName: true
            }
          },
          milestones: true
        }
      });
      
      if (!transaction) {
        return res.status(403).json({ message: "Not authorized to view this transaction receipt" });
      }
      
      // Get transaction history
      const transactionHistory = await db.query.transactionLogs.findMany({
        where: eq(transactionLogs.transactionId, transactionId),
        with: {
          user: {
            columns: {
              id: true,
              username: true
            }
          }
        },
        orderBy: [desc(transactionLogs.createdAt)]
      });
      
      // Format the receipt data
      const receipt = {
        transactionId: transaction.id,
        title: transaction.title,
        description: transaction.description,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        escrowStatus: transaction.escrowStatus,
        paymentStatus: transaction.paymentStatus,
        paymentMethod: transaction.paymentMethod,
        createdAt: transaction.createdAt,
        completedAt: transaction.status === "completed" ? 
          transactionHistory.find(log => log.action === "transaction_completed")?.createdAt : 
          null,
        buyer: transaction.buyer,
        seller: transaction.seller,
        milestones: transaction.milestones.map(m => ({
          title: m.title,
          amount: m.amount,
          status: m.status,
          completedAt: m.completedAt
        })),
        history: transactionHistory.map(log => ({
          action: log.action,
          timestamp: log.createdAt,
          user: log.user?.username,
          details: log.details
        }))
      };
      
      return res.json(receipt);
    } catch (error) {
      console.error("Error generating receipt:", error);
      return res.status(500).json({ message: "Failed to generate receipt" });
    }
  });

  // Admin routes
  app.get(`${apiPrefix}/admin/users`, requireAdmin, async (req, res) => {
    try {
      const users = await db.query.users.findMany({
        columns: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          role: true,
          isVerified: true,
          createdAt: true
        },
        orderBy: [desc(users.createdAt)]
      });
      
      return res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get(`${apiPrefix}/admin/transactions`, requireAdmin, async (req, res) => {
    try {
      const transactions = await db.query.transactions.findMany({
        with: {
          buyer: {
            columns: {
              id: true,
              username: true,
              email: true
            }
          },
          seller: {
            columns: {
              id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: [desc(transactions.createdAt)]
      });
      
      return res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get(`${apiPrefix}/admin/disputes`, requireAdmin, async (req, res) => {
    try {
      const disputes = await db.query.disputes.findMany({
        with: {
          transaction: {
            columns: {
              id: true,
              title: true,
              amount: true,
              currency: true
            }
          },
          raisedBy: {
            columns: {
              id: true,
              username: true
            }
          },
          assignedTo: {
            columns: {
              id: true,
              username: true
            }
          }
        },
        orderBy: [desc(disputes.createdAt)]
      });
      
      return res.json(disputes);
    } catch (error) {
      console.error("Error fetching disputes:", error);
      return res.status(500).json({ message: "Failed to fetch disputes" });
    }
  });

  // Initialize WebSocket server
  const httpServer = createServer(app);
  return httpServer;
}
