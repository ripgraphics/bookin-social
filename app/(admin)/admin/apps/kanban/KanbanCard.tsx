"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { SafeUser } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, User, MessageSquare, Paperclip, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Card {
  id: string;
  title: string;
  description: string;
  due_date?: string;
  labels?: string[];
}

interface KanbanCardProps {
  card: Card;
  currentUser: SafeUser | null;
  onUpdate: () => void;
}

export function KanbanCard({ card, currentUser, onUpdate }: KanbanCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const updateCard = async () => {
    try {
      await axios.patch(`/api/kanban/cards/${card.id}`, {
        title,
        description
      });
      toast.success("Card updated");
      onUpdate();
      setIsDetailOpen(false);
    } catch (error: any) {
      toast.error("Failed to update card");
    }
  };

  const deleteCard = async () => {
    if (!confirm("Delete this card?")) return;
    try {
      await axios.delete(`/api/kanban/cards/${card.id}`);
      toast.success("Card deleted");
      onUpdate();
      setIsDetailOpen(false);
    } catch (error: any) {
      toast.error("Failed to delete card");
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="bg-white p-3 rounded-lg shadow-sm border hover:shadow-md cursor-pointer transition-shadow"
        onClick={() => setIsDetailOpen(true)}
      >
        <p className="font-medium text-sm mb-2">{card.title}</p>
        
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {card.labels.map((label, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {label}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-2 text-xs text-gray-500">
          {card.due_date && (
            <div className="flex items-center">
              <CalendarIcon className="h-3 w-3 mr-1" />
              {new Date(card.due_date).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Card Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Card title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={5}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={updateCard} className="flex-1">
                Save Changes
              </Button>
              <Button onClick={deleteCard} variant="destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

