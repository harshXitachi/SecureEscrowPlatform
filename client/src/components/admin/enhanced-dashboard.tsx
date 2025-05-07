import React, { useState } from 'react';
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  CircleDollarSign,
  Users,
  ShieldAlert,
  TrendingUp,
  Clock,
  Bell,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  GitBranch,
  Zap
} from "lucide-react";

// Mock data
const dashboardData = {
  metrics: {
    totalTransactions: 9423,
    activeTransactions: 428,
    completedTransactions: 8716,
    disputedTransactions: 279,
    totalVolume: 4832750,
    totalUsers: 5621,
    pendingVerifications: 47,
    activeDisputes: 26,
    averageResolutionTime: 2.3, // days
    revenueThisMonth: 28413,
    revenueGrowth: 12.4,
    transactionGrowth: 8.7,
    userGrowth: 15.9,
  },
  recentTransactions: [
    {
      id: 'T-93824',
      buyer: 'alexchase',
      seller: 'techsupplier',
      amount: 2499.99,
      status: 'in_progress',
      createdAt: '2023-11-01T13:45:28Z',
      product: 'Gaming Laptop XPS-15',
    },
    {
      id: 'T-93823',
      buyer: 'janedoe',
      seller: 'gadgetworld',
      amount: 799.50,
      status: 'completed',
      createdAt: '2023-11-01T12:32:45Z',
      product: 'Smartphone Z-10 Pro',
    },
    {
      id: 'T-93822',
      buyer: 'robertsmith',
      seller: 'luxurywatches',
      amount: 12899.00,
      status: 'dispute',
      createdAt: '2023-11-01T10:17:32Z',
      product: 'Luxury Watch Chronos X',
    },
    {
      id: 'T-93821',
      buyer: 'emmawilson',
      seller: 'furnituredepot',
      amount: 1249.99,
      status: 'completed',
      createdAt: '2023-11-01T09:05:18Z',
      product: 'Ergonomic Office Chair',
    },
    {
      id: 'T-93820',
      buyer: 'mikerobinson',
      seller: 'sportequipment',
      amount: 349.95,
      status: 'in_progress',
      createdAt: '2023-11-01T08:42:57Z',
      product: 'Treadmill T-400',
    },
  ],
  alerts: [
    {
      id: 1,
      title: 'Suspicious activity detected',
      description: 'Multiple failed login attempts for user joebloggs',
      type: 'security',
      priority: 'high',
      time: '12 minutes ago',
    },
    {
      id: 2,
      title: 'High-value transaction initiated',
      description: '$15,000 transaction between maryjones and premiumpets requires review',
      type: 'transaction',
      priority: 'medium',
      time: '43 minutes ago',
    },
    {
      id: 3,
      title: 'API rate limit reached',
      description: 'External API integration exceeded rate limit',
      type: 'system',
      priority: 'medium',
      time: '1 hour ago',
    },
    {
      id: 4,
      title: 'New dispute filed',
      description: 'Customer reported non-delivery for order #39285',
      type: 'dispute',
      priority: 'high',
      time: '2 hours ago',
    },
  ],
  monthlyTransactions: [
    2743, 3052, 2809, 3426, 3728, 4052, 3989, 4218, 3852, 4107, 4321, 4523
  ],
  escrowRatios: {
    active: 428,
    completed: 8716,
    dispute: 279
  }
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper function for percentage format
const formatPercent = (value: number) => {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
};

// Helper function to get status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'in_progress':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'dispute':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

// Helper function to get status icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'in_progress':
      return <Clock className="h-4 w-4" />;
    case 'dispute':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <HelpCircle className="h-4 w-4" />;
  }
};

// Helper function to get alert icon and color
const getAlertInfo = (type: string, priority: string) => {
  let icon;
  let color;
  
  switch (type) {
    case 'security':
      icon = <ShieldAlert className="h-5 w-5" />;
      color = priority === 'high' ? 'text-red-500' : 'text-amber-500';
      break;
    case 'transaction':
      icon = <CircleDollarSign className="h-5 w-5" />;
      color = 'text-blue-500';
      break;
    case 'system':
      icon = <Zap className="h-5 w-5" />;
      color = 'text-purple-500';
      break;
    case 'dispute':
      icon = <GitBranch className="h-5 w-5" />;
      color = priority === 'high' ? 'text-red-500' : 'text-orange-500';
      break;
    default:
      icon = <Bell className="h-5 w-5" />;
      color = 'text-gray-500';
  }
  
  return { icon, color };
};

