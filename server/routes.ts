import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { users, transactions, milestones, insertUserSchema, insertTransactionSchema, insertMilestoneSchema } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import bcrypt from "bcrypt";
import { z } from "zod";
import { ZodError } from "zod-validation-error";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "@db";

const PgStore = pgSession(session);

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
      
      // Create user
      const [newUser] = await db.insert(users).values({
        username: validatedData.username,
        password: hashedPassword,
      }).returning({ id: users.id, username: users.username });
      
      // Set session
      req.session.userId = newUser.id;
      
      return res.status(201).json({ id: newUser.id, username: newUser.username });
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
      
      return res.json({ id: user.id, username: user.username });
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
    
    // Get current user
    db.query.users.findFirst({
      where: eq(users.id, req.session.userId),
      columns: {
        id: true,
        username: true,
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

  // Transaction routes
  app.get(`${apiPrefix}/transactions`, requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      // Get all transactions where user is either buyer or seller
      const userTransactions = await db.query.transactions.findMany({
        where: (transactions, { or, eq }) => or(
          eq(transactions.buyerId, userId),
          eq(transactions.sellerId, userId)
        ),
        with: {
          buyer: {
            columns: {
              id: true,
              username: true,
            },
          },
          seller: {
            columns: {
              id: true,
              username: true,
            }
          },
          milestones: true,
        },
        orderBy: [desc(transactions.createdAt)],
      });
      
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
      
      // Get transaction with related data
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
            },
          },
          seller: {
            columns: {
              id: true,
              username: true,
            }
          },
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

  app.post(`${apiPrefix}/transactions`, requireAuth, async (req, res) => {
    try {
      const buyerId = req.session.userId;
      
      // Find seller by email (for simplicity in this implementation)
      const sellerEmail = req.body.sellerEmail;
      const seller = await db.query.users.findFirst({
        where: eq(users.username, sellerEmail),
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
        buyerId,
        sellerId: seller.id,
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
          transactionId: newTransaction.id,
        }));
        
        await db.insert(milestones).values(milestonesData);
      }
      
      // Get complete transaction with relations
      const completeTransaction = await db.query.transactions.findFirst({
        where: eq(transactions.id, newTransaction.id),
        with: {
          buyer: {
            columns: {
              id: true,
              username: true,
            },
          },
          seller: {
            columns: {
              id: true,
              username: true,
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

  // Milestone routes
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
      
      // Update milestone status
      const [updatedMilestone] = await db.update(milestones)
        .set({
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(milestones.id, milestoneId),
          eq(milestones.transactionId, transactionId)
        ))
        .returning();
      
      if (!updatedMilestone) {
        return res.status(404).json({ message: "Milestone not found" });
      }
      
      // Check if all milestones are completed to update transaction status
      const allMilestones = await db.query.milestones.findMany({
        where: eq(milestones.transactionId, transactionId),
      });
      
      const allCompleted = allMilestones.every(m => m.status === "completed");
      
      if (allCompleted) {
        await db.update(transactions)
          .set({
            status: "completed",
            updatedAt: new Date()
          })
          .where(eq(transactions.id, transactionId));
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

  const httpServer = createServer(app);
  return httpServer;
}
