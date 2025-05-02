import React from "react";
import { Link } from "wouter";
import {
  Users,
  ShieldAlert,
  FileText,
  BarChart,
  CircleDollarSign,
  Home,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

interface AdminNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function AdminNavigation({
  activeTab,
  setActiveTab,
}: AdminNavigationProps) {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="w-64 bg-white dark:bg-slate-950 border-r dark:border-slate-800 min-h-screen p-4">
      <div className="flex flex-col h-full">
        <div className="mb-6">
          <h2 className="text-xl font-bold px-4 py-2">Admin Panel</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 px-4">
            Logged in as {user?.username}
          </p>
        </div>

        <nav className="space-y-1 flex-1">
          <NavItem
            icon={<Home className="w-5 h-5" />}
            label="Dashboard"
            value="dashboard"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <NavItem
            icon={<Users className="w-5 h-5" />}
            label="User Management"
            value="users"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <NavItem
            icon={<CircleDollarSign className="w-5 h-5" />}
            label="Transactions"
            value="transactions"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <NavItem
            icon={<ShieldAlert className="w-5 h-5" />}
            label="Disputes"
            value="disputes"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <NavItem
            icon={<FileText className="w-5 h-5" />}
            label="Content"
            value="content"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <NavItem
            icon={<BarChart className="w-5 h-5" />}
            label="Reports"
            value="reports"
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </nav>

        <div className="mt-auto pt-4 border-t dark:border-slate-800">
          <Link to="/">
            <Button variant="outline" className="w-full text-start justify-start">
              <Home className="w-4 h-4 mr-2" />
              Back to Site
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full text-start justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 mt-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

function NavItem({
  icon,
  label,
  value,
  activeTab,
  setActiveTab,
}: NavItemProps) {
  const isActive = activeTab === value;

  return (
    <button
      className={`flex items-center space-x-3 w-full px-4 py-2 text-sm rounded-md transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
      onClick={() => setActiveTab(value)}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}