// 3D Chart component using CSS transforms
const Chart3D = ({ data, height = 200, color = 'blue' }: { data: number[], height?: number, color?: string }) => {
  const max = Math.max(...data);
  
  return (
    <div className="relative" style={{ height: `${height}px` }}>
      <div className="absolute inset-0 flex items-end justify-between gap-1 transform perspective-1000 rotateX(60deg) scale(0.9)">
        {data.map((value, index) => {
          const barHeight = (value / max) * 100;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className={`w-full bg-${color}-500/80 rounded-sm`} 
                style={{ height: `${barHeight}%` }}
              ></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 3D Pie chart component
const PieChart3D = ({ data }: { data: Record<string, number> }) => {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  
  const statusColors = {
    active: '#3B82F6',   // blue
    completed: '#22C55E', // green
    dispute: '#EF4444'    // red
  };
  
  // Calculate percentages and angles
  let currentAngle = 0;
  const segments = Object.entries(data).map(([key, value]) => {
    const percentage = value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    
    return {
      key, 
      value, 
      percentage,
      startAngle,
      endAngle: currentAngle,
      color: statusColors[key as keyof typeof statusColors]
    };
  });

  return (
    <div className="relative h-48 w-48 mx-auto">
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-slate-800 dark:to-slate-900 shadow-lg"></div>
      
      {/* 3D effect layers */}
      <div className="absolute inset-2 rounded-full transform -translate-y-2 bg-slate-200/50 dark:bg-slate-700/50 blur-sm"></div>
      
      {/* Main pie chart */}
      <div className="absolute inset-4 rounded-full overflow-hidden transform perspective-1000 rotateX(60deg) scale(0.9)">
        {segments.map((segment, index) => {
          // Create a conic gradient segment
          const backgroundStyle = {
            background: `conic-gradient(${segment.color} ${segment.startAngle}deg, ${segment.color} ${segment.endAngle}deg, transparent ${segment.endAngle}deg)`,
          };
          
          return (
            <div
              key={segment.key}
              className="absolute inset-0 transition-transform hover:scale-105"
              style={backgroundStyle}
            />
          );
        })}
      </div>
      
      {/* Center hole */}
      <div className="absolute inset-[30%] rounded-full bg-white dark:bg-slate-950 shadow-inner"></div>
      
      {/* Stats in the center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-xl font-bold">{total}</p>
        </div>
      </div>
    </div>
  );
};

const EnhancedDashboard = () => {
  const [timeframe, setTimeframe] = useState<'day'|'week'|'month'>('month');
  const [chartTab, setChartTab] = useState('volume');
  
  const {
    totalTransactions,
    activeTransactions,
    completedTransactions,
    disputedTransactions,
    totalVolume,
    totalUsers,
    pendingVerifications,
    activeDisputes,
    averageResolutionTime,
    revenueThisMonth,
    revenueGrowth,
    transactionGrowth,
    userGrowth
  } = dashboardData.metrics;

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Overview of escrow transactions, user metrics, and system health
            </p>
          </div>
          
          <div className="flex gap-2">
            <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
              <TabsList>
                <TabsTrigger value="day">24h</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="overflow-hidden border-t-4 border-t-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center justify-between">
                  <span>Transaction Volume</span>
                  <CircleDollarSign className="h-5 w-5 text-blue-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end">
                  <div className="text-3xl font-bold">{formatCurrency(totalVolume)}</div>
                  <div className={`ml-2 mb-1 text-sm flex items-center ${transactionGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {transactionGrowth >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    {formatPercent(transactionGrowth)}
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {totalTransactions.toLocaleString()} total transactions
                </p>
                
                <div className="mt-4 grid grid-cols-3 text-center">
                  <div>
                    <div className="font-medium">{activeTransactions}</div>
                    <div className="text-xs text-gray-500">Active</div>
                  </div>
                  <div>
                    <div className="font-medium">{completedTransactions}</div>
                    <div className="text-xs text-gray-500">Completed</div>
                  </div>
                  <div>
                    <div className="font-medium">{disputedTransactions}</div>
                    <div className="text-xs text-gray-500">Disputed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="overflow-hidden border-t-4 border-t-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center justify-between">
                  <span>User Base</span>
                  <Users className="h-5 w-5 text-purple-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end">
                  <div className="text-3xl font-bold">{totalUsers.toLocaleString()}</div>
                  <div className={`ml-2 mb-1 text-sm flex items-center ${userGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {userGrowth >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    {formatPercent(userGrowth)}
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {pendingVerifications} pending verifications
                </p>
                
                <div className="mt-4">
                  <div className="text-xs text-gray-500 mb-1 flex justify-between">
                    <span>Buyer/Seller Ratio</span>
                    <span>62%/38%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '62%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="overflow-hidden border-t-4 border-t-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center justify-between">
                  <span>Active Disputes</span>
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end">
                  <div className="text-3xl font-bold">{activeDisputes}</div>
                  <div className="ml-2 mb-1 text-sm text-gray-500">active cases</div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {averageResolutionTime} days avg. resolution time
                </p>
                
                <div className="mt-4">
                  <div className="text-xs text-gray-500 mb-1 flex justify-between">
                    <span>Resolution Rate</span>
                    <span>94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="overflow-hidden border-t-4 border-t-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center justify-between">
                  <span>Revenue</span>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end">
                  <div className="text-3xl font-bold">{formatCurrency(revenueThisMonth)}</div>
                  <div className={`ml-2 mb-1 text-sm flex items-center ${revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {revenueGrowth >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    {formatPercent(revenueGrowth)}
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Monthly platform fees
                </p>
                
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <div>YTD Revenue: {formatCurrency(revenueThisMonth * 10)}</div>
                  <div className="text-green-500">On Track</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        {/* Analytics and Data Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Interactive Charts */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Transaction Analytics</CardTitle>
              <div className="flex items-center gap-2">
                <Tabs value={chartTab} onValueChange={setChartTab}>
                  <TabsList>
                    <TabsTrigger value="volume">Volume</TabsTrigger>
                    <TabsTrigger value="count">Count</TabsTrigger>
                    <TabsTrigger value="fees">Fees</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <Chart3D 
                data={dashboardData.monthlyTransactions} 
                height={250} 
                color={chartTab === 'volume' ? 'blue' : chartTab === 'count' ? 'purple' : 'green'} 
              />
              <div className="flex justify-between text-xs text-gray-500 mt-8">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Escrow Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Escrow Status Distribution</CardTitle>
              <CardDescription>
                Active vs. Completed vs. Disputed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PieChart3D data={dashboardData.escrowRatios} />
              
              <div className="grid grid-cols-3 gap-2 mt-8">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mb-1"></div>
                  <span className="text-xs text-gray-500">Active</span>
                  <span className="font-medium">{((dashboardData.escrowRatios.active / totalTransactions) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mb-1"></div>
                  <span className="text-xs text-gray-500">Completed</span>
                  <span className="font-medium">{((dashboardData.escrowRatios.completed / totalTransactions) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mb-1"></div>
                  <span className="text-xs text-gray-500">Disputed</span>
                  <span className="font-medium">{((dashboardData.escrowRatios.dispute / totalTransactions) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Actionable Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center justify-between">
                <span>Recent Transactions</span>
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  <Eye className="h-3 w-3" />
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-4">
                {dashboardData.recentTransactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(transaction.status)}`}>
                        {getStatusIcon(transaction.status)}
                      </div>
                      <div>
                        <div className="font-medium flex items-center">
                          {transaction.id}
                          <Badge variant="outline" className={`ml-2 ${getStatusColor(transaction.status)}`}>
                            {transaction.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          {transaction.buyer} → {transaction.seller}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(transaction.amount)}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="ml-2">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Alerts & Notifications */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2 text-amber-500" />
                Alerts & Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-4">
                {dashboardData.alerts.map((alert) => {
                  const { icon, color } = getAlertInfo(alert.type, alert.priority);
                  
                  return (
                    <div 
                      key={alert.id} 
                      className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex gap-3">
                        <div className={`flex-shrink-0 mt-0.5 ${color}`}>
                          {icon}
                        </div>
                        <div>
                          <div className="font-medium">{alert.title}</div>
                          <p className="text-sm text-gray-500 mt-1">{alert.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge 
                              variant="outline" 
                              className={alert.priority === 'high' ? 'border-red-200 text-red-500 dark:border-red-800' : 'border-amber-200 text-amber-500 dark:border-amber-800'}
                            >
                              {alert.priority} priority
                            </Badge>
                            <span className="text-xs text-gray-500">{alert.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedDashboard; 