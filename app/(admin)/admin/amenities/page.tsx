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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Home, Plus, Edit, Trash2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface AmenityCategory {
  id: string;
  name: string;
  description: string | null;
}

interface Amenity {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  category_id: string;
  category: AmenityCategory;
}

export default function AmenitiesPage() {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [categories, setCategories] = useState<AmenityCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAmenity, setNewAmenity] = useState({
    name: "",
    icon: "",
    description: "",
    category_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [amenitiesRes, categoriesRes] = await Promise.all([
        axios.get("/api/admin/amenities"),
        axios.get("/api/admin/amenity-categories"),
      ]);
      setAmenities(amenitiesRes.data);
      setCategories(categoriesRes.data);
    } catch (error: any) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load amenities");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAmenity = async () => {
    try {
      await axios.post("/api/admin/amenities", newAmenity);
      toast.success("Amenity created successfully");
      setIsDialogOpen(false);
      setNewAmenity({ name: "", icon: "", description: "", category_id: "" });
      fetchData();
    } catch (error: any) {
      console.error("Failed to create amenity:", error);
      toast.error("Failed to create amenity");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Amenities</h1>
          <p className="text-gray-500 mt-1">Loading amenities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Amenities</h1>
          <p className="text-gray-500 mt-1">Manage listing amenities and categories</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Amenity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Amenity</DialogTitle>
              <DialogDescription>
                Add a new amenity that can be assigned to listings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amenity-name">Amenity Name</Label>
                <Input
                  id="amenity-name"
                  placeholder="e.g., WiFi"
                  value={newAmenity.name}
                  onChange={(e) => setNewAmenity({ ...newAmenity, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="amenity-icon">Icon Name</Label>
                <Input
                  id="amenity-icon"
                  placeholder="e.g., FaWifi"
                  value={newAmenity.icon}
                  onChange={(e) => setNewAmenity({ ...newAmenity, icon: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="amenity-category">Category</Label>
                <Select
                  value={newAmenity.category_id}
                  onValueChange={(value) => setNewAmenity({ ...newAmenity, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amenity-description">Description</Label>
                <Input
                  id="amenity-description"
                  placeholder="Brief description"
                  value={newAmenity.description}
                  onChange={(e) => setNewAmenity({ ...newAmenity, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAmenity}>Create Amenity</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Amenities</CardTitle>
          <CardDescription>Amenities available for listings</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {amenities.map((amenity) => (
                <TableRow key={amenity.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Home className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{amenity.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{amenity.icon}</code>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-500">{amenity.category?.name}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-500">
                      {amenity.description || "No description"}
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

