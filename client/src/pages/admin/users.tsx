import React, { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Redirect, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Ban, Check, UserX, Edit } from "lucide-react";
import AdminNavigation from "@/components/admin/admin-navigation";

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userAction, setUserAction] = useState<"ban" | "unban" | "edit" | null>(null);
  const [newUsername, setNewUsername] = useState("");

  // Fetch users
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError,
    error
  } = useQuery({
    queryKey: ["/api/admin/users", page, limit, search],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (search) {
        queryParams.append("search", search);
      }
      
      const res = await fetch(`/api/admin/users?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  // Ban/unban user mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });
      
      if (!res.ok) {
        throw new Error(`Failed to ${isActive ? "unban" : "ban"} user`);
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: `User ${userAction === "ban" ? "banned" : "unbanned"} successfully`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsDialogOpen(false);
      setSelectedUser(null);
      setUserAction(null);
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to ${userAction} user`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Edit user mutation
  const editUserMutation = useMutation({
    mutationFn: async ({ userId, username }: { userId: number; username: string }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to update user");
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "User updated successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsDialogOpen(false);
      setSelectedUser(null);
      setUserAction(null);
      setNewUsername("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle user action
  const handleUserAction = (user: any, action: "ban" | "unban" | "edit") => {
    setSelectedUser(user);
    setUserAction(action);
    if (action === "edit") {
      setNewUsername(user.username);
    }
    setIsDialogOpen(true);
  };

  // Handle confirm action
  const handleConfirmAction = () => {
    if (!selectedUser) return;
    
    if (userAction === "ban" || userAction === "unban") {
      toggleUserStatusMutation.mutate({
        userId: selectedUser.id,
        isActive: userAction === "unban",
      });
    } else if (userAction === "edit") {
      editUserMutation.mutate({
        userId: selectedUser.id,
        username: newUsername,
      });
    }
  };

  // Redirect if not logged in
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Check if admin access
  if (user.role !== "admin") {
    return <Redirect to="/admin" />;
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset page when searching
    setPage(1);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar Navigation */}
      <AdminNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 p-8 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">User Management</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              View and manage all user accounts
            </p>
          </div>
          <Button className="mt-4 sm:mt-0">
            <Link to="/admin">Back to Dashboard</Link>
          </Button>
        </div>

        {/* Search and filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search users..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-row gap-4">
                <div className="w-28">
                  <Select
                    value={limit.toString()}
                    onValueChange={(value) => {
                      setLimit(parseInt(value));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Limit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit">Search</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage user accounts, ban users, and edit user information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="flex w-full items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="py-8 text-center">
                <p className="text-red-500">Error loading users: {error?.message}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] })}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersData?.users?.length > 0 ? (
                        usersData.users.map((user: any) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.id}</TableCell>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.isActive ? 
                                  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : 
                                  "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}>
                                {user.isActive ? "Active" : "Banned"}
                              </span>
                            </TableCell>
                            <TableCell className="capitalize">
                              {user.role || "user"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleUserAction(user, "edit")}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {user.isActive ? (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-red-500 hover:text-red-600"
                                    onClick={() => handleUserAction(user, "ban")}
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-green-500 hover:text-green-600"
                                    onClick={() => handleUserAction(user, "unban")}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {usersData?.pagination && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">
                      Showing page {page} of{" "}
                      {Math.ceil(usersData.pagination.total / limit)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          page >= Math.ceil(usersData.pagination.total / limit)
                        }
                        onClick={() =>
                          setPage((p) =>
                            Math.min(
                              Math.ceil(usersData.pagination.total / limit),
                              p + 1
                            )
                          )
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {userAction === "ban"
                ? "Ban User"
                : userAction === "unban"
                ? "Unban User"
                : "Edit User"}
            </DialogTitle>
            <DialogDescription>
              {userAction === "ban" ? (
                <>
                  Are you sure you want to ban <strong>{selectedUser?.username}</strong>?
                  This will prevent them from logging in or using the platform.
                </>
              ) : userAction === "unban" ? (
                <>
                  Are you sure you want to unban <strong>{selectedUser?.username}</strong>?
                  This will restore their access to the platform.
                </>
              ) : (
                <>
                  Edit user information for <strong>{selectedUser?.username}</strong>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {userAction === "edit" && (
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                Username
              </label>
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedUser(null);
                setUserAction(null);
                setNewUsername("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant={userAction === "ban" ? "destructive" : "default"}
              onClick={handleConfirmAction}
              disabled={
                toggleUserStatusMutation.isPending || 
                editUserMutation.isPending ||
                (userAction === "edit" && (!newUsername || newUsername === selectedUser?.username))
              }
            >
              {toggleUserStatusMutation.isPending || editUserMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : userAction === "ban" ? (
                <UserX className="mr-2 h-4 w-4" />
              ) : userAction === "unban" ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Edit className="mr-2 h-4 w-4" />
              )}
              {userAction === "ban"
                ? "Ban User"
                : userAction === "unban"
                ? "Unban User"
                : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}