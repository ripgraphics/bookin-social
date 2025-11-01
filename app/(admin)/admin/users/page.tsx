"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, UserPlus, Shield, Ban, Check } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  image: string | null;
  created_at: string;
  roles: string[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/admin/users");
      setUsers(response.data);
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetRole = async (userId: string, role: string) => {
    try {
      await axios.patch(`/api/admin/users/${userId}/role`, { role });
      toast.success(`User role updated to ${role}`);
      fetchUsers();
    } catch (error: any) {
      console.error("Failed to update role:", error);
      toast.error("Failed to update user role");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 mt-1">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 mt-1">Manage user accounts and permissions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>A list of all users on the platform</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback>
                          {user.first_name?.[0]}
                          {user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {user.first_name} {user.last_name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.roles.includes("super_admin")
                          ? "destructive"
                          : user.roles.includes("admin")
                          ? "default"
                          : "secondary"
                      }
                    >
                      {user.roles.includes("super_admin")
                        ? "Super Admin"
                        : user.roles.includes("admin")
                        ? "Admin"
                        : "User"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-500">
                      {format(new Date(user.created_at), "MMM dd, yyyy")}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleSetRole(user.id, "user")}>
                          <Check className="mr-2 h-4 w-4" />
                          Set as User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetRole(user.id, "admin")}>
                          <Shield className="mr-2 h-4 w-4" />
                          Set as Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetRole(user.id, "super_admin")}>
                          <Shield className="mr-2 h-4 w-4" />
                          Set as Super Admin
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

