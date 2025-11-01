"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { SafeUser } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Plus, Search, Users, MoreVertical, Paperclip, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Conversation {
  id: string;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
  participants: any[];
}

interface Message {
  id: string;
  content: string;
  message_type: string;
  created_at: string;
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  attachments?: any[];
}

interface ChatClientProps {
  currentUser: SafeUser | null;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function ChatClient({ currentUser }: ChatClientProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [conversationName, setConversationName] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      subscribeToMessages(selectedConversation.id);
    }
    
    return () => {
      // Cleanup subscription
      supabase.channel('messages').unsubscribe();
    };
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get("/api/conversations");
      setConversations(response.data);
    } catch (error: any) {
      toast.error("Failed to load conversations");
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/admin/users");
      setAllUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error("Failed to load users:", error);
    }
  };

  const createConversation = async () => {
    if (!conversationName.trim() || selectedUsers.length === 0) {
      toast.error("Please provide a conversation name and select at least one participant");
      return;
    }

    setIsCreatingConversation(true);
    try {
      const response = await axios.post("/api/conversations", {
        name: conversationName,
        type: selectedUsers.length > 1 ? "group" : "direct",
        participant_ids: selectedUsers
      });
      
      toast.success("Conversation created!");
      setConversations([response.data, ...conversations]);
      setSelectedConversation(response.data);
      
      // Reset form
      setConversationName("");
      setSelectedUsers([]);
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create conversation");
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await axios.get(`/api/conversations/${conversationId}/messages`);
      setMessages(response.data);
    } catch (error: any) {
      toast.error("Failed to load messages");
    }
  };

  const subscribeToMessages = (conversationId: string) => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch the full message with sender details
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users!messages_sender_id_fkey(id, email, first_name, last_name)
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (data) {
            setMessages((prev) => [...prev, data]);
          }
        }
      )
      .subscribe();
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    setIsLoading(true);
    try {
      await axios.post(`/api/conversations/${selectedConversation.id}/messages`, {
        content: newMessage,
        message_type: "text"
      });
      setNewMessage("");
      // Real-time subscription will handle adding the message
    } catch (error: any) {
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Chat</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Plus className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="conversation-name">Conversation Name</Label>
                    <Input
                      id="conversation-name"
                      placeholder="Enter conversation name"
                      value={conversationName}
                      onChange={(e) => setConversationName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Select Participants</Label>
                    <div className="border rounded-md max-h-60 overflow-y-auto p-2 space-y-2">
                      {allUsers.filter(user => user.id !== currentUser?.id).map((user) => (
                        <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => toggleUserSelection(user.id)}
                          />
                          <label
                            htmlFor={`user-${user.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <p className="font-medium">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedUsers.length > 0 && (
                      <p className="text-sm text-gray-500">
                        {selectedUsers.length} participant(s) selected
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createConversation} disabled={isCreatingConversation}>
                    {isCreatingConversation ? "Creating..." : "Create"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No conversations yet</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                Start a conversation
              </Button>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.id === conversation.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-modernize-primary text-white">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{conversation.name || "Untitled"}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.participants?.length || 0} participants
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback className="bg-modernize-primary text-white">
                      <Users className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedConversation.name}</p>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.participants?.length || 0} members
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.sender.id === currentUser?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex space-x-3 max-w-[70%] ${isOwnMessage ? "flex-row-reverse space-x-reverse" : ""}`}>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {message.sender.first_name?.[0]}{message.sender.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className={`rounded-lg px-4 py-2 ${
                          isOwnMessage
                            ? "bg-modernize-primary text-white"
                            : "bg-white border"
                        }`}>
                          <p>{message.content}</p>
                        </div>
                        <p className={`text-xs mt-1 text-gray-500 ${isOwnMessage ? "text-right" : ""}`}>
                          {new Date(message.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t p-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
                <Button onClick={sendMessage} disabled={isLoading || !newMessage.trim()}>
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a conversation from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

