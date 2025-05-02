import { Express, Request, Response } from "express";
import { generateChatbotResponse, getFAQs, ChatMessage } from "./chatbotService";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { db } from "@db";
import { messages } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

// Validate message middleware
const validateMessage = (req: Request, res: Response, next: Function) => {
  try {
    const messageSchema = z.object({
      content: z.string().min(1, "Message cannot be empty"),
      language: z.enum(["english", "hindi", "hinglish"]).optional(),
    });
    
    messageSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: fromZodError(error).message });
    }
    return res.status(400).json({ message: "Invalid message format" });
  }
};

export function registerChatbotApiRoutes(app: Express) {
  const apiPrefix = "/api";
  
  // Middleware to require authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };
  
  // Route to send a message to the chatbot for logged in users
  app.post(`${apiPrefix}/chatbot/message`, requireAuth, validateMessage, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { content, language } = req.body;
      
      // Create message object for the AI service
      const message: ChatMessage = {
        content,
        userId,
        language,
      };
      
      // Save user message to the database
      await db.insert(messages).values({
        content,
        senderId: userId, // This is the correct field name in our messages table
        isRead: true,
      });
      
      // Generate response
      const response = await generateChatbotResponse(message);
      
      // Save bot's response to the database (using system user ID 0 for bot)
      await db.insert(messages).values({
        content: response,
        senderId: 0, // Using ID 0 to represent the system/bot
        isRead: true,
      });
      
      return res.json({ response });
    } catch (error) {
      console.error("Error sending message to chatbot:", error);
      return res.status(500).json({ message: "Failed to communicate with chatbot" });
    }
  });
  
  // Route to get chat history
  app.get(`${apiPrefix}/chatbot/history`, requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      // Get chat history for both user messages and bot responses
      // For simplicity, we're getting messages where the user is the sender or where the bot (senderId=0) is the sender
      const chatHistory = await db.query.messages.findMany({
        where: userId !== undefined ? 
          sql`(${messages.senderId} = ${userId} OR ${messages.senderId} = 0)` : 
          undefined,
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
        limit: 50,
      });
      
      return res.json(chatHistory);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      return res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });
  
  // Public endpoint for non-authenticated users to get basic chatbot responses
  app.post(`${apiPrefix}/chatbot/public-message`, validateMessage, async (req, res) => {
    try {
      const { content, language } = req.body;
      
      // Create message object for the AI service with a guest user ID
      const message: ChatMessage = {
        content,
        userId: -1, // Using -1 for guest users
        language,
      };
      
      // Generate response - but no storage for public messages
      // This limits server storage usage while still providing value
      const response = await generateChatbotResponse(message);
      
      return res.json({ response });
    } catch (error) {
      console.error("Error sending public message to chatbot:", error);
      return res.status(500).json({ message: "Failed to communicate with chatbot" });
    }
  });
  
  // Route to get FAQs
  app.get(`${apiPrefix}/chatbot/faqs`, async (req, res) => {
    try {
      const language = (req.query.language as "english" | "hindi" | "hinglish") || "english";
      const faqs = getFAQs(language);
      
      return res.json(faqs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      return res.status(500).json({ message: "Failed to fetch FAQs" });
    }
  });
  
  // Route to clear chat history
  app.delete(`${apiPrefix}/chatbot/history`, requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      // Delete chat history for this user and related bot messages
      if (userId !== undefined) {
        await db.delete(messages).where(
          sql`(${messages.senderId} = ${userId} OR ${messages.senderId} = 0)`
        );
      }
      
      return res.json({ message: "Chat history cleared successfully" });
    } catch (error) {
      console.error("Error clearing chat history:", error);
      return res.status(500).json({ message: "Failed to clear chat history" });
    }
  });
}