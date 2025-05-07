import React, { useState, useEffect } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Globe,
  MapPin,
  AlertTriangle,
  Eye,
  Shield,
  Lock,
  UserX,
  History,
  RefreshCw,
  List,
  BarChart,
} from "lucide-react";

// Mock data for demonstration
const mockIPData = [
  {
    id: 1,
    ip: "198.51.100.42",
    userId: "user293",
    username: "johndoe",
    location: "New York, USA",
    timestamp: "2023-11-02T14:23:45Z",
    device: "Chrome 109.0 / Windows 10",
    status: "normal",
    isSuspicious: false,
    latitude: 40.7128,
    longitude: -74.0060,
    activityType: "login",
  },
  {
    id: 2,
    ip: "203.0.113.89",
    userId: "user745",
    username: "sarahsmith",
    location: "London, UK",
    timestamp: "2023-11-02T10:45:12Z",
    device: "Safari 16.0 / macOS 13.1",
    status: "suspicious",
    isSuspicious: true,
    latitude: 51.5072,
    longitude: -0.1276,
    activityType: "transaction",
  },
  {
    id: 3,
    ip: "45.86.200.125",
    userId: "user512",
    username: "alexwang",
    location: "Toronto, Canada",
    timestamp: "2023-11-02T08:17:32Z",
    device: "Firefox 108.0 / Linux",
    status: "blocked",
    isSuspicious: true,
    latitude: 43.6532,
    longitude: -79.3832,
    activityType: "profile_update",
  },
  {
    id: 4,
    ip: "203.0.113.105",
    userId: "user293",
    username: "johndoe",
    location: "Chicago, USA",
    timestamp: "2023-11-01T23:12:09Z", 
    device: "Chrome 109.0 / Windows 10",
    status: "suspicious",
    isSuspicious: true,
    latitude: 41.8781,
    longitude: -87.6298,
    activityType: "login",
  },
  {
    id: 5,
    ip: "192.0.2.235",
    userId: "user129",
    username: "mariagarcia",
    location: "Madrid, Spain",
    timestamp: "2023-11-01T19:34:51Z",
    device: "Chrome 108.0 / Android 12",
    status: "normal",
    isSuspicious: false,
    latitude: 40.4168,
    longitude: -3.7038,
    activityType: "transaction",
  },
  {
    id: 6,
    ip: "198.51.100.17",
    userId: "user841",
    username: "teddyjones",
    location: "Singapore",
    timestamp: "2023-11-01T14:09:24Z",
    device: "Safari 15.6 / iOS 16.2",
    status: "normal",
    isSuspicious: false,
    latitude: 1.3521,
    longitude: 103.8198,
    activityType: "login",
  },
  {
    id: 7,
    ip: "77.124.85.13",
    userId: "user512",
    username: "alexwang",
    location: "Vancouver, Canada",
    timestamp: "2023-10-31T22:56:41Z",
    device: "Firefox 108.0 / Linux",
    status: "normal",
    isSuspicious: false,
    latitude: 49.2827,
    longitude: -123.1207,
    activityType: "login",
  },
  {
    id: 8,
    ip: "198.51.100.214",
    userId: "user129",
    username: "mariagarcia",
    location: "Barcelona, Spain",
    timestamp: "2023-10-31T16:23:17Z",
    device: "Chrome 108.0 / Android 12",
    status: "normal",
    isSuspicious: false,
    latitude: 41.3851,
    longitude: 2.1734,
    activityType: "transaction",
  },
];

