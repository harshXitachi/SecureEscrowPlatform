import WebSocket, { WebSocketServer } from "ws";
import { Server } from "http";
import { generateChatbotResponse, ChatMessage } from "./chatbotService";
import { parse } from "cookie";
import pgSession from "connect-pg-simple";
import session from "express-session";
import { pool } from "@db";
import { z } from "zod";

// Message validation schema
const wsMessageSchema = z.object({
  type: z.enum(["message", "ping"]),
  content: z.string().optional(),
  language: z.enum(["english", "hindi", "hinglish"]).optional(),
});

type WebSocketMessageType = z.infer<typeof wsMessageSchema>;

// Initialize session store
const PgStore = pgSession(session);
const sessionStore = new PgStore({
  pool: pool,
  tableName: "session",
});

// Function to get session from cookie
async function getSessionFromCookie(cookieHeader: string | undefined): Promise<any> {
  if (!cookieHeader) {
    return null;
  }
  
  try {
    const cookies = parse(cookieHeader);
    const sessionId = cookies["connect.sid"]?.split(".")[0].slice(2);
    
    if (!sessionId) {
      return null;
    }
    
    return new Promise((resolve) => {
      sessionStore.get(sessionId, (err, session) => {
        if (err || !session) {
          resolve(null);
        } else {
          resolve(session);
        }
      });
    });
  } catch (error) {
    console.error("Error parsing session cookie:", error);
    return null;
  }
}

// Connection tracking
interface ConnectionInfo {
  userId: number;
  username: string;
}

// Setup WebSockets for chatbot
export function setupChatbotWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws/chatbot" });
  
  // Map to store active connections
  const connections = new Map<WebSocket, ConnectionInfo>();
  
  wss.on("connection", async (ws, req) => {
    console.log("New WebSocket connection request for chatbot");
    
    // Get session from cookie
    const session = await getSessionFromCookie(req.headers.cookie);
    
    if (!session || !session.userId) {
      console.log("Unauthorized WebSocket connection attempt");
      ws.close(1008, "Unauthorized");
      return;
    }
    
    console.log(`User ${session.userId} connected to chatbot WebSocket`);
    
    // Store connection info
    connections.set(ws, {
      userId: session.userId,
      username: session.username || "Anonymous",
    });
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: "connection",
      message: "Connected to Middlesman Chatbot",
    }));
    
    // Handle messages from client
    ws.on("message", async (message) => {
      try {
        const parsedMessage = JSON.parse(message.toString());
        const validatedMessage = wsMessageSchema.parse(parsedMessage);
        
        if (validatedMessage.type === "ping") {
          // Respond to ping message
          ws.send(JSON.stringify({ type: "pong" }));
          return;
        }
        
        if (validatedMessage.type === "message" && validatedMessage.content) {
          const connectionInfo = connections.get(ws);
          
          if (!connectionInfo) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Session expired, please refresh the page",
            }));
            return;
          }
          
          // Create message object
          const chatMessage: ChatMessage = {
            content: validatedMessage.content,
            userId: connectionInfo.userId,
            language: validatedMessage.language,
          };
          
          // Generate response
          const response = await generateChatbotResponse(chatMessage);
          
          // Send response back
          ws.send(JSON.stringify({
            type: "message",
            content: response,
            timestamp: new Date().toISOString(),
          }));
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
        ws.send(JSON.stringify({
          type: "error",
          message: "Invalid message format",
        }));
      }
    });
    
    // Handle disconnection
    ws.on("close", () => {
      const connectionInfo = connections.get(ws);
      if (connectionInfo) {
        console.log(`User ${connectionInfo.userId} disconnected from chatbot WebSocket`);
        connections.delete(ws);
      }
    });
    
    // Handle errors
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      ws.close(1011, "Internal server error");
    });
  });
  
  // Heartbeat interval to keep connections alive
  setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "heartbeat" }));
      }
    });
  }, 30000);
  
  return wss;
}