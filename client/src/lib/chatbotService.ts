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

export const sendMessage = async (content: string, language?: "english" | "hindi" | "hinglish"): Promise<string> => {
  try {
    const response = await apiRequest("POST", "/api/chatbot/message", {
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
    
    return messages.map((msg: any) => ({
      content: msg.content,
      userId: msg.senderId,
      timestamp: new Date(msg.createdAt),
      isBot: msg.senderId !== msg.userId,
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
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/chatbot`;
  const socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log("WebSocket connection established");
  };
  
  socket.onmessage = (event) => {
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
};