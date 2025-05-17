import { useAuth } from "@/contexts/auth-context";
import { GlassButton } from "@/components/ui/glass-button";
import { Link } from "wouter";
import { useMobile } from "@/hooks/use-mobile";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import AnimatedLogo from "@/components/ui/animated-logo";
import { FloatingElement } from "@/components/ui/morphing-shapes";
import { ChevronDown } from "lucide-react";
import { productContent } from "@/lib/product-content";
import BrokerSelectionModal from "@/components/ui/broker-selection-modal";
import { useToast } from "@/hooks/use-toast";

export default function Navbar() {
  const { user, logout } = useAuth();
  const isMobile = useMobile();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const [legalMenuOpen, setLegalMenuOpen] = useState(false);
  const [brokerModalOpen, setBrokerModalOpen] = useState(false);
  
  const productMenuRef = useRef<HTMLDivElement>(null);
  const companyMenuRef = useRef<HTMLDivElement>(null);
  const legalMenuRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productMenuRef.current && !productMenuRef.current.contains(event.target as Node)) {
        setProductMenuOpen(false);
      }
      if (companyMenuRef.current && !companyMenuRef.current.contains(event.target as Node)) {
        setCompanyMenuOpen(false);
      }
      if (legalMenuRef.current && !legalMenuRef.current.contains(event.target as Node)) {
        setLegalMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle product section click
  const handleProductSectionClick = (section: string) => {
    // Navigate to the product page instead of showing a popup
    window.location.href = `/product/${section}`;
    setProductMenuOpen(false); // Close the dropdown
  };

  // Handle broker selection
  const handleSelectBroker = (brokerId: number) => {
    setBrokerModalOpen(false);
    toast({
      title: "Broker Request Sent",
      description: "Your request has been sent to the broker. They will contact you soon.",
      variant: "default",
    });
    // In a real implementation, we would call the API to send a request to the broker here
  };

  const navItemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 * i,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  return (
    <>
      <nav className="glass-navbar sticky top-0 z-50 px-4 py-3 md:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <AnimatedLogo className="w-10 h-10 mr-3" />
                <motion.span 
                  className="text-2xl font-bold text-white"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  middlesman
                </motion.span>
              </div>
            </Link>
          </div>

          {!isMobile && (
            <div className="hidden md:flex space-x-8 items-center">
              <motion.div
                custom={0}
                initial="hidden"
                animate="visible"
                variants={navItemVariants}
              >
                <Link href="/">
                  <span className="font-medium text-white/80 hover:text-white transition-colors cursor-pointer">
                    Home
                  </span>
                </Link>
              </motion.div>
              
              {/* Product Dropdown */}
              <motion.div
                custom={1}
                initial="hidden"
                animate="visible"
                variants={navItemVariants}
                className="relative"
                ref={productMenuRef}
              >
                <button
                  className="flex items-center font-medium text-white/80 hover:text-white transition-colors cursor-pointer"
                  onClick={() => {
                    setProductMenuOpen(!productMenuOpen);
                    setCompanyMenuOpen(false);
                    setLegalMenuOpen(false);
                  }}
                >
                  <span>Product</span>
                  <ChevronDown className={`w-4 h-4 ml-1 transform transition-transform ${productMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {productMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-deepBlack/90 backdrop-blur-lg rounded-md shadow-lg py-2 z-50">
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                    >
                      {['features', 'pricing', 'integrations', 'enterprise', 'security'].map((section, index) => (
                        <motion.div
                          key={section}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.2 }}
                          className="px-4 py-2 text-white/80 hover:text-white hover:bg-primary/20 transition-colors cursor-pointer"
                          onClick={() => handleProductSectionClick(section)}
                          whileHover={{ x: 5 }}
                        >
                          {section.charAt(0).toUpperCase() + section.slice(1)}
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                )}
              </motion.div>
              
              {/* Company Dropdown */}
              <motion.div
                custom={2}
                initial="hidden"
                animate="visible"
                variants={navItemVariants}
                className="relative"
                ref={companyMenuRef}
              >
                <button
                  className="flex items-center font-medium text-white/80 hover:text-white transition-colors cursor-pointer"
                  onClick={() => {
                    setCompanyMenuOpen(!companyMenuOpen);
                    setProductMenuOpen(false);
                    setLegalMenuOpen(false);
                  }}
                >
                  <span>Company</span>
                  <ChevronDown className={`w-4 h-4 ml-1 transform transition-transform ${companyMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {companyMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-deepBlack/90 backdrop-blur-lg rounded-md shadow-lg py-2 z-50">
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                    >
                      {['about', 'careers', 'partners'].map((section, index) => (
                        <motion.div 
                          key={section}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.2 }}
                          whileHover={{ x: 5, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                        >
                          <Link href={`/company/${section}`}>
                            <div className="px-4 py-2 text-white/80 hover:text-white transition-colors cursor-pointer">
                              {section.charAt(0).toUpperCase() + section.slice(1)}
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                )}
              </motion.div>
              
              {/* Legal Dropdown */}
              <motion.div
                custom={3}
                initial="hidden"
                animate="visible"
                variants={navItemVariants}
                className="relative"
                ref={legalMenuRef}
              >
                <button
                  className="flex items-center font-medium text-white/80 hover:text-white transition-colors cursor-pointer"
                  onClick={() => {
                    setLegalMenuOpen(!legalMenuOpen);
                    setProductMenuOpen(false);
                    setCompanyMenuOpen(false);
                  }}
                >
                  <span>Legal</span>
                  <ChevronDown className={`w-4 h-4 ml-1 transform transition-transform ${legalMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {legalMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-deepBlack/90 backdrop-blur-lg rounded-md shadow-lg py-2 z-50">
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                    >
                      {[
                        { section: 'terms', label: 'Terms of Service' },
                        { section: 'privacy', label: 'Privacy Policy' }
                      ].map((item, index) => (
                        <motion.div 
                          key={item.section}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.2 }}
                          whileHover={{ x: 5, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                        >
                          <Link href={`/legal/${item.section}`}>
                            <div className="px-4 py-2 text-white/80 hover:text-white transition-colors cursor-pointer">
                              {item.label}
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                )}
              </motion.div>
              
              {user ? (
                <>
                  <motion.div
                    custom={4}
                    initial="hidden"
                    animate="visible"
                    variants={navItemVariants}
                  >
                    <Link href="/dashboard">
                      <span className="font-medium text-white/80 hover:text-white transition-colors cursor-pointer">
                        Dashboard
                      </span>
                    </Link>
                  </motion.div>
                  
                  <motion.div
                    custom={5}
                    initial="hidden"
                    animate="visible"
                    variants={navItemVariants}
                  >
                    <Link href="/transactions">
                      <span className="font-medium text-white/80 hover:text-white transition-colors cursor-pointer">
                        Transactions
                      </span>
                    </Link>
                  </motion.div>
                  
                  {user.role === "admin" && (
                    <motion.div
                      custom={6}
                      initial="hidden"
                      animate="visible"
                      variants={navItemVariants}
                    >
                      <Link href="/admin">
                        <span className="font-medium text-white/80 hover:text-white transition-colors cursor-pointer">
                          Admin Panel
                        </span>
                      </Link>
                    </motion.div>
                  )}
                  
                  <motion.div
                    custom={6}
                    initial="hidden"
                    animate="visible"
                    variants={navItemVariants}
                    className="relative"
                  >
                    <button 
                      className="flex items-center font-medium gap-2 text-white"
                      onClick={() => logout()}
                    >
                      <span>{user.username}</span>
                      <FloatingElement amplitude={3} duration={3} direction="both">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-white">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      </FloatingElement>
                    </button>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div
                    custom={4}
                    initial="hidden"
                    animate="visible"
                    variants={navItemVariants}
                  >
                    <Link href="/login">
                      <span className="font-medium text-white/80 hover:text-white transition-colors cursor-pointer">
                        Login
                      </span>
                    </Link>
                  </motion.div>
                  
                  <motion.div
                    custom={5}
                    initial="hidden"
                    animate="visible"
                    variants={navItemVariants}
                  >
                    <div className="cursor-pointer">
                      <GlassButton onClick={() => setBrokerModalOpen(true)}>Find Escrow</GlassButton>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          )}

          <motion.button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </motion.button>
        </div>

        {/* Mobile Menu */}
        {isMobile && mobileMenuOpen && (
          <motion.div 
            className="fixed inset-0 z-50 bg-deepBlack"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-4 flex justify-between items-center">
              <div className="flex items-center">
                <AnimatedLogo className="w-8 h-8 mr-2" />
                <span className="text-2xl font-bold text-white">
                  middlesman
                </span>
              </div>
              <motion.button
                className="text-white"
                onClick={() => setMobileMenuOpen(false)}
                whileTap={{ scale: 0.9 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.button>
            </div>
            <div className="p-4 flex flex-col space-y-4">
              {/* Main Navigation Links */}
              {[
                { label: "Home", path: "/", isMain: true },
                ...(user
                  ? [
                      { label: "Dashboard", path: "/dashboard" },
                      { label: "Transactions", path: "/transactions" },
                      ...(user.role === "admin" ? [{ label: "Admin Panel", path: "/admin" }] : []),
                    ]
                  : [
                      { label: "Login", path: "/login" },
                      { label: "Register", path: "/register" },
                      { label: "Find Escrow", path: "#", onClick: () => setBrokerModalOpen(true) },
                    ]),
              ].map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <Link href={item.path}>
                    <div 
                      className={`${item.isMain ? "text-white" : "text-white/80"} text-xl py-3 cursor-pointer`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </div>
                  </Link>
                </motion.div>
              ))}
              
              {/* Mobile Product Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="border-t border-white/10 pt-4 mt-4"
              >
                <div className="text-white text-xl font-semibold mb-2">Product</div>
                <div className="ml-2 space-y-2">
                  {['features', 'pricing', 'integrations', 'enterprise', 'security'].map((section, index) => (
                    <motion.div
                      key={section}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + (index * 0.1), duration: 0.3 }}
                      className="text-white/80 text-lg py-2 cursor-pointer"
                      onClick={() => {
                        handleProductSectionClick(section);
                        setMobileMenuOpen(false);
                      }}
                      whileHover={{ x: 5, color: "#ffffff" }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {section.charAt(0).toUpperCase() + section.slice(1)}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              {/* Mobile Company Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="border-t border-white/10 pt-4 mt-4"
              >
                <div className="text-white text-xl font-semibold mb-2">Company</div>
                <div className="ml-2 space-y-2">
                  {['about', 'careers', 'partners'].map((section, index) => (
                    <motion.div
                      key={section}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + (index * 0.1), duration: 0.3 }}
                      whileHover={{ x: 5, color: "#ffffff" }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Link href={`/company/${section}`}>
                        <div 
                          className="text-white/80 text-lg py-2 cursor-pointer"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {section.charAt(0).toUpperCase() + section.slice(1)}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              {/* Mobile Legal Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                className="border-t border-white/10 pt-4 mt-4"
              >
                <div className="text-white text-xl font-semibold mb-2">Legal</div>
                <div className="ml-2 space-y-2">
                  {[
                    { section: 'terms', label: 'Terms of Service' },
                    { section: 'privacy', label: 'Privacy Policy' }
                  ].map((item, index) => (
                    <motion.div
                      key={item.section}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + (index * 0.1), duration: 0.3 }}
                      whileHover={{ x: 5, color: "#ffffff" }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Link href={`/legal/${item.section}`}>
                        <div 
                          className="text-white/80 text-lg py-2 cursor-pointer"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.label}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              {user && (
                <>
                  <motion.button 
                    className="text-white/80 text-xl py-3 text-left"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    Logout
                  </motion.button>
                  
                  <motion.div 
                    className="pt-4 border-t border-white/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <div className="flex items-center py-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-white mr-2">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white">{user.username}</span>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </nav>
      
      {/* Broker Selection Modal */}
      <BrokerSelectionModal 
        isOpen={brokerModalOpen}
        onClose={() => setBrokerModalOpen(false)}
        onSelectBroker={handleSelectBroker}
      />
    </>
  );
}
