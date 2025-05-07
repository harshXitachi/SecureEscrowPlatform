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
  try {
    const wss = new WebSocketServer({ server, path: "/ws/chatbot" });
    
    console.log("Chatbot WebSocket server initialized at /ws/chatbot");
    
    // Map to store active connections
    const connections = new Map<WebSocket, ConnectionInfo>();
    
    wss.on("connection", async (ws, req) => {
      console.log("New WebSocket connection request for chatbot");
      
      try {
        // Parse URL to get token from query string if present
        const url = new URL(req.url || "", `http://${req.headers.host || 'localhost'}`);
        
        // Try to get session from cookie
        const session = await getSessionFromCookie(req.headers.cookie);
        
        // For development environment: allow connections without authentication
        if (!session || !session.userId) {
          console.log("Using anonymous connection for development");
          
          // Store connection with anonymous info for development
          connections.set(ws, {
            userId: 0,
            username: "Anonymous",
          });
          
          // Send welcome message
          ws.send(JSON.stringify({
            type: "connection",
            message: "Connected to Middlesman Chatbot (Development Mode)",
          }));
        } else {
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
        }
      } catch (error) {
        console.error("Error handling WebSocket connection:", error);
        // Send error message to client
        try {
          ws.send(JSON.stringify({
            type: "error",
            message: "Connection error, please refresh and try again",
          }));
        } catch (e) {
          console.error("Failed to send error message:", e);
        }
      }
      
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
            
            try {
              // Generate response
              const response = await generateChatbotResponse(chatMessage);
              
              // Send response back
              ws.send(JSON.stringify({
                type: "message",
                content: response,
                timestamp: new Date().toISOString(),
              }));
            } catch (error) {
              console.error("Error generating chatbot response:", error);
              ws.send(JSON.stringify({
                type: "error",
                message: "Failed to generate response. Please try again later.",
              }));
            }
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
          try {
            ws.send(JSON.stringify({
              type: "error",
              message: "Invalid message format",
            }));
          } catch (e) {
            console.error("Failed to send error message:", e);
          }
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
        try {
          ws.close(1011, "Internal server error");
        } catch (e) {
          console.error("Failed to close WebSocket connection:", e);
        }
      });
    });
    
    // Heartbeat interval to keep connections alive
    const heartbeatInterval = setInterval(() => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(JSON.stringify({ type: "heartbeat" }));
          } catch (error) {
            console.error("Failed to send heartbeat:", error);
            try {
              client.close(1011, "Internal server error");
            } catch (e) {
              console.error("Failed to close WebSocket connection:", e);
            }
          }
        }
      });
    }, 30000);
    
    // Clean up interval if server closes
    server.on('close', () => {
      clearInterval(heartbeatInterval);
    });
    
    return wss;
  } catch (error) {
    console.error("Failed to setup WebSocket server:", error);
    // Return a dummy WebSocketServer to prevent application crash
    return {
      on: () => {},
      clients: new Set(),
    } as unknown as WebSocketServer;
  }
}