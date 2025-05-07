import { useState } from "react";
import { Helmet } from "react-helmet";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(""); // General form error
  const [errors, setErrors] = useState({
    username: "",
    password: "",
    confirmPassword: ""
  });

  // Validate form fields and set error messages
  const validateForm = () => {
    const newErrors = {
      username: "",
      password: "",
      confirmPassword: ""
    };
    
    let isValid = true;
    
    if (!username.trim()) {
      newErrors.username = "Username is required";
      isValid = false;
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
      isValid = false;
    }
    
    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Registration form submitted");
    
    // Reset error states
    setFormError("");
    
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Attempting to register user:", username);
      
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });
      
      console.log("Registration response status:", response.status);
      
      // Try to parse the response JSON (it might fail if there's a network error)
      let responseData;
      try {
        responseData = await response.json();
        console.log("Registration response data:", responseData);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        // If we can't parse the response, create a generic error message
        responseData = { message: "Server error during registration" };
      }
      
      if (response.ok) {
        console.log("Registration successful, attempting login");
        toast({
          title: "Success",
          description: "Account created successfully"
        });
        
        // Login immediately after registration
        try {
          const loginResponse = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
            credentials: "include"
          });
          
          console.log("Auto-login response status:", loginResponse.status);
          
          if (loginResponse.ok) {
            console.log("Auto-login successful, redirecting to home");
            // Redirect to home page after successful login
            navigate("/");
          } else {
            console.log("Auto-login failed, redirecting to login page");
            navigate("/login"); // Redirect to login if auto-login fails
          }
        } catch (loginError) {
          console.error("Error during auto-login:", loginError);
          navigate("/login");
        }
      } else {
        // Handle different error types based on status code
        let errorMessage = responseData.message || "Registration failed";
        
        if (response.status === 500) {
          console.error("Server error during registration:", responseData);
          errorMessage = "Server error occurred. Please try again later.";
        } else if (response.status === 400) {
          console.error("Registration validation error:", responseData);
          
          // Handle specific validation errors
          if (responseData.message.includes("already exists")) {
            errorMessage = "This username is already taken. Please choose another one.";
          } else if (responseData.message.includes("at least")) {
            // Already handled by client-side validation, but just in case
            errorMessage = responseData.message;
          }
        }
        
        setFormError(errorMessage);
        
        toast({
          title: "Registration Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Registration network error:", error);
      setFormError("A network error occurred during registration. Please check your connection and try again.");
      
      toast({
        title: "Connection Error",
        description: "Could not connect to the server. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Register | Middlesman</title>
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
                Create an Account
              </h1>
              <p className="text-darkBg opacity-80">
                Join Middlesman for secure escrow transactions
              </p>
              
              {formError && (
                <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                  {formError}
                </div>
              )}
            </div>

            <form 
              onSubmit={handleSubmit} 
              className="space-y-6"
              id="register-form"
              name="register-form"
              autoComplete="on"
            >
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
                  placeholder="Choose a username"
                  aria-label="Username"
                  required
                  autoComplete="username"
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                )}
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
                  placeholder="Create a password"
                  aria-label="Password"
                  required
                  autoComplete="new-password"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-darkBg font-medium mb-2">
                  Confirm Password
                </label>
                <GlassInput
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  placeholder="Confirm your password"
                  aria-label="Confirm Password"
                  required
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <div>
                <GlassButton 
                  type="submit" 
                  fullWidth 
                  disabled={isLoading}
                  id="register-button"
                  name="register-button"
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </GlassButton>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-darkBg opacity-80">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:text-secondary font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </>
  );
}
