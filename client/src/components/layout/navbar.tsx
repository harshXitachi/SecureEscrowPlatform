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
    <nav className="glass-navbar sticky top-0 z-50 px-4 py-4 md:px-8">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <a className="flex items-center">
              <svg
                className="w-8 h-8 text-primary"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9 14.25l6-6m4.5-3.493V8.25a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 8.25v-1.5A2.25 2.25 0 013.75 4.5h4.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-4.5A2.25 2.25 0 011.5 17.25v-1.5A2.25 2.25 0 013.75 13.5h13.5a2.25 2.25 0 012.25 2.25v1.5a2.25 2.25 0 01-2.25 2.25h-4.5a2.25 2.25 0 01-2.25-2.25V9"></path>
              </svg>
              <span className="ml-2 text-2xl font-medium font-outfit text-primary">
                Middlesman
              </span>
            </a>
          </Link>
        </div>

        {!isMobile && (
          <div className="hidden md:flex space-x-8 items-center">
            <Link href="/">
              <a className="font-medium text-primary hover:text-secondary transition-colors">
                Home
              </a>
            </Link>
            {user ? (
              <>
                <Link href="/dashboard">
                  <a className="font-medium text-darkBg hover:text-primary transition-colors">
                    Dashboard
                  </a>
                </Link>
                <Link href="/transactions">
                  <a className="font-medium text-darkBg hover:text-primary transition-colors">
                    Transactions
                  </a>
                </Link>
                <div className="relative">
                  <button 
                    className="flex items-center font-medium gap-2"
                    onClick={() => logout()}
                  >
                    <span>{user.username}</span>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <a className="font-medium text-darkBg hover:text-primary transition-colors">
                    Login
                  </a>
                </Link>
                <Link href="/register">
                  <a>
                    <GlassButton>Register</GlassButton>
                  </a>
                </Link>
              </>
            )}
          </div>
        )}

        <button
          className="md:hidden"
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
        <div className="fixed inset-0 z-50 bg-darkBg">
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center">
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9 14.25l6-6m4.5-3.493V8.25a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 8.25v-1.5A2.25 2.25 0 013.75 4.5h4.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-4.5A2.25 2.25 0 011.5 17.25v-1.5A2.25 2.25 0 013.75 13.5h13.5a2.25 2.25 0 012.25 2.25v1.5a2.25 2.25 0 01-2.25 2.25h-4.5a2.25 2.25 0 01-2.25-2.25V9"></path>
              </svg>
              <span className="ml-2 text-2xl font-medium font-outfit text-white">
                Middlesman
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
              <a className="text-white text-lg py-2" onClick={() => setMobileMenuOpen(false)}>
                Home
              </a>
            </Link>
            {user ? (
              <>
                <Link href="/dashboard">
                  <a 
                    className="text-white text-opacity-80 text-lg py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </a>
                </Link>
                <Link href="/transactions">
                  <a 
                    className="text-white text-opacity-80 text-lg py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Transactions
                  </a>
                </Link>
                <button 
                  className="text-white text-opacity-80 text-lg py-2 text-left"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                >
                  Logout
                </button>
                <div className="pt-4 border-t border-white border-opacity-20">
                  <div className="flex items-center py-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 text-white mr-2">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white">{user.username}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <a 
                    className="text-white text-opacity-80 text-lg py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </a>
                </Link>
                <Link href="/register">
                  <a 
                    className="text-white text-opacity-80 text-lg py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </a>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
