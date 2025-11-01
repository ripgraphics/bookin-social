"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { SafeUser } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MoreVertical } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";

interface Column {
  id: string;
  name: string;
}

interface Card {
  id: string;
  column_id: string;
  title: string;
  description: string;
  position: number;
  due_date?: string;
  labels?: string[];
}

interface KanbanColumnProps {
  column: Column;
  cards: Card[];
  currentUser: SafeUser | null;
  onCardUpdate: () => void;
}

export function KanbanColumn({ column, cards, currentUser, onCardUpdate }: KanbanColumnProps) {
  const [isNewCardOpen, setIsNewCardOpen] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");

  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const createCard = async () => {
    if (!newCardTitle.trim()) return;
    try {
      await axios.post("/api/kanban/cards", {
        column_id: column.id,
        title: newCardTitle,
        description: "",
        position: cards.length
      });
      setNewCardTitle("");
      setIsNewCardOpen(false);
      toast.success("Card created");
      onCardUpdate();
    } catch (error: any) {
      toast.error("Failed to create card");
    }
  };

  const sortedCards = [...cards].sort((a, b) => a.position - b.position);

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-4 h-full flex flex-col">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold">{column.name}</h3>
          <span className="text-sm text-gray-500">({cards.length})</span>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        <SortableContext items={sortedCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {sortedCards.map(card => (
            <KanbanCard
              key={card.id}
              card={card}
              currentUser={currentUser}
              onUpdate={onCardUpdate}
            />
          ))}
        </SortableContext>
      </div>

      {/* Add Card */}
      <Dialog open={isNewCardOpen} onOpenChange={setIsNewCardOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="w-full justify-start">
            <Plus className="h-4 w-4 mr-2" />
            Add Card
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Card title"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createCard()}
            />
            <Button onClick={createCard} className="w-full">
              Create Card
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

