import { Helmet } from "react-helmet";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import BuyerDashboard from "./dashboard/buyer-dashboard";
import SellerDashboard from "./dashboard/seller-dashboard";
import BrokerDashboard from "./dashboard/broker-dashboard";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  
  // If user is not authenticated after loading completes, redirect to login
  useEffect(() => {
    if (!isLoading) {
      setAuthChecked(true);
      if (!user) {
        console.log("No user found, redirecting to login page");
        navigate("/login");
      } else {
        console.log("User authenticated:", user.username, "with role:", user.role);
      }
    }
  }, [user, isLoading, navigate]);

  // Show loading state while checking authentication
  if (isLoading || !authChecked) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <p className="text-center">Loading dashboard...</p>
      </div>
    );
  }

  // If no user, show a message while redirecting
  if (!user) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <p className="text-center">Please login to view your dashboard. Redirecting...</p>
      </div>
    );
  }

  // Render appropriate dashboard based on user role
  switch(user.role) {
    case 'buyer':
      return <BuyerDashboard />;
    case 'seller':
      return <SellerDashboard />;
    case 'broker':
      return <BrokerDashboard />;
    case 'admin':
      // Redirect admin users to the admin dashboard
      navigate("/admin/dashboard");
      return null;
    default:
      // For users without a specific role or default users, render a basic dashboard
      return (
        <>
          <Helmet>
            <title>Dashboard | Middlesman</title>
          </Helmet>

          <div className="container max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Dashboard
              </h1>
              <p className="text-lg opacity-80">
                Welcome back, {user.username || 'user'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <GlassCard className="p-6">
                <h2 className="text-xl font-semibold mb-4">Set Your Role</h2>
                <p className="opacity-70 mb-6">Please select your role to access the appropriate dashboard features.</p>
                <div className="space-y-3">
                  <Link href="/profile/role/buyer">
                    <GlassButton fullWidth>I'm a Buyer</GlassButton>
                  </Link>
                  <Link href="/profile/role/seller">
                    <GlassButton fullWidth>I'm a Seller</GlassButton>
                  </Link>
                  <Link href="/profile/role/broker">
                    <GlassButton fullWidth>I'm a Broker</GlassButton>
                  </Link>
                </div>
              </GlassCard>
              
              <GlassCard className="p-6">
                <h2 className="text-xl font-semibold mb-4">Transactions</h2>
                <p className="opacity-70 mb-4">You don't have any transactions yet.</p>
                <Link href="/create-transaction">
                  <GlassButton>Create Your First Transaction</GlassButton>
                </Link>
              </GlassCard>
              
              <GlassCard className="p-6">
                <h2 className="text-xl font-semibold mb-4">Account Security</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Basic account verification</span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Two-factor authentication disabled</span>
                  </div>
                </div>
                <div className="mt-6">
                  <Link href="/profile/security">
                    <GlassButton variant="outline" fullWidth>Security Settings</GlassButton>
                  </Link>
                </div>
              </GlassCard>
            </div>
            
            <GlassCard className="p-6">
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h2 className="text-2xl font-semibold mb-2">Middlesman Secure Escrow</h2>
                <p className="max-w-xl mx-auto mb-8 opacity-70">
                  Our escrow service protects buyers and sellers in every transaction. 
                  Funds are held securely until all parties are satisfied with the delivery.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/how-it-works">
                    <GlassButton variant="outline">How It Works</GlassButton>
                  </Link>
                  <Link href="/create-transaction">
                    <GlassButton>Start a Secure Transaction</GlassButton>
                  </Link>
                </div>
              </div>
            </GlassCard>
          </div>
        </>
      );
  }
}
