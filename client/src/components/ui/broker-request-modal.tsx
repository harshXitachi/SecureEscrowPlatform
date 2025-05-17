import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./glass-card";
import { GlassButton } from "./glass-button";
import { X, UserCircle, CheckCircle, XCircle, Clock, MessageCircle } from "lucide-react";
import { BrokerRequest } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface BrokerRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: BrokerRequest | null;
  onAccept: (requestId: number) => void;
  onReject: (requestId: number) => void;
}

export default function BrokerRequestModal({
  isOpen,
  onClose,
  request,
  onAccept,
  onReject
}: BrokerRequestModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [responseMessage, setResponseMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle escape key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);
  
  // Reset form when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setResponseMessage("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Format date to be more readable
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Handle accepting the request
  const handleAccept = () => {
    if (!request) return;
    
    setIsSubmitting(true);
    onAccept(request.id);
    
    toast({
      title: "Request Accepted",
      description: `You have accepted the broker request from ${request.buyer.username}.`,
      variant: "default",
    });
    
    setTimeout(() => {
      onClose();
      setIsSubmitting(false);
    }, 500);
  };
  
  // Handle rejecting the request
  const handleReject = () => {
    if (!request) return;
    
    setIsSubmitting(true);
    onReject(request.id);
    
    toast({
      title: "Request Rejected",
      description: `You have rejected the broker request from ${request.buyer.username}.`,
      variant: "default",
    });
    
    setTimeout(() => {
      onClose();
      setIsSubmitting(false);
    }, 500);
  };

  if (!isOpen || !request) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-deepBlack/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-xl z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Broker Request</h2>
                <button 
                  onClick={onClose}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Buyer info */}
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/20 p-2 rounded-full">
                    <UserCircle className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{request.buyer.username}</p>
                    <p className="text-white/60 text-sm">Buyer</p>
                  </div>
                </div>
                
                {/* Request details */}
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <p className="text-white/70 text-sm">Request ID:</p>
                    <p className="text-white text-sm">{request.id}</p>
                  </div>
                  <div className="flex justify-between mb-2">
                    <p className="text-white/70 text-sm">Created:</p>
                    <p className="text-white text-sm">{formatDate(request.createdAt)}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-white/70 text-sm">Status:</p>
                    <div className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                      {request.status === "pending" ? "Pending" : 
                       request.status === "accepted" ? "Accepted" : "Rejected"}
                    </div>
                  </div>
                </div>
                
                {/* Message */}
                {request.message && (
                  <div>
                    <p className="text-white/70 text-sm mb-2">Message from buyer:</p>
                    <div className="bg-white/5 p-4 rounded-lg">
                      <p className="text-white/90 italic">"{request.message}"</p>
                    </div>
                  </div>
                )}
                
                {/* Response message input */}
                <div>
                  <label htmlFor="response" className="block text-white/70 text-sm mb-2">
                    Your Response (optional):
                  </label>
                  <textarea
                    id="response"
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Add a message to the buyer..."
                    className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary min-h-[100px]"
                  />
                </div>
                
                {/* Action buttons */}
                <div className="flex justify-end space-x-3">
                  <GlassButton
                    variant="outline"
                    onClick={handleReject}
                    disabled={isSubmitting}
                    className="border-red-400/30 text-red-400 hover:bg-red-400/10"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Request
                  </GlassButton>
                  
                  <GlassButton
                    onClick={handleAccept}
                    disabled={isSubmitting}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Request
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 