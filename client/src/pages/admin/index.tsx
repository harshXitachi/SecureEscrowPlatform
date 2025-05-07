import React, { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import EnhancedAdminNavigation from "@/components/admin/enhanced-admin-navigation";
import EnhancedDashboard from "@/components/admin/enhanced-dashboard";
import IPTrackingDashboard from "@/components/admin/ip-tracking-dashboard";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Redirect if not logged in
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/admin/login" />;
  }

  // Check if admin access
  if (user.role !== "admin") {
    return <Redirect to="/admin/login" />;
  }

  // Render the appropriate component based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <EnhancedDashboard />;
      case "ip-tracking":
        return <IPTrackingDashboard />;
      case "users":
      case "transactions":
      case "disputes":
      case "fee-structure":
      case "financial-journal":
      case "security":
      default:
        return (
          <div className="flex h-full flex-col items-center justify-center p-8">
            <h1 className="text-2xl font-bold mb-4">Coming Soon</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md">
              This section is under development. We're working to bring you {activeTab.replace('-', ' ')} functionality soon.
            </p>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl animate-pulse">
              {activeTab.charAt(0).toUpperCase()}
            </div>
          </div>
        );
    }
  };

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-blue-950">
        {/* Sidebar Navigation */}
        <EnhancedAdminNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </TooltipProvider>
  );
}