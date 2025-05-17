import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassButton } from "./glass-button";
import { GlassCard } from "./glass-card";
import { SearchIcon, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@/types";

interface BrokerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBroker: (brokerId: number) => void;
}

export default function BrokerSelectionModal({
  isOpen,
  onClose,
  onSelectBroker,
}: BrokerSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch all brokers
  const { data: brokers, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users/brokers"],
    enabled: isOpen, // Only fetch when modal is open
  });
  
  // Filter brokers based on search term
  const filteredBrokers = brokers?.filter(broker => 
    broker.username.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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

  // Mock broker data (until API is ready)
  const mockBrokers = [
    { id: 1, username: "premium_escrow", rating: 4.9, description: "Specialized in high-value transactions with 5+ years experience" },
    { id: 2, username: "secure_deals", rating: 4.7, description: "Fast service with 24/7 support for all transaction types" },
    { id: 3, username: "trust_broker", rating: 4.8, description: "Expert in digital product escrow with 200+ completed deals" },
    { id: 4, username: "escrow_master", rating: 4.6, description: "International transactions specialist with multi-currency support" },
    { id: 5, username: "safe_hands", rating: 4.5, description: "New broker with competitive rates and excellent customer service" },
  ];

  // Use mock data until API is ready
  const brokersToDisplay = brokers?.length ? filteredBrokers : mockBrokers;

  // Calculate star rating display
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <svg key={`full-${i}`} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {halfStar && (
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <defs>
              <linearGradient id="half-star" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#4b5563" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <path fill="url(#half-star)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <svg key={`empty-${i}`} className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

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
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[80vh] z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className="p-6 overflow-hidden flex flex-col h-full">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                <h2 className="text-2xl font-bold text-white">Find an Escrow Agent</h2>
                <button 
                  onClick={onClose}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-white/40" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, rating, or specialty..."
                  className="w-full py-3 pl-10 pr-4 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary placeholder-white/40"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Brokers List */}
              <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : brokersToDisplay.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-white/60 text-lg">No brokers found matching your search</div>
                    <GlassButton onClick={() => setSearchTerm("")} className="mt-4">
                      Clear Search
                    </GlassButton>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {brokersToDisplay.map((broker) => (
                      <motion.div
                        key={broker.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", damping: 20, stiffness: 200 }}
                        className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-white">{broker.username}</h3>
                            <div className="flex items-center mt-1">
                              {renderStars(broker.rating || 4.5)}
                              <span className="ml-2 text-white/70 text-sm">{broker.rating || 4.5}</span>
                            </div>
                          </div>
                          <GlassButton 
                            size="sm"
                            onClick={() => onSelectBroker(broker.id)}
                          >
                            Request Broker
                          </GlassButton>
                        </div>
                        <p className="text-white/70 text-sm mt-2">
                          {broker.description || "Experienced escrow agent ready to help with your transactions."}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 