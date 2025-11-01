"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { SafeUser } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import Image from "next/image";
import CustomImageUpload from "@/app/components/inputs/CustomImageUpload";

interface Product {
  id: string;
  name: string;
  price: number;
  inventory_quantity: number;
  category: string;
  description?: string;
  images?: string[];
  status?: string;
  created_at?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface EcommerceClientProps {
  currentUser: SafeUser | null;
}

export default function EcommerceClient({ currentUser }: EcommerceClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    description: "",
    images: [] as string[]
  });

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [products, orders]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/ecommerce/products");
      setProducts(response.data);
    } catch (error: any) {
      toast.error("Failed to load products");
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get("/api/ecommerce/orders");
      setOrders(response.data);
    } catch (error: any) {
      toast.error("Failed to load orders");
    }
  };

  const calculateStats = () => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    
    setStats({
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue,
      pendingOrders
    });
  };

  const handleCreateProduct = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post("/api/ecommerce/products", {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        description: formData.description,
        images: formData.images
      });
      
      toast.success("Product created successfully");
      setIsDialogOpen(false);
      setFormData({ name: "", category: "", price: "", stock: "", description: "", images: [] });
      fetchProducts();
    } catch (error: any) {
      toast.error("Failed to create product");
    } finally {
      setIsLoading(false);
    }
  };

  const salesData = [
    { month: 'Jan', sales: 4000 },
    { month: 'Feb', sales: 3000 },
    { month: 'Mar', sales: 5000 },
    { month: 'Apr', sales: 4500 },
    { month: 'May', sales: 6000 },
    { month: 'Jun', sales: 5500 },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">eCommerce</h1>
          <p className="text-gray-600">Manage products and orders</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold mt-2">{stats.totalProducts}</p>
                </div>
                <Package className="h-10 w-10 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold mt-2">{stats.totalOrders}</p>
                </div>
                <ShoppingCart className="h-10 w-10 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold mt-2">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="h-10 w-10 text-purple-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold mt-2">{stats.pendingOrders}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Sales Chart */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold mb-4">Sales Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#5D87FF" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Products</h3>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Product</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Product Name</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="Enter category"
                      />
                    </div>
                    <div>
                      <Label>Price</Label>
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label>Product Images</Label>
                      <CustomImageUpload
                        value={formData.images}
                        onChange={(value) => setFormData({ 
                          ...formData, 
                          images: Array.isArray(value) ? value : [value] 
                        })}
                        disabled={isLoading}
                        maxSizeMB={10}
                        maxFiles={10}
                        multiple
                        aspectRatio="16:9"
                        uploadFolder="products"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Upload up to 10 product images (16:9 aspect ratio)
                      </p>
                    </div>
                    <Button onClick={handleCreateProduct} className="w-full" disabled={isLoading}>
                      {isLoading ? "Creating..." : "Create Product"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4">Image</th>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Price</th>
                  <th className="text-left p-4">Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={60}
                          height={40}
                          className="rounded object-cover aspect-video"
                        />
                      ) : (
                        <div className="w-[60px] h-[40px] bg-gray-200 rounded flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-medium">{product.name}</td>
                    <td className="p-4">{product.category}</td>
                    <td className="p-4">${parseFloat(product.price.toString()).toFixed(2)}</td>
                    <td className="p-4">
                      <Badge variant={product.inventory_quantity > 10 ? 'default' : 'destructive'}>
                        {product.inventory_quantity}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Orders</h3>
            </div>
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4">Order #</th>
                  <th className="text-left p-4">Customer</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Amount</th>
                  <th className="text-left p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{order.order_number}</td>
                    <td className="p-4">{order.customer_name}</td>
                    <td className="p-4">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="p-4">${order.total_amount.toFixed(2)}</td>
                    <td className="p-4">
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

