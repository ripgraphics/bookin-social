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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Shield, Plus, Edit, Trash2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface Role {
  id: string;
  role_name: string;
  description: string | null;
  created_at: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await axios.get("/api/admin/roles");
      setRoles(response.data);
    } catch (error: any) {
      console.error("Failed to fetch roles:", error);
      toast.error("Failed to load roles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      await axios.post("/api/admin/roles", {
        role_name: newRole.name,
        description: newRole.description,
      });
      toast.success("Role created successfully");
      setIsDialogOpen(false);
      setNewRole({ name: "", description: "" });
      fetchRoles();
    } catch (error: any) {
      console.error("Failed to create role:", error);
      toast.error("Failed to create role");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles</h1>
          <p className="text-gray-500 mt-1">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles</h1>
          <p className="text-gray-500 mt-1">Manage user roles and access levels</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Add a new role to the system. This role can be assigned to users.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="role-name">Role Name</Label>
                <Input
                  id="role-name"
                  placeholder="e.g., moderator"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="role-description">Description</Label>
                <Input
                  id="role-description"
                  placeholder="Brief description of the role"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRole}>Create Role</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
          <CardDescription>System roles and their descriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{role.role_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-500">{role.description || "No description"}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-500">
                      {new Date(role.created_at).toLocaleDateString()}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" disabled>
                      <Edit className="h-4 w-4" />
                    </Button>
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

