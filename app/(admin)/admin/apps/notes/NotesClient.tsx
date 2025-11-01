"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { SafeUser } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Folder, Tag, Pin, Trash2 } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface NotesClientProps {
  currentUser: SafeUser | null;
}

export default function NotesClient({ currentUser }: NotesClientProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: ""
  });

  useEffect(() => {
    fetchNotes();
  }, [searchQuery]);

  const fetchNotes = async () => {
    try {
      const response = await axios.get(`/api/notes?search=${searchQuery}`);
      setNotes(response.data);
    } catch (error: any) {
      toast.error("Failed to load notes");
    }
  };

  const createNote = async () => {
    if (!formData.title) {
      toast.error("Please enter a title");
      return;
    }

    try {
      await axios.post("/api/notes", formData);
      toast.success("Note created");
      setIsCreating(false);
      setFormData({ title: "", content: "" });
      fetchNotes();
    } catch (error: any) {
      toast.error("Failed to create note");
    }
  };

  const updateNote = async () => {
    if (!selectedNote) return;

    try {
      await axios.patch(`/api/notes/${selectedNote.id}`, {
        title: selectedNote.title,
        content: selectedNote.content
      });
      toast.success("Note updated");
      fetchNotes();
    } catch (error: any) {
      toast.error("Failed to update note");
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      await axios.delete(`/api/notes/${noteId}`);
      toast.success("Note deleted");
      setSelectedNote(null);
      fetchNotes();
    } catch (error: any) {
      toast.error("Failed to delete note");
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Notes List */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <Button className="w-full mb-4" onClick={() => setIsCreating(true)}>
            <Plus className="h-5 w-5 mr-2" />
            New Note
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                selectedNote?.id === note.id ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium truncate">{note.title}</p>
                  <p className="text-sm text-gray-500 truncate">{note.content}</p>
                </div>
                {note.is_pinned && <Pin className="h-4 w-4 text-blue-500" />}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(note.updated_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Note Editor */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {isCreating ? (
          <div className="bg-white h-full flex flex-col">
            <div className="border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">New Note</h2>
              <Button variant="ghost" onClick={() => setIsCreating(false)}>✕</Button>
            </div>
            <div className="flex-1 p-6 space-y-4">
              <Input
                placeholder="Note title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <textarea
                className="w-full h-full min-h-[400px] p-4 border rounded-lg"
                placeholder="Start writing..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                <Button onClick={createNote}>Create Note</Button>
              </div>
            </div>
          </div>
        ) : selectedNote ? (
          <div className="bg-white h-full flex flex-col">
            <div className="border-b p-4 flex items-center justify-between">
              <Input
                className="text-xl font-semibold border-none"
                value={selectedNote.title}
                onChange={(e) => setSelectedNote({ ...selectedNote, title: e.target.value })}
                onBlur={updateNote}
              />
              <Button variant="ghost" onClick={() => deleteNote(selectedNote.id)}>
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 p-6">
              <textarea
                className="w-full h-full p-4 border rounded-lg"
                value={selectedNote.content}
                onChange={(e) => setSelectedNote({ ...selectedNote, content: e.target.value })}
                onBlur={updateNote}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Folder className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select a note</h3>
              <p className="text-gray-500">Choose a note from the sidebar or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

