import React, { useState, useEffect, useRef } from "react";
import { Send, X, Minimize2, Maximize2, Info, CornerDownLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { 
  sendMessage, 
  getChatHistory, 
  getFAQs, 
  clearChatHistory, 
  initChatbotWebSocket, 
  type ChatMessage, 
  type FAQ 
} from "@/lib/chatbotService";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { useMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

const languageOptions = [
  { value: "english", label: "English" },
  { value: "hindi", label: "हिन्दी" },
  { value: "hinglish", label: "Hinglish" },
] as const;

type Language = "english" | "hindi" | "hinglish";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>("english");
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const mobileState = useMobile();
  const { toast } = useToast();
  const websocketRef = useRef<ReturnType<typeof initChatbotWebSocket> | null>(null);

  // Load chat history when widget opens
  useEffect(() => {
    if (isOpen) {
      const loadChatHistory = async () => {
        if (user) {
          try {
            const history = await getChatHistory();
            setMessages(history);
          } catch (error) {
            console.error("Failed to load chat history:", error);
          }
        }
      };

      const loadFaqs = async () => {
        try {
          const faqData = await getFAQs(language);
          setFaqs(faqData);
        } catch (error) {
          console.error("Failed to load FAQs:", error);
        }
      };

      loadChatHistory();
      loadFaqs();
    }
  }, [isOpen, user, language]);

  // Setup WebSocket connection
  useEffect(() => {
    if (isOpen && user) {
      const onMessageReceived = (message: ChatMessage) => {
        setMessages(prevMessages => [...prevMessages, message]);
      };

      websocketRef.current = initChatbotWebSocket(onMessageReceived);

      return () => {
        if (websocketRef.current) {
          websocketRef.current.close();
        }
      };
    }
  }, [isOpen, user]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !user) return;
    
    const userMessage: ChatMessage = {
      content: inputValue,
      userId: user.id,
      isBot: false,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    try {
      // Use WebSocket if available, fallback to HTTP API
      if (websocketRef.current) {
        websocketRef.current.sendMessage(inputValue);
      } else {
        const response = await sendMessage(inputValue, language);
        
        const botMessage: ChatMessage = {
          content: response,
          isBot: true,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Message Failed",
        description: "Could not send your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaqClick = (question: string) => {
    setInputValue(question);
  };

  const handleClearChat = async () => {
    try {
      await clearChatHistory();
      setMessages([]);
      toast({
        title: "Chat Cleared",
        description: "Your chat history has been cleared.",
      });
    } catch (error) {
      console.error("Failed to clear chat:", error);
      toast({
        title: "Failed to Clear Chat",
        description: "Could not clear your chat history. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-14 w-14 p-0 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground relative"
          title="Chat with AI Assistant"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {/* Pulsing animation */}
          <span className="absolute inset-0 rounded-full animate-ping bg-primary/40 -z-10"></span>
          {/* AI badge */}
          <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] text-white font-bold">AI</span>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 bg-card border rounded-lg shadow-xl flex flex-col transition-all duration-200 z-50",
        isMinimized ? "w-72 h-14" : mobileState.isMobile ? "w-[90vw] h-[70vh]" : "w-96 h-[600px]"
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <h3 className="font-medium">Middlesman AI Assistant</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-7 w-7 rounded-full hover:bg-primary-foreground/20 text-primary-foreground"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-7 w-7 rounded-full hover:bg-primary-foreground/20 text-primary-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-2 w-full rounded-none">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="faqs">FAQs</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                    <Info className="h-10 w-10 mb-2" />
                    <h3 className="font-medium mb-1">Welcome to Middlesman AI Assistant</h3>
                    <p className="text-sm">
                      I can help you understand the escrow process, create transactions, and resolve issues.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex max-w-[85%] rounded-lg p-3 text-sm",
                        msg.isBot
                          ? "bg-muted self-start rounded-tl-none text-foreground"
                          : "bg-primary text-primary-foreground self-end rounded-tr-none"
                      )}
                    >
                      <div>
                        <p>{msg.content}</p>
                        <span className="text-xs opacity-70 mt-1 block">
                          {msg.timestamp?.toLocaleTimeString([], { 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Language selector and clear button */}
              <div className="flex justify-between items-center px-3 py-1 border-t">
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="text-xs bg-transparent border rounded p-1"
                >
                  {languageOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearChat}
                  className="text-xs h-7 px-2"
                >
                  Clear Chat
                </Button>
              </div>

              {/* Input */}
              <div className="p-3 border-t flex gap-2">
                {user ? (
                  <>
                    <div className="relative flex-1">
                      <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type your message..."
                        className="w-full p-2 pr-8 border rounded-md resize-none h-10 min-h-10 max-h-32 text-foreground"
                        rows={1}
                      />
                      <div className="absolute right-2 bottom-2 text-muted-foreground">
                        <CornerDownLeft className="h-4 w-4" />
                      </div>
                    </div>
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={isLoading || !inputValue.trim()} 
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <div className="w-full text-center p-2 bg-muted rounded-md">
                    <p className="text-sm mb-1">Please log in to chat with our AI assistant</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = '/login'}
                    >
                      Login
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="faqs" className="flex-1 overflow-y-auto p-3 m-0 space-y-3">
              {faqs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                  <p>Loading FAQs...</p>
                </div>
              ) : (
                faqs.map((faq, index) => (
                  <div key={index} className="border rounded-lg p-3 hover:bg-muted">
                    <h4 
                      className="font-medium text-primary cursor-pointer"
                      onClick={() => handleFaqClick(faq.question)}
                    >
                      {faq.question}
                    </h4>
                    <p className="text-sm mt-1">{faq.answer}</p>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}