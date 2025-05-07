import { Helmet } from "react-helmet";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";

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
        console.log("User authenticated:", user.username);
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

        <GlassCard className="p-6">
          <div className="text-center py-10">
            <h2 className="text-xl font-bold mb-4">No Transactions Yet</h2>
            <p className="opacity-70 mb-4">You don't have any transactions yet.</p>
            <Link href="/create-transaction">
              <GlassButton>Create Your First Transaction</GlassButton>
            </Link>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