const IPTrackingDashboard = () => {
  const [ipData, setIpData] = useState(mockIPData);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [isMapView, setIsMapView] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Filter data based on search query and filter status
  const filteredData = ipData.filter(item => {
    const matchesSearch = 
      item.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' || 
      item.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Auto refresh simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isAutoRefresh) {
      interval = setInterval(() => {
        // Simulate fetching new data
        console.log('Auto-refreshing IP tracking data...');
      }, 30000); // 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoRefresh]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">IP Tracking & Geolocation System</h1>
            <p className="text-gray-500 mt-2">
              Monitor user login locations, detect suspicious activities, and enforce security policies
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setIpData(mockIPData)}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <div className="flex items-center gap-2 ml-4">
              <Switch
                id="auto-refresh"
                checked={isAutoRefresh}
                onCheckedChange={setIsAutoRefresh}
              />
              <Label htmlFor="auto-refresh">Auto-refresh</Label>
            </div>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 ml-4">
              <Button 
                variant={isMapView ? "default" : "ghost"} 
                size="sm" 
                className="px-3 rounded-none"
                onClick={() => setIsMapView(true)}
              >
                <Globe className="h-4 w-4 mr-1" />
                Map
              </Button>
              <Button 
                variant={!isMapView ? "default" : "ghost"} 
                size="sm" 
                className="px-3 rounded-none"
                onClick={() => setIsMapView(false)}
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle>Live User Locations</CardTitle>
              <CardDescription>World map showing recent login locations</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative h-[400px] bg-slate-950 rounded-b-lg overflow-hidden">
                {/* Simulated World Map */}
                <div className="absolute inset-0 opacity-40 bg-[url('/world-map-dark.svg')] bg-no-repeat bg-center bg-contain"></div>
                
                {/* Data Points */}
                {ipData.map((item) => {
                  // Convert lat/long to x/y position (simplified for demonstration)
                  // In a real implementation, you'd use a proper map library
                  const x = ((item.longitude + 180) / 360) * 100; // Convert longitude to percentage
                  const y = (90 - item.latitude) / 180 * 100; // Convert latitude to percentage
                  
                  return (
                    <motion.div 
                      key={item.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`absolute w-4 h-4 ${item.isSuspicious ? 'bg-red-500' : 'bg-blue-500'} rounded-full -translate-x-1/2 -translate-y-1/2`}
                      style={{ 
                        left: `${x}%`, 
                        top: `${y}%`,
                        boxShadow: `0 0 0 ${item.isSuspicious ? '8px rgba(239, 68, 68, 0.2)' : '5px rgba(59, 130, 246, 0.2)'}`
                      }}
                      whileHover={{ scale: 1.5 }}
                      title={`${item.username} (${item.ip}) - ${item.location}`}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          <div className="col-span-1 lg:col-span-2 grid grid-rows-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <UserX className="h-5 w-5 mr-2 text-amber-500" />
                  Suspicious Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {ipData.filter(item => item.isSuspicious).length}
                </div>
                <p className="text-sm text-gray-500">Detected in last 24 hours</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-500" />
                  IP Protection Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className="bg-green-500 mb-2">Active</Badge>
                <div className="text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span>Blacklisted IPs</span>
                    <Badge variant="outline">324</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>VPN Detection</span>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Enabled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2 text-blue-500" />
                  Login Pattern Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-24 w-full">
                  {/* Simplified chart representation */}
                  <div className="h-full w-full flex items-end gap-1">
                    {[40, 60, 30, 70, 50, 90, 45, 75, 65, 80, 60, 40].map((value, index) => (
                      <div 
                        key={index} 
                        className="flex-1 bg-blue-500/80" 
                        style={{ height: `${value}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Hourly login distribution</p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search by IP, username, or location..." 
              className="pl-9" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="suspicious">Suspicious</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <BarChart className="h-4 w-4 mr-2" />
              Advanced Analytics
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Activities</TabsTrigger>
            <TabsTrigger value="suspicious">Suspicious Only</TabsTrigger>
            <TabsTrigger value="logins">Login Events</TabsTrigger>
            <TabsTrigger value="transactions">Transaction Events</TabsTrigger>
          </TabsList>
          
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono">{item.ip}</TableCell>
                        <TableCell>
                          <div className="font-medium">{item.username}</div>
                          <div className="text-gray-500 text-xs">{item.userId}</div>
                        </TableCell>
                        <TableCell className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                          {item.location}
                        </TableCell>
                        <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{item.device}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {item.activityType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.status === 'suspicious' ? (
                            <Badge variant="destructive" className="flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Suspicious
                            </Badge>
                          ) : item.status === 'blocked' ? (
                            <Badge variant="outline" className="bg-red-500/20 text-red-500 border-red-500/20">
                              Blocked
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/20">
                              Normal
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Lock className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </Tabs>
      </div>
    </div>
  );
};

export default IPTrackingDashboard; 