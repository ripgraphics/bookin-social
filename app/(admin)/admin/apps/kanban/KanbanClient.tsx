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
import { Plus, MoreVertical, Calendar as CalendarIcon, User, MessageSquare, Paperclip } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";

interface Board {
  id: string;
  name: string;
  description: string;
}

interface Column {
  id: string;
  board_id: string;
  name: string;
  position: number;
}

interface Card {
  id: string;
  column_id: string;
  title: string;
  description: string;
  position: number;
  due_date?: string;
  labels?: string[];
  assignees?: any[];
  comments_count?: number;
  attachments_count?: number;
}

interface KanbanClientProps {
  currentUser: SafeUser | null;
}

export default function KanbanClient({ currentUser }: KanbanClientProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [isNewBoardOpen, setIsNewBoardOpen] = useState(false);
  const [isNewColumnOpen, setIsNewColumnOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newColumnName, setNewColumnName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchBoards();
  }, []);

  useEffect(() => {
    if (selectedBoard) {
      fetchColumns();
      fetchCards();
    }
  }, [selectedBoard]);

  const fetchBoards = async () => {
    try {
      const response = await axios.get("/api/kanban/boards");
      setBoards(response.data);
      if (response.data.length > 0 && !selectedBoard) {
        setSelectedBoard(response.data[0]);
      }
    } catch (error: any) {
      toast.error("Failed to load boards");
    }
  };

  const fetchColumns = async () => {
    if (!selectedBoard) return;
    try {
      const response = await axios.get(`/api/kanban/boards/${selectedBoard.id}/columns`);
      setColumns(response.data);
    } catch (error: any) {
      toast.error("Failed to load columns");
    }
  };

  const fetchCards = async () => {
    if (!selectedBoard) return;
    try {
      const response = await axios.get(`/api/kanban/boards/${selectedBoard.id}/cards`);
      setCards(response.data);
    } catch (error: any) {
      toast.error("Failed to load cards");
    }
  };

  const createBoard = async () => {
    if (!newBoardName.trim()) return;
    try {
      const response = await axios.post("/api/kanban/boards", {
        name: newBoardName,
        description: ""
      });
      setBoards([...boards, response.data]);
      setNewBoardName("");
      setIsNewBoardOpen(false);
      toast.success("Board created");
    } catch (error: any) {
      toast.error("Failed to create board");
    }
  };

  const createColumn = async () => {
    if (!selectedBoard || !newColumnName.trim()) return;
    try {
      const response = await axios.post(`/api/kanban/boards/${selectedBoard.id}/columns`, {
        name: newColumnName,
        position: columns.length
      });
      setColumns([...columns, response.data]);
      setNewColumnName("");
      setIsNewColumnOpen(false);
      toast.success("Column created");
    } catch (error: any) {
      toast.error("Failed to create column");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = cards.find(c => c.id === active.id);
    setActiveCard(card || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveCard(null);
      return;
    }

    const activeCard = cards.find(c => c.id === active.id);
    if (!activeCard) {
      setActiveCard(null);
      return;
    }

    const overId = over.id as string;
    const overColumn = columns.find(c => c.id === overId);
    const overCard = cards.find(c => c.id === overId);

    let newColumnId = activeCard.column_id;
    let newPosition = activeCard.position;

    if (overColumn) {
      // Dropped on a column
      newColumnId = overColumn.id;
      const cardsInColumn = cards.filter(c => c.id !== activeCard.id && c.column_id === newColumnId);
      newPosition = cardsInColumn.length;
    } else if (overCard) {
      // Dropped on another card
      newColumnId = overCard.column_id;
      newPosition = overCard.position;
    }

    if (newColumnId !== activeCard.column_id || newPosition !== activeCard.position) {
      // Optimistic update
      const updatedCards = cards.map(c => {
        if (c.id === activeCard.id) {
          return { ...c, column_id: newColumnId, position: newPosition };
        }
        if (c.column_id === newColumnId && c.id !== activeCard.id) {
          if (c.position >= newPosition) {
            return { ...c, position: c.position + 1 };
          }
        }
        return c;
      });
      setCards(updatedCards);

      // Update on server
      try {
        await axios.patch(`/api/kanban/cards/${activeCard.id}`, {
          column_id: newColumnId,
          position: newPosition
        });
      } catch (error: any) {
        toast.error("Failed to move card");
        fetchCards(); // Revert on error
      }
    }

    setActiveCard(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              className="px-3 py-2 border rounded-lg"
              value={selectedBoard?.id || ""}
              onChange={(e) => {
                const board = boards.find(b => b.id === e.target.value);
                setSelectedBoard(board || null);
              }}
            >
              {boards.map(board => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>
            <Dialog open={isNewBoardOpen} onOpenChange={setIsNewBoardOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Board
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Board</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Board name"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                  />
                  <Button onClick={createBoard} className="w-full">
                    Create Board
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {selectedBoard && (
        <div className="flex-1 overflow-x-auto p-6 bg-gray-50">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex space-x-4 h-full">
              {columns.map(column => {
                const columnCards = cards.filter(c => c.column_id === column.id);
                return (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    cards={columnCards}
                    currentUser={currentUser}
                    onCardUpdate={fetchCards}
                  />
                );
              })}

              {/* Add Column */}
              <div className="flex-shrink-0 w-80">
                <Dialog open={isNewColumnOpen} onOpenChange={setIsNewColumnOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Column
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Column</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Column name"
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                      />
                      <Button onClick={createColumn} className="w-full">
                        Create Column
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <DragOverlay>
              {activeCard ? (
                <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-modernize-primary">
                  <p className="font-medium">{activeCard.title}</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}
    </div>
  );
}

