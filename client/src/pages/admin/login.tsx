import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, ShieldAlert } from "lucide-react";
import AnimatedLogo from "@/components/ui/animated-logo";

// Form validation schema
const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function AdminLogin() {
  const { user, isLoading, loginMutation } = useAuth();
  const { toast } = useToast();
  const [adminCredentials] = useState({
    username: "middelman001",
    password: "okyr001"
  });
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const result = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: values.username, 
          password: values.password 
        }),
        credentials: "include"
      });

      if (result.ok) {
        const userData = await result.json();
        
        // Check if the user has admin role
        if (userData.role === "admin") {
          toast({
            title: "Login successful",
            description: "Welcome to the admin panel",
            variant: "default",
          });
          // Redirect to admin dashboard
          window.location.href = "/admin";
        } else {
          toast({
            title: "Access denied",
            description: "You don't have admin privileges",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Login failed",
          description: "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  // Redirect if already logged in
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user && user.role === "admin") {
    return <Redirect to="/admin" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <AnimatedLogo className="w-12 h-12 mr-2" />
            <h2 className="text-2xl font-bold">Middlesman</h2>
          </div>
          <CardTitle className="text-xl text-center">Admin Panel Login</CardTitle>
          <CardDescription className="text-center">
            Enter your admin credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter admin username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter admin password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2">
              <ShieldAlert className="h-4 w-4 mr-1" />
              <span>Restricted access area</span>
            </div>
            <Link href="/">
              <a className="text-primary hover:underline">
                Return to main site
              </a>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}