import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { db, mockUsers } from "@db";
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
import { WebSocketServer } from "ws";
import { registerMarketplaceApiRoutes } from "./marketplaceApi";
import { registerAdminApiRoutes } from "./adminApi";
import { setupSwagger } from "./swagger";
import { registerChatbotApiRoutes } from "./chatbotApi";
import { setupChatbotWebSocket } from "./chatbotWebSocket";
import { registerContentApiRoutes } from "./contentApi";

// Extend the session interface to include custom properties
declare module 'express-session' {
  interface SessionData {
    userId: number;
    username: string;
  }
}

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
        secure: process.env.NODE_ENV === "production"
      }
    })
  );
  
  // Register API documentation with Swagger
  setupSwagger(app);

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
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
  
  // Register marketplace API endpoints (OAuth 2.0 protected)
  registerMarketplaceApiRoutes(app);
  
  // Register admin API endpoints
  registerAdminApiRoutes(app);
  
  // Register chatbot API endpoints
  registerChatbotApiRoutes(app);
  
  // Register content API endpoints
  registerContentApiRoutes(app);

  // Test route for debugging
  app.get(`${apiPrefix}/test/db`, async (req, res) => {
    try {
      console.log("DB test route called");
      
      // Get all mock users for debugging
      const users = await db.query.users.findMany();
      
      // For security, don't return password hashes
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role,
        hasPassword: !!user.password,
        createdAt: user.createdAt
      }));
      
      return res.json({
        status: "Database connection successful",
        mockMode: !process.env.DATABASE_URL,
        userCount: safeUsers.length,
        users: safeUsers
      });
    } catch (error) {
      console.error("Error in test route:", error);
      return res.status(500).json({
        status: "Database connection error",
        error: error.message
      });
    }
  });

  // Auth routes
  app.post(`${apiPrefix}/auth/register`, async (req, res) => {
    try {
      console.log("Registration attempt:", req.body);
      
      // Basic validation
      if (!req.body.username || !req.body.password) {
        console.log("Registration failed: missing username or password");
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Normalize username and password
      const username = String(req.body.username).trim();
      const password = String(req.body.password);
      
      console.log(`Registration - Normalized values - Username: ${username}, Password length: ${password.length}`);
      
      // Check if username is valid
      if (username.length < 3) {
        console.log("Registration failed: username too short");
        return res.status(400).json({ message: "Username must be at least 3 characters" });
      }
      
      // Check if password is valid
      if (password.length < 6) {
        console.log("Registration failed: password too short");
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      // Simplified registration flow - reduce nesting for better error handling
      
      // Step 1: Check if username already exists
      let existingUser = null;
      try {
        existingUser = await db.query.users.findFirst({
          where: eq(users.username, username),
        });
        console.log("Existing user check result:", existingUser ? "Found" : "Not found");
      } catch (findError) {
        console.error("Error checking for existing user:", findError);
        return res.status(500).json({ message: "Error checking username availability" });
      }
      
      if (existingUser) {
        console.log(`Registration failed: username ${username} already exists`);
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Step 2: Hash the password
      let hashedPassword;
      try {
        console.log("Hashing password");
        const saltRounds = 10;
        hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log("Password hashed successfully");
      } catch (hashError) {
        console.error("Error hashing password:", hashError);
        return res.status(500).json({ message: "Error processing password" });
      }
      
      // Step 3: Create the user
      let newUser;
      try {
        console.log(`Creating new user: ${username}`);
        [newUser] = await db.insert(users).values({
          username: username,
          password: hashedPassword,
          role: 'user' // Explicitly set role
        }).returning({ 
          id: users.id, 
          username: users.username,
          role: users.role
        });
        
        console.log("User created successfully:", newUser);
      } catch (insertError) {
        console.error("Error inserting user:", insertError);
        
        // Check if error is due to duplicate username (race condition)
        if (insertError.code === "UNIQUE_VIOLATION" || 
            insertError.message?.includes("already exists") || 
            insertError.code === "23505") {
          return res.status(400).json({ message: "Username already exists" });
        }
        
        return res.status(500).json({ message: "Error creating user account" });
      }
      
      // Step 4: Set session
      if (!newUser || !newUser.id) {
        console.error("User created but missing ID:", newUser);
        return res.status(500).json({ message: "User account created but session could not be initialized" });
      }
      
      req.session.userId = newUser.id;
      req.session.username = newUser.username;
      
      console.log(`User registered successfully: ${newUser.username} (ID: ${newUser.id})`);
      return res.status(201).json(newUser);
    } catch (error) {
      console.error("Unhandled error during registration:", error);
      return res.status(500).json({ message: "Internal server error during registration" });
    }
  });

  app.post(`${apiPrefix}/auth/login`, async (req, res) => {
    try {
      // Normalize inputs to avoid whitespace issues
      const username = String(req.body.username || '').trim();
      const password = String(req.body.password || '').trim();
      
      console.log(`Login attempt for user: ${username}, password provided: ${password ? 'yes' : 'no'}`);
      
      if (!username || !password) {
        console.log("Login failed: missing username or password");
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // REGULAR USER LOGIN - use mockUsers directly
      if (!process.env.DATABASE_URL) {
        console.log(`Looking up user directly in mockUsers array: ${username}`);
        
        // Find user
        const user = mockUsers.find(u => u.username === username);
        
        if (!user) {
          console.log(`User not found in mockUsers array: ${username}`);
          return res.status(401).json({ message: "Invalid credentials" });
        }
        
        try {
          // Verify password
          const isMatch = await bcrypt.compare(password, user.password);
          
          if (isMatch) {
            req.session.userId = user.id;
            req.session.username = user.username;
            
            console.log(`Regular user login successful: ${username}`);
            return res.json({
              id: user.id,
              username: user.username,
              role: user.role || 'user',
              createdAt: user.createdAt || new Date()
            });
          } else {
            console.log(`Password mismatch for user: ${username}`);
            return res.status(401).json({ message: "Invalid credentials" });
          }
        } catch (err) {
          console.error("Password verification error:", err);
          return res.status(401).json({ message: "Invalid credentials" });
        }
      }
      
      // REAL DATABASE USERS (when DATABASE_URL is set)
      try {
        const user = await db.query.users.findFirst({
          where: eq(users.username, username),
          columns: {
            id: true,
            username: true,
            password: true,
            role: true,
            createdAt: true
          }
        });
        
        if (!user) {
          console.log(`User not found in database: ${username}`);
          return res.status(401).json({ message: "Invalid credentials" });
        }
        
        if (!user.password) {
          console.error(`User found but missing password field: ${username}`);
          return res.status(500).json({ message: "Account configuration error" });
        }
        
        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
          console.log(`Invalid password for database user: ${username}`);
          return res.status(401).json({ message: "Invalid credentials" });
        }
        
        // Set session
        req.session.userId = user.id;
        req.session.username = user.username;
        
        // Return user data
        console.log(`Database user login successful: ${username}`);
        return res.json({
          id: user.id,
          username: user.username,
          role: user.role || 'user',
          createdAt: user.createdAt
        });
      } catch (error) {
        console.error("Database error during login:", error);
        return res.status(500).json({ message: "Database error occurred" });
      }
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
    
    // Get current user - include all necessary fields including role
    db.query.users.findFirst({
      where: eq(users.id, req.session.userId),
      columns: {
        id: true,
        username: true,
        createdAt: true,
        role: true,
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
              username: true
            },
          },
          seller: {
            columns: {
              id: true,
              username: true
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
              username: true
            },
          },
          seller: {
            columns: {
              id: true,
              username: true
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
              username: true
            },
          },
          seller: {
            columns: {
              id: true,
              username: true
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

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup chatbot WebSocket
  setupChatbotWebSocket(httpServer);
  
  return httpServer;
}