import { Express, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { z } from "zod";
import { transactions, milestones, users, disputes, insertDisputeSchema, insertTransactionSchema, insertMilestoneSchema } from "../shared/schema";
import { eq, and, or, asc, desc } from "drizzle-orm";

// Define OAuth token validation schema
const oauthTokenSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().default("Bearer"),
});

type OAuthToken = z.infer<typeof oauthTokenSchema>;

// Define validation schema for creating a transaction
const createTransactionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  amount: z.coerce.number().positive("Amount must be positive"),
  type: z.string().min(1, "Type is required"),
  currency: z.string().length(3, "Currency must be a 3-letter code").default("USD"),
  dueDate: z.coerce.date().optional(),
  buyerId: z.coerce.number().int().positive("Buyer ID is required"),
  sellerId: z.coerce.number().int().positive("Seller ID is required"),
  paymentMethod: z.string().optional(),
  milestones: z.array(
    z.object({
      title: z.string().min(3, "Milestone title must be at least 3 characters"),
      description: z.string().min(10, "Milestone description must be at least 10 characters"),
      amount: z.coerce.number().positive("Milestone amount must be positive"),
      dueDate: z.coerce.date(),
    })
  ).optional(),
});

// Define validation schema for dispute creation
const createDisputeSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  transactionId: z.coerce.number().int().positive("Transaction ID is required"),
  milestoneId: z.coerce.number().int().positive("Milestone ID is required").optional(),
  raisedById: z.coerce.number().int().positive("User ID who raised the dispute is required"),
});

// Middleware for validating OAuth tokens
function validateOAuthToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid OAuth token" });
    }
    
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // In a real-world scenario, you would verify this token with your OAuth provider
    // For now, we'll just check if it has a valid format
    const parsedToken: OAuthToken = oauthTokenSchema.parse({ access_token: token });
    
    // Store the token in the request for later use
    (req as any).oauthToken = parsedToken;
    
    next();
  } catch (error) {
    console.error("OAuth token validation error:", error);
    return res.status(401).json({ message: "Invalid OAuth token" });
  }
}

