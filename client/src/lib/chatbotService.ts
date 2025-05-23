import { apiRequest } from "./queryClient";

export interface ChatMessage {
  content: string;
  userId?: number;
  language?: "english" | "hindi" | "hinglish";
  timestamp?: Date;
  isBot?: boolean;
}

export interface FAQ {
  question: string;
  answer: string;
}

export const sendMessage = async (content: string, language?: "english" | "hindi" | "hinglish", isAuthenticated: boolean = true): Promise<string> => {
  try {
    // Use different endpoints based on authentication status
    const endpoint = isAuthenticated ? "/api/chatbot/message" : "/api/chatbot/public-message";
    
    const response = await apiRequest("POST", endpoint, {
      content,
      language,
    });
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Failed to send message:", error);
    throw error;
  }
};

export const getChatHistory = async (): Promise<ChatMessage[]> => {
  try {
    const response = await apiRequest("GET", "/api/chatbot/history");
    const messages = await response.json();
    
    // Process messages - bot messages have senderId = 0
    return messages.map((msg: any) => ({
      content: msg.content,
      userId: msg.senderId,
      timestamp: new Date(msg.createdAt),
      isBot: msg.senderId === 0,
    }));
  } catch (error) {
    console.error("Failed to get chat history:", error);
    return [];
  }
};

export const getFAQs = async (language: "english" | "hindi" | "hinglish" = "english"): Promise<FAQ[]> => {
  try {
    const response = await apiRequest("GET", `/api/chatbot/faqs?language=${language}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to get FAQs:", error);
    return [];
  }
};

export const clearChatHistory = async (): Promise<boolean> => {
  try {
    await apiRequest("DELETE", "/api/chatbot/history");
    return true;
  } catch (error) {
    console.error("Failed to clear chat history:", error);
    return false;
  }
};

// Initialize WebSocket connection
export const initChatbotWebSocket = (onMessageReceived: (message: ChatMessage) => void) => {
  try {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    
    // Use current hostname and port, defaulting to 5000 if needed
    const host = window.location.hostname || "localhost";
    
    // Create WebSocket URL without port specification (let browser handle it)
    const wsUrl = `${protocol}//${host}/ws/chatbot`;
    
    console.log(`Connecting to WebSocket at ${wsUrl}`);
    
    // Create WebSocket without any token
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log("WebSocket connection established");
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          const message: ChatMessage = {
            content: data.content,
            userId: data.senderId,
            timestamp: new Date(data.timestamp),
            isBot: true
          };
          onMessageReceived(message);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };
    
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };
    
    return {
      sendMessage: (content: string) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "message", content }));
        } else {
          console.error("WebSocket is not open");
        }
      },
      close: () => {
        socket.close();
      }
    };
  } catch (error) {
    console.error("Failed to initialize WebSocket:", error);
    
    // Return a dummy implementation that doesn't fail
    return {
      sendMessage: (content: string) => {
        console.log("WebSocket not available, message not sent:", content);
      },
      close: () => {}
    };
  }
};