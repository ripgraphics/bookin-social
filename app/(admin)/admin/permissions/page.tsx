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
import { Lock, Plus } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface Permission {
  id: string;
  permission_name: string;
  description: string | null;
  created_at: string;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPermission, setNewPermission] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await axios.get("/api/admin/permissions");
      setPermissions(response.data);
    } catch (error: any) {
      console.error("Failed to fetch permissions:", error);
      toast.error("Failed to load permissions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePermission = async () => {
    try {
      await axios.post("/api/admin/permissions", {
        permission_name: newPermission.name,
        description: newPermission.description,
      });
      toast.success("Permission created successfully");
      setIsDialogOpen(false);
      setNewPermission({ name: "", description: "" });
      fetchPermissions();
    } catch (error: any) {
      console.error("Failed to create permission:", error);
      toast.error("Failed to create permission");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Permissions</h1>
          <p className="text-gray-500 mt-1">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Permissions</h1>
          <p className="text-gray-500 mt-1">Manage system permissions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Permission
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Permission</DialogTitle>
              <DialogDescription>
                Add a new permission to the system. Permissions can be assigned to roles.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="permission-name">Permission Name</Label>
                <Input
                  id="permission-name"
                  placeholder="e.g., manage_users"
                  value={newPermission.name}
                  onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="permission-description">Description</Label>
                <Input
                  id="permission-description"
                  placeholder="Brief description of the permission"
                  value={newPermission.description}
                  onChange={(e) =>
                    setNewPermission({ ...newPermission, description: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePermission}>Create Permission</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Permissions</CardTitle>
          <CardDescription>System permissions and their descriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permission Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{permission.permission_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-500">
                      {permission.description || "No description"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-500">
                      {new Date(permission.created_at).toLocaleDateString()}
                    </p>
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

