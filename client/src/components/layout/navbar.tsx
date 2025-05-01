import { useAuth } from "@/contexts/auth-context";
import { GlassButton } from "@/components/ui/glass-button";
import { Link } from "wouter";
import { useMobile } from "@/hooks/use-mobile";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const isMobile = useMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="glass-navbar sticky top-0 z-50 px-4 py-3 md:px-8">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <span className="text-2xl font-bold text-white">
                middlesman
              </span>
            </div>
          </Link>
        </div>

        {!isMobile && (
          <div className="hidden md:flex space-x-8 items-center">
            <Link href="/">
              <span className="font-medium text-white/80 hover:text-white transition-colors cursor-pointer">
                Home
              </span>
            </Link>
            {user ? (
              <>
                <Link href="/dashboard">
                  <span className="font-medium text-white/80 hover:text-white transition-colors cursor-pointer">
                    Dashboard
                  </span>
                </Link>
                <Link href="/transactions">
                  <span className="font-medium text-white/80 hover:text-white transition-colors cursor-pointer">
                    Transactions
                  </span>
                </Link>
                <div className="relative">
                  <button 
                    className="flex items-center font-medium gap-2 text-white"
                    onClick={() => logout()}
                  >
                    <span>{user.username}</span>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <span className="font-medium text-white/80 hover:text-white transition-colors cursor-pointer">
                    Login
                  </span>
                </Link>
                <Link href="/register">
                  <div className="cursor-pointer">
                    <GlassButton>Login with Mobile</GlassButton>
                  </div>
                </Link>
              </>
            )}
          </div>
        )}

        <button
          className="md:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-deepBlack">
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white">
                middlesman
              </span>
            </div>
            <button
              className="text-white"
              onClick={() => setMobileMenuOpen(false)}
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
            </button>
          </div>
          <div className="p-4 flex flex-col space-y-4">
            <Link href="/">
              <div className="text-white text-xl py-3 cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
                Home
              </div>
            </Link>
            {user ? (
              <>
                <Link href="/dashboard">
                  <div 
                    className="text-white/80 text-xl py-3 cursor-pointer"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </div>
                </Link>
                <Link href="/transactions">
                  <div 
                    className="text-white/80 text-xl py-3 cursor-pointer"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Transactions
                  </div>
                </Link>
                <button 
                  className="text-white/80 text-xl py-3 text-left"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                >
                  Logout
                </button>
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center py-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-white mr-2">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white">{user.username}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <div 
                    className="text-white/80 text-xl py-3 cursor-pointer"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </div>
                </Link>
                <Link href="/register">
                  <div 
                    className="text-white/80 text-xl py-3 cursor-pointer"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