// Register marketplace API routes
export function registerMarketplaceApiRoutes(app: Express) {
  const apiPrefix = "/api";
  
  // Apply OAuth validation middleware to all marketplace API routes
  app.use(`${apiPrefix}/marketplace`, validateOAuthToken);
  
  // POST /api/marketplace/transactions - Create a new transaction
  app.post(`${apiPrefix}/marketplace/transactions`, async (req: Request, res: Response) => {
    try {
      const validatedData = createTransactionSchema.parse(req.body);
      
      // Check if buyer and seller exist
      const buyer = await db.query.users.findFirst({
        where: eq(users.id, validatedData.buyerId),
      });
      
      if (!buyer) {
        return res.status(404).json({ message: "Buyer not found" });
      }
      
      const seller = await db.query.users.findFirst({
        where: eq(users.id, validatedData.sellerId),
      });
      
      if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
      }
      
      // Create transaction
      const [transaction] = await db.insert(transactions).values({
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        amount: validatedData.amount.toString(),
        currency: validatedData.currency,
        dueDate: validatedData.dueDate,
        status: "pending",
        escrowStatus: "awaiting_payment",
        paymentMethod: validatedData.paymentMethod,
        paymentStatus: "unpaid",
        buyerId: validatedData.buyerId,
        sellerId: validatedData.sellerId,
      }).returning();
      
      // Create milestones if provided
      if (validatedData.milestones && validatedData.milestones.length > 0) {
        const milestonesData = validatedData.milestones.map(milestone => ({
          title: milestone.title,
          description: milestone.description,
          amount: milestone.amount.toString(),
          dueDate: milestone.dueDate,
          status: "pending",
          escrowStatus: "awaiting_funding",
          transactionId: transaction.id,
        }));
        
        const createdMilestones = await db.insert(milestones).values(milestonesData).returning();
        
        // Return transaction with milestones
        return res.status(201).json({
          ...transaction,
          milestones: createdMilestones,
        });
      }
      
      return res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create transaction" });
    }
  });
  
  // GET /api/marketplace/transactions/:id - Get transaction details
  app.get(`${apiPrefix}/marketplace/transactions/:id`, async (req: Request, res: Response) => {
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
  
  // POST /api/marketplace/transactions/:id/release - Release funds
  app.post(`${apiPrefix}/marketplace/transactions/:id/release`, async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { milestoneId } = req.body;
      
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      const transaction = await db.query.transactions.findFirst({
        where: eq(transactions.id, transactionId),
      });
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // If milestone ID is provided, release funds for that specific milestone
      if (milestoneId) {
        const milestone = await db.query.milestones.findFirst({
          where: and(
            eq(milestones.id, milestoneId),
            eq(milestones.transactionId, transactionId)
          ),
        });
        
        if (!milestone) {
          return res.status(404).json({ message: "Milestone not found" });
        }
        
        // Update milestone status
        await db.update(milestones)
          .set({
            status: "completed",
            escrowStatus: "released",
            completedAt: new Date(),
          })
          .where(eq(milestones.id, milestoneId));
        
        // Check if all milestones are completed
        const allMilestones = await db.query.milestones.findMany({
          where: eq(milestones.transactionId, transactionId),
        });
        
        const allCompleted = allMilestones.every(m => m.status === "completed");
        
        // If all milestones are completed, mark transaction as completed
        if (allCompleted) {
          await db.update(transactions)
            .set({
              status: "completed",
              escrowStatus: "released",
            })
            .where(eq(transactions.id, transactionId));
        }
        
        return res.json({ message: "Milestone funds released successfully" });
      } else {
        // Release funds for the entire transaction
        await db.update(transactions)
          .set({
            status: "completed",
            escrowStatus: "released",
          })
          .where(eq(transactions.id, transactionId));
        
        // Update all milestones to completed
        await db.update(milestones)
          .set({
            status: "completed",
            escrowStatus: "released",
            completedAt: new Date(),
          })
          .where(eq(milestones.transactionId, transactionId));
        
        return res.json({ message: "Transaction funds released successfully" });
      }
    } catch (error) {
      console.error("Error releasing funds:", error);
      return res.status(500).json({ message: "Failed to release funds" });
    }
  });
  
  // POST /api/marketplace/transactions/:id/refund - Initiate a refund
  app.post(`${apiPrefix}/marketplace/transactions/:id/refund`, async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { milestoneId, reason } = req.body;
      
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      const transaction = await db.query.transactions.findFirst({
        where: eq(transactions.id, transactionId),
      });
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // If milestone ID is provided, refund that specific milestone
      if (milestoneId) {
        const milestone = await db.query.milestones.findFirst({
          where: and(
            eq(milestones.id, milestoneId),
            eq(milestones.transactionId, transactionId)
          ),
        });
        
        if (!milestone) {
          return res.status(404).json({ message: "Milestone not found" });
        }
        
        // Update milestone status
        await db.update(milestones)
          .set({
            status: "refunded",
            escrowStatus: "refunded",
            rejectionReason: reason || "Refunded via API",
          })
          .where(eq(milestones.id, milestoneId));
        
        return res.json({ message: "Milestone refund initiated successfully" });
      } else {
        // Refund the entire transaction
        await db.update(transactions)
          .set({
            status: "refunded",
            escrowStatus: "refunded",
          })
          .where(eq(transactions.id, transactionId));
        
        // Update all milestones to refunded
        await db.update(milestones)
          .set({
            status: "refunded",
            escrowStatus: "refunded",
            rejectionReason: reason || "Refunded via API",
          })
          .where(eq(milestones.transactionId, transactionId));
        
        return res.json({ message: "Transaction refund initiated successfully" });
      }
    } catch (error) {
      console.error("Error initiating refund:", error);
      return res.status(500).json({ message: "Failed to initiate refund" });
    }
  });
  
  // POST /api/marketplace/transactions/:id/dispute - Raise a dispute
  app.post(`${apiPrefix}/marketplace/transactions/:id/dispute`, async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      const transaction = await db.query.transactions.findFirst({
        where: eq(transactions.id, transactionId),
      });
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Validate dispute data
      const validatedData = createDisputeSchema.parse({
        ...req.body,
        transactionId,
      });
      
      // Create dispute
      const [dispute] = await db.insert(disputes).values({
        title: validatedData.title,
        description: validatedData.description,
        status: "open",
        transactionId: validatedData.transactionId,
        milestoneId: validatedData.milestoneId,
        raisedById: validatedData.raisedById,
      }).returning();
      
      // Update transaction status to disputed
      await db.update(transactions)
        .set({ status: "disputed" })
        .where(eq(transactions.id, transactionId));
      
      // If milestone ID is provided, update that milestone status
      if (validatedData.milestoneId) {
        await db.update(milestones)
          .set({ status: "disputed" })
          .where(eq(milestones.id, validatedData.milestoneId));
      }
      
      return res.status(201).json(dispute);
    } catch (error) {
      console.error("Error creating dispute:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create dispute" });
    }
  });
  
  // Webhook registration endpoint
  app.post(`${apiPrefix}/marketplace/webhooks`, async (req: Request, res: Response) => {
    try {
      const { callbackUrl, events } = req.body;
      
      if (!callbackUrl || !Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ 
          message: "Invalid webhook configuration. Please provide a callbackUrl and at least one event." 
        });
      }
      
      // In a real implementation, you would store this webhook configuration
      // For now, we'll just return a success message
      return res.status(201).json({
        id: "webhook_" + Date.now(),
        callbackUrl,
        events,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error registering webhook:", error);
      return res.status(500).json({ message: "Failed to register webhook" });
    }
  });
}