"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { SafeUser } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MessageSquare, Clock } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category_id?: string;
  assigned_to?: string;
  sla_deadline?: string;
  created_at: string;
}

interface TicketsClientProps {
  currentUser: SafeUser | null;
}

export default function TicketsClient({ currentUser }: TicketsClientProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "medium"
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await axios.get("/api/tickets");
      setTickets(response.data);
    } catch (error: any) {
      toast.error("Failed to load tickets");
    }
  };

  const createTicket = async () => {
    try {
      await axios.post("/api/tickets", formData);
      setIsNewTicketOpen(false);
      setFormData({ subject: "", description: "", priority: "medium" });
      toast.success("Ticket created");
      fetchTickets();
    } catch (error: any) {
      toast.error("Failed to create ticket");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`/api/tickets/${id}`, { status });
      toast.success("Status updated");
      fetchTickets();
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statusColumns = {
    open: tickets.filter(t => t.status === 'open'),
    in_progress: tickets.filter(t => t.status === 'in_progress'),
    resolved: tickets.filter(t => t.status === 'resolved'),
    closed: tickets.filter(t => t.status === 'closed')
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-gray-600">Manage support requests</p>
        </div>
        <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ticket subject"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the issue..."
                  rows={5}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={createTicket} className="w-full">
                Create Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(statusColumns).map(([status, tickets]) => (
          <div key={status} className="bg-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold capitalize">{status.replace('_', ' ')}</h3>
              <Badge>{tickets.length}</Badge>
            </div>
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="bg-white p-4 rounded-lg border shadow-sm">
                  <h4 className="font-medium mb-2">{ticket.subject}</h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    <Select value={ticket.status} onValueChange={(value) => updateStatus(ticket.id, value)}>
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mt-2">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

