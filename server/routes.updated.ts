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
import { WebSocketServer } from "ws";
import { registerMarketplaceApiRoutes } from "./marketplaceApi";
import { registerAdminApiRoutes } from "./adminApi";
import { setupSwagger } from "./swagger";

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
  // Register Swagger documentation
  setupSwagger(app);
  
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
  
  // Register marketplace API routes (OAuth2 protected)
  registerMarketplaceApiRoutes(app);
  
  // Register admin API routes
  registerAdminApiRoutes(app);

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

  // The rest of your existing routes...
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('Client connected');

    // Send welcome message
    ws.send(JSON.stringify({ type: 'connection', message: 'Connected to Middlesman Escrow WebSocket Server' }));

    // Handle messages from client
    ws.on('message', (message) => {
      console.log('Received message:', message);
      
      try {
        const parsedMessage = JSON.parse(message.toString());
        
        // Echo the message back for now
        // In a real app, you would handle different message types here
        ws.send(JSON.stringify({ 
          type: 'echo', 
          message: parsedMessage 
        }));
      } catch (error) {
        console.error('Error parsing message:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
  
  return httpServer;
}