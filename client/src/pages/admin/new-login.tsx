import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
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
import { 
  Loader2, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Fingerprint, 
  SmartphoneNfc,
  Clock,
  AlertTriangle,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Form validation schema
const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Two-factor form schema
const twoFactorSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits")
});

export default function AdminEnhancedLogin() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loginStep, setLoginStep] = useState<'credentials'|'2fa'|'biometric'>('credentials');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30); // minutes
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [userLocation, setUserLocation] = useState<string | null>(null);

  // Hard-coded admin credentials as specified
  const adminCredentials = {
    username: "harsh0",
    password: "harsh00"
  };
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Initialize 2FA form
  const twoFactorForm = useForm<z.infer<typeof twoFactorSchema>>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      code: "",
    },
  });

  // Effect to check biometric availability
  useEffect(() => {
    // Check if Web Authentication API is available
    if (window.PublicKeyCredential) {
      setIsBiometricAvailable(true);
    }

    // Get approximate location for monitoring
    fetch('https://ipapi.co/json/')
      .then(response => response.json())
      .then(data => {
        setUserLocation(`${data.city}, ${data.country_name}`);
      })
      .catch(() => {
        console.error("Could not determine location");
      });
  }, []);

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    
    setPasswordStrength(strength);
  };

  // Handle credential form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsProcessing(true);
    
    try {
      // Log login attempt (would store to database in production)
      console.log(`Login attempt from: ${userLocation || 'Unknown location'}`);
      setLoginAttempts(prev => prev + 1);

      // Simulate server validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if credentials match (in production this would be a server call)
      if (values.username === adminCredentials.username && 
          values.password === adminCredentials.password) {
        
        toast({
          title: "Credentials verified",
          description: "Please complete two-factor authentication",
        });
        
        // Show 2FA step
        setLoginStep('2fa');
        setShowTwoFactor(true);
      } else {
        toast({
          title: "Login failed",
          description: "Invalid credentials. Please try again.",
          variant: "destructive",
        });
        
        // If too many failed attempts
        if (loginAttempts >= 2) {
          toast({
            title: "Security Alert",
            description: "Multiple failed login attempts detected",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Login error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle 2FA form submission
  const onTwoFactorSubmit = async (values: z.infer<typeof twoFactorSchema>) => {
    setIsProcessing(true);
    
    try {
      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo, we'll accept any 6-digit code
      if (values.code.length === 6) {
        toast({
          title: "Login successful",
          description: "Welcome to the admin panel",
        });
        
        // Simulate redirect after login (keeping the URL as /admin for consistency)
        setTimeout(() => {
          window.location.href = "/admin";
        }, 1000);
      } else {
        toast({
          title: "Verification failed",
          description: "Invalid verification code",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle biometric authentication
  const handleBiometricAuth = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate biometric verification delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Biometric authentication successful",
        description: "Welcome to the admin panel",
      });
      
      // Simulate redirect after login
      setTimeout(() => {
        window.location.href = "/admin";
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Biometric authentication failed",
        description: error.message || "Please try again or use password",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-indigo-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="backdrop-blur-xl bg-white/10 border-blue-500/20 shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <motion.div
                animate={{ 
                  rotate: [0, 10, 0, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <ShieldAlert className="w-10 h-10 text-blue-400" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white ml-3">Secure Admin Panel</h2>
            </div>
            <CardTitle className="text-xl text-center text-white">Admin Authentication</CardTitle>
            <CardDescription className="text-center text-blue-200">
              Multi-factor security system
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {loginStep === 'credentials' && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              placeholder="Enter admin username" 
                              className="bg-white/20 border-blue-300/30 text-white placeholder:text-blue-200/50" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-300" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Enter admin password" 
                              className="bg-white/20 border-blue-300/30 text-white placeholder:text-blue-200/50 pr-10" 
                              {...field} 
                              onChange={(e) => {
                                field.onChange(e);
                                calculatePasswordStrength(e.target.value);
                              }}
                            />
                            <button 
                              type="button" 
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-300" />
                        
                        {/* Password strength indicator */}
                        {field.value && (
                          <div className="mt-2">
                            <Progress value={passwordStrength} className="h-1" />
                            <div className="flex justify-between text-xs mt-1 text-blue-200">
                              <span>Weak</span>
                              <span>Strong</span>
                            </div>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" checked={rememberDevice} onCheckedChange={checked => setRememberDevice(checked as boolean)} />
                      <Label htmlFor="remember" className="text-white text-sm">Remember this device for 30 days</Label>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-blue-200 text-xs">Session timeout</p>
                      <div className="flex items-center space-x-4">
                        <input 
                          type="range" 
                          min="15" 
                          max="60" 
                          step="15"
                          value={sessionTimeout} 
                          onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
                          className="w-full"
                        />
                        <span className="text-white min-w-[80px] text-sm flex items-center">
                          <Clock className="h-3 w-3 mr-1" /> 
                          {sessionTimeout} min
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying
                        </>
                      ) : (
                        <>Verify Credentials</>
                      )}
                    </Button>
                  </div>
                  
                  {isBiometricAvailable && (
                    <div className="flex justify-center mt-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="bg-transparent border-blue-400/30 text-blue-200 hover:bg-blue-700/20"
                        onClick={handleBiometricAuth}
                        disabled={isProcessing}
                      >
                        <Fingerprint className="mr-2 h-4 w-4" />
                        Use Biometric Authentication
                      </Button>
                    </div>
                  )}
                  
                  {loginAttempts > 0 && (
                    <div className="flex items-center justify-center text-xs text-amber-300 mt-2">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      <span>Login attempts: {loginAttempts}/5</span>
                    </div>
                  )}
                </form>
              </Form>
            )}
            
            {loginStep === '2fa' && (
              <Form {...twoFactorForm}>
                <form onSubmit={twoFactorForm.handleSubmit(onTwoFactorSubmit)} className="space-y-4">
                  <div className="flex justify-center mb-4">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <SmartphoneNfc className="w-16 h-16 text-blue-300" />
                    </motion.div>
                  </div>
                  
                  <p className="text-center text-white">Enter the 6-digit code from your authentication app</p>
                  
                  <FormField
                    control={twoFactorForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex justify-center">
                            <Input 
                              placeholder="000000" 
                              className="bg-white/20 border-blue-300/30 text-white text-center tracking-widest w-40"
                              maxLength={6}
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-center text-red-300" />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-2">
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying
                        </>
                      ) : (
                        <>Complete Authentication</>
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setLoginStep('credentials')}
                      className="text-blue-200 text-sm hover:text-white"
                    >
                      Back to credentials
                    </button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col border-t border-blue-500/20 pt-4">
            <div className="flex items-center justify-center text-blue-200 text-sm mb-3">
              <Lock className="h-3 w-3 mr-1" />
              <span>Secured with end-to-end encryption</span>
            </div>
            
            {userLocation && (
              <div className="flex justify-center text-xs text-blue-300/70 mb-2">
                <span>Current location: {userLocation}</span>
              </div>
            )}
            
            <Link href="/">
              <a className="text-blue-300 hover:text-white text-sm hover:underline">
                Return to main site
              </a>
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
} 