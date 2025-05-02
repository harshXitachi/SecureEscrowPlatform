import { useAuth } from "@/contexts/auth-context";
import { GlassButton } from "@/components/ui/glass-button";
import { Link } from "wouter";
import { useMobile } from "@/hooks/use-mobile";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import AnimatedLogo from "@/components/ui/animated-logo";
import { FloatingElement } from "@/components/ui/morphing-shapes";
import { ChevronDown } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const isMobile = useMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const [legalMenuOpen, setLegalMenuOpen] = useState(false);

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
            
            {user ? (
              <>
                <motion.div
                  custom={1}
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
                  custom={2}
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
                
                <motion.div
                  custom={3}
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
                  custom={1}
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
                  custom={2}
                  initial="hidden"
                  animate="visible"
                  variants={navItemVariants}
                >
                  <Link href="/register">
                    <div className="cursor-pointer">
                      <GlassButton>Login with Mobile</GlassButton>
                    </div>
                  </Link>
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
            {[
              { label: "Home", path: "/", isMain: true },
              ...(user
                ? [
                    { label: "Dashboard", path: "/dashboard" },
                    { label: "Transactions", path: "/transactions" },
                  ]
                : [
                    { label: "Login", path: "/login" },
                    { label: "Register", path: "/register" },
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
  );
}
