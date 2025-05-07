import { useState } from "react";
import { Helmet } from "react-helmet";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error state
    setLoginError("");
    
    if (!username || !password) {
      setLoginError("Please fill in all fields");
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Attempting login with:", username);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });
      
      // Handle successful response
      if (response.ok) {
        toast({
          title: "Success",
          description: "You've been logged in successfully",
        });
        // Force navigation to dashboard on success
        window.location.href = "/dashboard";
        return;
      }
      
      // Handle error responses
      let errorMessage = "Invalid username or password";
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
          
          // Special handling for test accounts
          if (errorMessage.includes("dev mode") || errorMessage.includes("test accounts")) {
            errorMessage = "For test accounts, use 'password123' as the password.";
          }
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
        
        // Handle specific HTTP status codes
        if (response.status === 500) {
          errorMessage = "Internal server error. Please try one of the test accounts listed below.";
        } else if (response.status === 401) {
          // Highlight test accounts if user is trying to log in with one
          if (["test", "admin", "mockuser"].includes(username)) {
            errorMessage = "For test accounts, please use 'password123' as the password.";
          } else {
            errorMessage = "Invalid username or password.";
          }
        } else if (response.status === 404) {
          errorMessage = "Login service unavailable. Server may be down.";
        }
      }
      
      console.error("Login failed:", response.status, errorMessage);
      setLoginError(errorMessage);
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } catch (error) {
      console.error("Login request error:", error);
      const errorMessage = "A network error occurred during login";
      setLoginError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login | Middlesman</title>
      </Helmet>

      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-outfit font-bold text-darkBg mb-2">
                Welcome Back
              </h1>
              <p className="text-darkBg opacity-80">
                Sign in to your Middlesman account
              </p>
              {loginError && (
                <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                  {loginError}
                </div>
              )}
              <div className="mt-2 text-sm text-indigo-600">
                <p>Available test accounts:</p>
                <p>Username: test, Password: password123</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" autoComplete="on" id="login-form" name="login-form">
              <div>
                <label htmlFor="username" className="block text-darkBg font-medium mb-2">
                  Username
                </label>
                <GlassInput
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-darkBg opacity-70"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  }
                  placeholder="Enter your username"
                  aria-label="Username"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-darkBg font-medium mb-2">
                  Password
                </label>
                <GlassInput
                  id="password"
                  name="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-darkBg opacity-70"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  }
                  placeholder="Enter your password"
                  aria-label="Password"
                  required
                  autoComplete="current-password"
                />
              </div>

              <div>
                <GlassButton 
                  type="submit" 
                  fullWidth 
                  disabled={isLoading}
                  id="login-button"
                  name="login-button"
                  onClick={() => console.log("Login button clicked")}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </GlassButton>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-darkBg opacity-80">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:text-secondary font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </>
  );
}
