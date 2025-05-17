import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "./glass-card";
import { GlassButton } from "./glass-button";
import { User, Transaction } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { Send, Paperclip, ChevronRight, ChevronDown } from "lucide-react";

interface Message {
  id: number;
  senderId: number;
  sender: User;
  content: string;
  timestamp: string;
  transactionId: number;
}

interface TransactionChatProps {
  transaction: Transaction;
  isCollapsible?: boolean;
}

export default function TransactionChat({
  transaction, 
  isCollapsible = false
}: TransactionChatProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(!isCollapsible);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Mock messages data (since we don't have a real API yet)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      senderId: transaction.buyerId,
      sender: transaction.buyer,
      content: "Hello! I'm excited to work on this project with you both.",
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
      transactionId: transaction.id
    },
    {
      id: 2,
      senderId: transaction.sellerId,
      sender: transaction.seller,
      content: "Thanks for choosing me for this project. I have reviewed the requirements and I'm ready to start.",
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
      transactionId: transaction.id
    },
    {
      id: 3,
      senderId: transaction.brokerId || 0,
      sender: transaction.broker || { id: 0, username: "System" },
      content: "Welcome to the transaction chat! This is a secure channel for all parties to communicate.",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
      transactionId: transaction.id
    }
  ]);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    if (messagesEndRef.current && isExpanded) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isExpanded]);

  // Format time for messages
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format date
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Check if message belongs to a different day than previous message
  const shouldShowDate = (index: number, timestamp: string) => {
    if (index === 0) return true;
    
    const prevDate = new Date(messages[index - 1].timestamp).setHours(0, 0, 0, 0);
    const currDate = new Date(timestamp).setHours(0, 0, 0, 0);
    
    return prevDate !== currDate;
  };

  // Handle sending a new message
  const handleSendMessage = () => {
    if (!message.trim() || !user) return;

    const newMessage: Message = {
      id: Math.max(0, ...messages.map(m => m.id)) + 1,
      senderId: user.id,
      sender: {
        id: user.id,
        username: user.username
      },
      content: message.trim(),
      timestamp: new Date().toISOString(),
      transactionId: transaction.id
    };

    setMessages(prevMessages => [...prevMessages, newMessage]);
    setMessage("");
  };

  // Handle pressing Enter to send a message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <GlassCard className="overflow-hidden">
      {/* Header */}
      <div 
        className={`p-4 border-b border-white/10 flex justify-between items-center ${isCollapsible ? 'cursor-pointer' : ''}`}
        onClick={isCollapsible ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div>
          <h3 className="text-lg font-semibold text-white">Transaction Chat</h3>
          <p className="text-white/60 text-sm">
            {transaction.buyer.username}, {transaction.seller.username}
            {transaction.broker && `, ${transaction.broker.username}`}
          </p>
        </div>
        
        {isCollapsible && (
          <button className="text-white/60 hover:text-white transition-colors">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      
      {isExpanded && (
        <>
          {/* Chat Messages */}
          <div className="p-4 h-[300px] overflow-y-auto bg-black/20">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={msg.id}>
                  {shouldShowDate(index, msg.timestamp) && (
                    <div className="flex justify-center my-4">
                      <div className="px-3 py-1 bg-white/10 rounded-full text-white/60 text-xs">
                        {formatDate(msg.timestamp)}
                      </div>
                    </div>
                  )}
                  
                  <div
                    className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.senderId === user?.id
                          ? 'bg-primary/30 text-white ml-auto'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-medium ${
                          msg.senderId === transaction.buyerId ? 'text-cyan-400' :
                          msg.senderId === transaction.sellerId ? 'text-pink-400' :
                          'text-green-400'
                        }`}>
                          {msg.sender.username}
                        </span>
                        <span className="text-white/50 text-xs ml-2">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Input Box */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-end">
              <div className="flex-grow relative">
                <textarea
                  className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary min-h-[60px] max-h-[150px]"
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  className="absolute bottom-2 right-2 text-white/60 hover:text-white transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>
              <GlassButton
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="ml-3"
                size="sm"
              >
                <Send className="w-4 h-4" />
              </GlassButton>
            </div>
          </div>
        </>
      )}
    </GlassCard>
  );
} 