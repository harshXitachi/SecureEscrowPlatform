import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export interface User {
  id: number;
  username: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string, role?: string) => Promise<boolean>;
  register: (username: string, password: string, role?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const {
    data: userData,
    isLoading,
    error,
  } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.status === 401) {
          return null;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }

        const userData = await response.json();
        return userData as User;
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    },
  });
  
  // Create a definite typed user value
  const user = userData !== undefined ? userData : null;

  const login = async (username: string, password: string, role: string = "buyer"): Promise<boolean> => {
    try {
      if (!username || !password) {
        console.error("Username or password missing");
        return false;
      }
      
      console.log("Login attempt for:", username, "with role preference:", role);
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
        credentials: "include"
      });

      console.log("Login response status:", response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log("Login successful:", userData);
        queryClient.setQueryData(["/api/auth/me"], userData);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        
        // Redirect based on user role
        const userRole = userData?.role || role;
        
        switch(userRole) {
          case 'buyer':
            window.location.href = "/dashboard/buyer";
            break;
          case 'seller':
            window.location.href = "/dashboard/seller";
            break;
          case 'broker':
            window.location.href = "/dashboard/broker";
            break;
          case 'admin':
            window.location.href = "/admin/dashboard";
            break;
          default:
            window.location.href = "/dashboard";
        }
        return true;
      }
      
      // Try to get error details from response
      let errorMessage = "Login failed";
      try {
        const errorData = await response.json();
        console.log("Login failed response:", errorData);
        if (errorData && errorData.message) {
          // Remove any test account references
          if (errorData.message.includes("test accounts") || errorData.message.includes("password123")) {
            errorMessage = "Invalid username or password";
          } else {
            errorMessage = errorData.message;
          }
        }
      } catch (e) {
        console.error("Could not parse error response:", e);
      }
      
      console.error(errorMessage);
      return false;
    } catch (error) {
      console.error("Login failed exception:", error);
      return false;
    }
  };

  const register = async (username: string, password: string, role: string = "buyer"): Promise<boolean> => {
    try {
      console.log("Register function called with:", username, "and role:", role);
      
      // Validate inputs before sending request
      if (!username || !password) {
        console.error("Username or password missing");
        return false;
      }
      
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
        credentials: "include"
      });

      console.log("Register response status:", response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log("Registration successful:", userData);
        queryClient.setQueryData(["/api/auth/me"], userData);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        
        // Redirect to role-specific dashboard
        switch(role) {
          case 'buyer':
            navigate("/dashboard/buyer");
            break;
          case 'seller':
            navigate("/dashboard/seller");
            break;
          case 'broker':
            navigate("/dashboard/broker");
            break;
          default:
            navigate("/dashboard");
        }
        return true;
      }
      
      // Try to get error details from response
      let errorMessage = "Registration failed";
      try {
        const errorData = await response.json();
        console.log("Registration failed response:", errorData);
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        console.error("Could not parse error response:", e);
      }
      
      console.error(errorMessage);
      return false;
    } catch (error) {
      console.error("Registration failed exception:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      queryClient.setQueryData(["/api/auth/me"], null);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
