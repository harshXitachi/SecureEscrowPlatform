import React, { useState } from "react";
import { Link } from "wouter";
import {
  Users,
  ShieldAlert,
  FileText,
  BarChart,
  CircleDollarSign,
  Home,
  LogOut,
  Settings,
  MessageSquare,
  Globe,
  Database,
  AlertTriangle,
  Search,
  Server,
  UserCog,
  Building,
  Briefcase,
  Lock
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { 
  TooltipProvider, 
  TooltipRoot, 
  TooltipTrigger, 
  TooltipContent 
} from "@/components/ui/tooltip";

interface EnhancedAdminNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function EnhancedAdminNavigation({
  activeTab,
  setActiveTab,
}: EnhancedAdminNavigationProps) {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  // Notification counts (would come from API in production)
  const notifications = {
    disputes: 5,
    security: 2,
    messages: 8
  };

  // All navigation items grouped by category
  const navItems = {
    main: [
      { icon: <Home className="w-5 h-5" />, label: "Dashboard", value: "dashboard" },
      { icon: <Users className="w-5 h-5" />, label: "User Management", value: "users", badge: null },
      { icon: <CircleDollarSign className="w-5 h-5" />, label: "Transactions", value: "transactions" },
      { icon: <ShieldAlert className="w-5 h-5" />, label: "Disputes", value: "disputes", badge: notifications.disputes },
      { icon: <Globe className="w-5 h-5" />, label: "IP Tracking", value: "ip-tracking" },
    ],
    financial: [
      { icon: <CircleDollarSign className="w-5 h-5" />, label: "Fee Structure", value: "fee-structure" },
      { icon: <Database className="w-5 h-5" />, label: "Financial Journal", value: "financial-journal" },
    ],
    reporting: [
      { icon: <BarChart className="w-5 h-5" />, label: "Analytics", value: "analytics" },
      { icon: <FileText className="w-5 h-5" />, label: "Reports", value: "reports" },
      { icon: <Briefcase className="w-5 h-5" />, label: "Marketplace", value: "marketplace" },
    ],
    system: [
      { icon: <Lock className="w-5 h-5" />, label: "Security & Compliance", value: "security", badge: notifications.security },
      { icon: <Settings className="w-5 h-5" />, label: "System Config", value: "system-config" },
      { icon: <MessageSquare className="w-5 h-5" />, label: "Communication", value: "communication", badge: notifications.messages },
      { icon: <Server className="w-5 h-5" />, label: "System Health", value: "system-health" },
      { icon: <UserCog className="w-5 h-5" />, label: "Admin Tools", value: "admin-tools" },
    ]
  };

  const handleLogout = () => {
    logout();
  };

  // Filter nav items based on search
  const filterNavItems = (items: any[]) => {
    if (!searchQuery) return items;
    return items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className={`bg-blue-950 border-r border-blue-900/50 text-white min-h-screen p-4 transition-all duration-300 ${isExpanded ? 'w-72' : 'w-20'}`}>
      <div className="flex flex-col h-full">
        <div className={`mb-6 flex ${isExpanded ? 'justify-between' : 'justify-center'} items-center`}>
          <div className={`flex items-center ${isExpanded ? '' : 'justify-center'}`}>
            <motion.div
              animate={{ rotate: [0, 10, 0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="flex-shrink-0"
            >
              <ShieldAlert className="w-8 h-8 text-blue-400" />
            </motion.div>
            {isExpanded && (
              <h2 className="text-xl font-bold ml-2 text-white">Admin Panel</h2>
            )}
          </div>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-blue-800/50"
          >
            {isExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
              <Input 
                placeholder="Search admin panel..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-blue-900/30 border-blue-700/30 text-white placeholder:text-blue-400/70 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {isExpanded && (
          <div className="mb-4 px-3 py-2">
            <div className="flex items-center space-x-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.username}</p>
                <p className="text-xs text-blue-300">Admin</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <TooltipProvider>
            <nav className="space-y-6">
              {/* Main Navigation */}
              <div>
                {isExpanded && <p className="text-xs uppercase text-blue-400 mb-2 px-2">Main</p>}
                <div className="space-y-1">
                  {filterNavItems(navItems.main).map((item) => (
                    <React.Fragment key={item.value}>
                      {!isExpanded ? (
                        <TooltipRoot>
                          <TooltipTrigger asChild>
                            <NavItem
                              icon={item.icon}
                              label={item.label}
                              value={item.value}
                              badge={item.badge}
                              activeTab={activeTab}
                              setActiveTab={setActiveTab}
                              isExpanded={isExpanded}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            {item.label}
                          </TooltipContent>
                        </TooltipRoot>
                      ) : (
                        <NavItem
                          icon={item.icon}
                          label={item.label}
                          value={item.value}
                          badge={item.badge}
                          activeTab={activeTab}
                          setActiveTab={setActiveTab}
                          isExpanded={isExpanded}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Financial Section */}
              <div>
                {isExpanded && <p className="text-xs uppercase text-blue-400 mb-2 px-2">Financial</p>}
                <div className="space-y-1">
                  {filterNavItems(navItems.financial).map((item) => (
                    <React.Fragment key={item.value}>
                      {!isExpanded ? (
                        <TooltipRoot>
                          <TooltipTrigger asChild>
                            <NavItem
                              icon={item.icon}
                              label={item.label}
                              value={item.value}
                              badge={item.badge}
                              activeTab={activeTab}
                              setActiveTab={setActiveTab}
                              isExpanded={isExpanded}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            {item.label}
                          </TooltipContent>
                        </TooltipRoot>
                      ) : (
                        <NavItem
                          icon={item.icon}
                          label={item.label}
                          value={item.value}
                          badge={item.badge}
                          activeTab={activeTab}
                          setActiveTab={setActiveTab}
                          isExpanded={isExpanded}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Reporting & Analytics */}
              <div>
                {isExpanded && <p className="text-xs uppercase text-blue-400 mb-2 px-2">Reporting</p>}
                <div className="space-y-1">
                  {filterNavItems(navItems.reporting).map((item) => (
                    <React.Fragment key={item.value}>
                      {!isExpanded ? (
                        <TooltipRoot>
                          <TooltipTrigger asChild>
                            <NavItem
                              icon={item.icon}
                              label={item.label}
                              value={item.value}
                              badge={item.badge}
                              activeTab={activeTab}
                              setActiveTab={setActiveTab}
                              isExpanded={isExpanded}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            {item.label}
                          </TooltipContent>
                        </TooltipRoot>
                      ) : (
                        <NavItem
                          icon={item.icon}
                          label={item.label}
                          value={item.value}
                          badge={item.badge}
                          activeTab={activeTab}
                          setActiveTab={setActiveTab}
                          isExpanded={isExpanded}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* System & Tools */}
              <div>
                {isExpanded && <p className="text-xs uppercase text-blue-400 mb-2 px-2">System</p>}
                <div className="space-y-1">
                  {filterNavItems(navItems.system).map((item) => (
                    <React.Fragment key={item.value}>
                      {!isExpanded ? (
                        <TooltipRoot>
                          <TooltipTrigger asChild>
                            <NavItem
                              icon={item.icon}
                              label={item.label}
                              value={item.value}
                              badge={item.badge}
                              activeTab={activeTab}
                              setActiveTab={setActiveTab}
                              isExpanded={isExpanded}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            {item.label}
                          </TooltipContent>
                        </TooltipRoot>
                      ) : (
                        <NavItem
                          icon={item.icon}
                          label={item.label}
                          value={item.value}
                          badge={item.badge}
                          activeTab={activeTab}
                          setActiveTab={setActiveTab}
                          isExpanded={isExpanded}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </nav>
          </TooltipProvider>
        </div>

        <div className="mt-auto pt-4 border-t border-blue-800">
          {!isExpanded ? (
            <TooltipRoot>
              <TooltipTrigger asChild>
                <Link href="/">
                  <Button 
                    variant="outline" 
                    className="w-full aspect-square flex items-center justify-center p-2 bg-transparent border-blue-700 text-blue-300 hover:bg-blue-800/50 hover:text-blue-200"
                  >
                    <Home className="w-5 h-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                Back to Site
              </TooltipContent>
            </TooltipRoot>
          ) : (
            <Link href="/">
              <Button 
                variant="outline" 
                className="w-full text-start justify-start bg-transparent border-blue-700 text-blue-300 hover:bg-blue-800/50 hover:text-blue-200"
              >
                <Home className="w-4 h-4 mr-2" />
                <span>Back to Site</span>
              </Button>
            </Link>
          )}

          {!isExpanded ? (
            <TooltipRoot>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full aspect-square flex items-center justify-center p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 mt-2"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Log Out
              </TooltipContent>
            </TooltipRoot>
          ) : (
            <Button
              variant="ghost"
              className="w-full text-start justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 mt-2"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span>Log Out</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: number | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isExpanded: boolean;
}

function NavItem({
  icon,
  label,
  value,
  badge,
  activeTab,
  setActiveTab,
  isExpanded
}: NavItemProps) {
  const isActive = activeTab === value;

  return (
    <button
      className={`flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} w-full ${isExpanded ? 'px-3' : 'px-2'} py-2 text-sm rounded-md transition-colors ${
        isActive
          ? "bg-blue-700 text-white"
          : "text-blue-200 hover:bg-blue-800/50"
      }`}
      onClick={() => setActiveTab(value)}
    >
      <div className={`flex items-center ${!isExpanded ? 'justify-center' : ''}`}>
        <div className="flex-shrink-0">{icon}</div>
        {isExpanded && <span className="ml-3">{label}</span>}
      </div>
      
      {isExpanded && badge !== null && badge !== undefined && badge > 0 && (
        <Badge variant="destructive" className="ml-auto text-xs">
          {badge}
        </Badge>
      )}
      
      {!isExpanded && badge !== null && badge !== undefined && badge > 0 && (
        <Badge variant="destructive" className="absolute top-0 right-0 -mt-1 -mr-1 w-4 h-4 p-0 flex items-center justify-center text-[10px]">
          {badge}
        </Badge>
      )}
    </button>
  );
} 