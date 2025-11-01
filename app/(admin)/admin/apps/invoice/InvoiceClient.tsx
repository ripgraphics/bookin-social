"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { SafeUser } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Send, Eye, Edit, Trash2, Search } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  issue_date: string;
  due_date: string;
  status: string;
  total_amount: number;
  tax_amount: number;
  line_items: LineItem[];
}

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface InvoiceClientProps {
  currentUser: SafeUser | null;
}

export default function InvoiceClient({ currentUser }: InvoiceClientProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    due_date: "",
    line_items: [{ description: "", quantity: 1, unit_price: 0, amount: 0 }]
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get("/api/invoices");
      setInvoices(response.data);
    } catch (error: any) {
      toast.error("Failed to load invoices");
    }
  };

  const createInvoice = async () => {
    try {
      const total = formData.line_items.reduce((sum, item) => sum + item.amount, 0);
      const tax = total * 0.1; // 10% tax
      
      await axios.post("/api/invoices", {
        ...formData,
        total_amount: total + tax,
        tax_amount: tax
      });
      
      setIsNewInvoiceOpen(false);
      setFormData({
        customer_name: "",
        customer_email: "",
        due_date: "",
        line_items: [{ description: "", quantity: 1, unit_price: 0, amount: 0 }]
      });
      toast.success("Invoice created");
      fetchInvoices();
    } catch (error: any) {
      toast.error("Failed to create invoice");
    }
  };

  const generatePDF = async (invoice: Invoice) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text("INVOICE", 105, 20, { align: "center" });

    // Invoice details
    doc.setFontSize(12);
    doc.text(`Invoice #: ${invoice.invoice_number}`, 20, 40);
    doc.text(`Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 20, 47);
    doc.text(`Due: ${new Date(invoice.due_date).toLocaleDateString()}`, 20, 54);

    // Customer
    doc.text(`Bill To:`, 20, 70);
    const customerData = getCustomerData(invoice);
    doc.text(customerData.name, 20, 77);
    doc.text(customerData.email, 20, 84);

    // Line items table
    autoTable(doc, {
      startY: 95,
      head: [['Description', 'Qty', 'Unit Price', 'Amount']],
      body: invoice.line_items.map(item => [
        item.description,
        item.quantity.toString(),
        `$${parseFloat(item.unit_price || '0').toFixed(2)}`,
        `$${parseFloat(item.amount || '0').toFixed(2)}`
      ]),
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY || 95;
    doc.text(`Subtotal: $${(parseFloat(invoice.total_amount || '0') - parseFloat(invoice.tax_amount || '0')).toFixed(2)}`, 140, finalY + 10);
    doc.text(`Tax (10%): $${parseFloat(invoice.tax_amount || '0').toFixed(2)}`, 140, finalY + 17);
    doc.setFontSize(14);
    doc.text(`Total: $${parseFloat(invoice.total_amount || '0').toFixed(2)}`, 140, finalY + 27);

    doc.save(`invoice-${invoice.invoice_number}.pdf`);
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.line_items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Calculate amount
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setFormData({ ...formData, line_items: newItems });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      line_items: [...formData.line_items, { description: "", quantity: 1, unit_price: 0, amount: 0 }]
    });
  };

  const getCustomerData = (invoice: any) => {
    try {
      if (invoice.notes) {
        const notesData = JSON.parse(invoice.notes);
        return {
          name: notesData.customer_name || 'N/A',
          email: notesData.customer_email || 'N/A'
        };
      }
    } catch (e) {
      // If notes is not JSON, ignore
    }
    return { name: 'N/A', email: 'N/A' };
  };

  const filteredInvoices = invoices.filter(inv => {
    // Parse customer_name from notes JSON
    let customerName = '';
    try {
      if (inv.notes) {
        const notesData = JSON.parse(inv.notes);
        customerName = notesData.customer_name || '';
      }
    } catch (e) {
      // If notes is not JSON, ignore
    }
    
    return customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-gray-600">Manage and generate invoices</p>
        </div>
        <Dialog open={isNewInvoiceOpen} onOpenChange={setIsNewInvoiceOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Customer Name</label>
                  <Input
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Customer Email</label>
                  <Input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                    placeholder="customer@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Line Items</label>
                  <Button onClick={addLineItem} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                {formData.line_items.map((item, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                    <Input
                      placeholder="Amount"
                      value={`$${parseFloat(item.amount || '0').toFixed(2)}`}
                      disabled
                    />
                  </div>
                ))}
              </div>

              <Button onClick={createInvoice} className="w-full">
                Create Invoice
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-lg border">
        <table className="w-full">
          <thead className="border-b">
            <tr>
              <th className="text-left p-4">Invoice #</th>
              <th className="text-left p-4">Customer</th>
              <th className="text-left p-4">Date</th>
              <th className="text-left p-4">Due Date</th>
              <th className="text-left p-4">Amount</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{invoice.invoice_number}</td>
                <td className="p-4">
                  <div>
                    <p className="font-medium">{getCustomerData(invoice).name}</p>
                    <p className="text-sm text-gray-500">{getCustomerData(invoice).email}</p>
                  </div>
                </td>
                <td className="p-4">{new Date(invoice.issue_date).toLocaleDateString()}</td>
                <td className="p-4">{new Date(invoice.due_date).toLocaleDateString()}</td>
                <td className="p-4 font-medium">${parseFloat(invoice.total_amount || '0').toFixed(2)}</td>
                <td className="p-4">
                  <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                    {invoice.status}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => generatePDF(invoice)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

