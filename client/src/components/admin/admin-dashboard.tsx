import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CircleDollarSign,
  Users,
  ShieldAlert,
  TrendingUp,
  BarChart,
  Clock,
} from "lucide-react";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
  // Fetch transaction report statistics
  const { data: transactionStats, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["/api/admin/reports/transactions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/reports/transactions");
      if (!res.ok) throw new Error("Failed to fetch transaction statistics");
      return res.json();
    },
  });

  // Fetch user report statistics
  const { data: userStats, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/reports/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/reports/users");
      if (!res.ok) throw new Error("Failed to fetch user statistics");
      return res.json();
    },
  });

  // Fetch dispute report statistics
  const { data: disputeStats, isLoading: isLoadingDisputes } = useQuery({
    queryKey: ["/api/admin/reports/disputes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/reports/disputes");
      if (!res.ok) throw new Error("Failed to fetch dispute statistics");
      return res.json();
    },
  });

  const isLoading = isLoadingTransactions || isLoadingUsers || isLoadingDisputes;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Admin Dashboard</h2>
      
      {isLoading ? (
        <div className="flex w-full items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatsCard 
              title="Total Transactions"
              value={transactionStats?.summary?.totalTransactions || 0}
              icon={<CircleDollarSign className="h-5 w-5 text-blue-500" />}
              description="All-time transactions"
            />
            <StatsCard 
              title="Transaction Volume"
              value={`₹${Number(transactionStats?.summary?.totalAmount || 0).toLocaleString()}`}
              icon={<TrendingUp className="h-5 w-5 text-green-500" />}
              description="Total amount processed"
            />
            <StatsCard 
              title="Total Users"
              value={userStats?.summary?.totalUsers || 0}
              icon={<Users className="h-5 w-5 text-purple-500" />}
              description="Registered users"
            />
            <StatsCard 
              title="Active Disputes"
              value={disputeStats?.summary?.activeDisputes || 0}
              icon={<ShieldAlert className="h-5 w-5 text-red-500" />}
              description="Unresolved disputes"
            />
          </div>
          
          {/* Analytics Tabs */}
          <Tabs defaultValue="transactions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="transactions">Transaction Analytics</TabsTrigger>
              <TabsTrigger value="users">User Analytics</TabsTrigger>
              <TabsTrigger value="disputes">Dispute Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Overview</CardTitle>
                  <CardDescription>
                    Transaction statistics and trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Transactions by Status</h4>
                    {transactionStats?.byStatus ? (
                      <div className="space-y-2">
                        {transactionStats.byStatus.map((stat: any) => (
                          <div 
                            key={stat.status} 
                            className="flex items-center justify-between py-2 border-b"
                          >
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: getStatusColor(stat.status) }} 
                              />
                              <span className="capitalize">{stat.status}</span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span>{stat.count} transactions</span>
                              <span className="text-sm text-gray-500">
                                ₹{Number(stat.totalAmount || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>
                      Latest transactions in the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Transaction list will be displayed here</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Trends</CardTitle>
                    <CardDescription>
                      Transaction volume by month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Monthly chart will be displayed here</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>
                    User registration trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">New Users</h4>
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-purple-500" />
                      <span className="text-2xl font-bold">
                        {userStats?.summary?.newUsers || 0}
                      </span>
                      <span className="text-sm text-gray-500">
                        new registrations
                      </span>
                    </div>
                    
                    <h4 className="text-sm font-medium mt-4">Most Active Users</h4>
                    <div className="space-y-2">
                      {userStats?.mostActiveBuyers?.slice(0, 3).map((user: any) => (
                        <div 
                          key={user.userId} 
                          className="flex items-center justify-between py-2 border-b"
                        >
                          <div className="flex items-center">
                            <span>{user.user.username}</span>
                          </div>
                          <span>{user.transactionCount} transactions</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="disputes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dispute Resolution</CardTitle>
                  <CardDescription>
                    Dispute statistics and trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Disputes by Status</h4>
                    {disputeStats?.byStatus ? (
                      <div className="space-y-2">
                        {disputeStats.byStatus.map((stat: any) => (
                          <div 
                            key={stat.status} 
                            className="flex items-center justify-between py-2 border-b"
                          >
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: getDisputeStatusColor(stat.status) }} 
                              />
                              <span className="capitalize">{stat.status}</span>
                            </div>
                            <span>{stat.count} disputes</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No data available</p>
                    )}
                    
                    <h4 className="text-sm font-medium mt-4">Resolution Time</h4>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <span className="text-2xl font-bold">
                        {disputeStats?.summary?.averageResolutionTime || "N/A"}
                      </span>
                      <span className="text-sm text-gray-500">
                        average days to resolution
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description: string;
}

function StatsCard({ title, value, icon, description }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          </div>
          <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-2.5">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions for colorizing statuses
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "#FFB800",
    completed: "#4CAF50",
    cancelled: "#F44336",
    in_progress: "#2196F3",
    disputed: "#FF5722",
    default: "#9E9E9E"
  };
  
  return colors[status] || colors.default;
}

function getDisputeStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: "#FFB800",
    resolved: "#4CAF50",
    reviewing: "#2196F3", 
    under_review: "#2196F3",
    closed: "#9E9E9E",
    default: "#9E9E9E"
  };
  
  return colors[status] || colors.default;
}