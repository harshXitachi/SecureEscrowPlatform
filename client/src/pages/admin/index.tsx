import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import AdminNavigation from "@/components/admin/admin-navigation";
import AdminDashboard from "@/components/admin/admin-dashboard";

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

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar Navigation */}
      <AdminNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 p-8 pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="dashboard" className="m-0">
            <AdminDashboard />
          </TabsContent>
          
          <TabsContent value="users" className="m-0">
            <h2 className="text-3xl font-bold mb-6">User Management</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Manage user accounts, ban users, and reset passwords
            </p>
            <Link to="/admin/users">
              <a className="text-blue-500 hover:underline">Go to User Management →</a>
            </Link>
          </TabsContent>
          
          <TabsContent value="transactions" className="m-0">
            <h2 className="text-3xl font-bold mb-6">Transaction Management</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Monitor and manage all transactions in the system
            </p>
            <Link to="/admin/transactions">
              <a className="text-blue-500 hover:underline">Go to Transaction Management →</a>
            </Link>
          </TabsContent>
          
          <TabsContent value="disputes" className="m-0">
            <h2 className="text-3xl font-bold mb-6">Dispute Resolution</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Review and resolve user disputes
            </p>
            <Link to="/admin/disputes">
              <a className="text-blue-500 hover:underline">Go to Dispute Resolution →</a>
            </Link>
          </TabsContent>
          
          <TabsContent value="content" className="m-0">
            <h2 className="text-3xl font-bold mb-6">Content Management</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Manage website content, blog posts, and documentation
            </p>
            <Link to="/admin/content">
              <a className="text-blue-500 hover:underline">Go to Content Management →</a>
            </Link>
          </TabsContent>
          
          <TabsContent value="reports" className="m-0">
            <h2 className="text-3xl font-bold mb-6">Reports &amp; Analytics</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              View system analytics and generate custom reports
            </p>
            <Link to="/admin/reports">
              <a className="text-blue-500 hover:underline">Go to Reports & Analytics →</a>
            </Link>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}