"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { SafeUser } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Inbox, 
  Send, 
  FileText, 
  Trash2, 
  Star, 
  Mail, 
  Plus,
  Search,
  X,
  Paperclip
} from "lucide-react";

interface EmailClientProps {
  currentUser: SafeUser | null;
}

export default function EmailClient({ currentUser }: EmailClientProps) {
  const [selectedFolder, setSelectedFolder] = useState("inbox");
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    content: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, [selectedFolder]);

  const folders = [
    { id: "inbox", name: "Inbox", icon: Inbox, count: 0 },
    { id: "sent", name: "Sent", icon: Send },
    { id: "drafts", name: "Drafts", icon: FileText },
    { id: "trash", name: "Trash", icon: Trash2 }
  ];

  const fetchEmails = async () => {
    try {
      const response = await axios.get(`/api/emails?folder=${selectedFolder}`);
      setEmails(response.data);
    } catch (error: any) {
      toast.error("Failed to load emails");
    }
  };

  const sendEmail = async () => {
    if (!composeData.to || !composeData.subject) {
      toast.error("Please fill in recipient and subject");
      return;
    }

    setIsLoading(true);
    try {
      // Create draft
      const { data: draft } = await axios.post("/api/emails", {
        subject: composeData.subject,
        content: composeData.content,
        recipients: [
          ...composeData.to.split(",").map(email => ({ email: email.trim(), type: "to" })),
          ...composeData.cc.split(",").filter(e => e).map(email => ({ email: email.trim(), type: "cc" })),
          ...composeData.bcc.split(",").filter(e => e).map(email => ({ email: email.trim(), type: "bcc" }))
        ],
        folder: "drafts"
      });

      // Send email
      await axios.post("/api/emails/send", { email_id: draft.id });
      
      toast.success("Email sent successfully");
      setIsComposing(false);
      setComposeData({ to: "", cc: "", bcc: "", subject: "", content: "" });
      fetchEmails();
    } catch (error: any) {
      toast.error("Failed to send email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Folder Sidebar */}
      <div className="w-64 border-r bg-white">
        <div className="p-4">
          <Button className="w-full" onClick={() => setIsComposing(true)}>
            <Plus className="h-5 w-5 mr-2" />
            Compose
          </Button>
        </div>
        <div className="border-t">
          {folders.map((folder) => {
            const Icon = folder.icon;
            return (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 ${
                  selectedFolder === folder.id ? "bg-blue-50 border-r-2 border-blue-500" : ""
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{folder.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {isComposing ? (
          <div className="bg-white h-full flex flex-col">
            <div className="border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">New Email</h2>
              <Button variant="ghost" onClick={() => setIsComposing(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              <Input 
                placeholder="To" 
                value={composeData.to}
                onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
              />
              <Input 
                placeholder="Cc (optional)" 
                value={composeData.cc}
                onChange={(e) => setComposeData({ ...composeData, cc: e.target.value })}
              />
              <Input 
                placeholder="Bcc (optional)" 
                value={composeData.bcc}
                onChange={(e) => setComposeData({ ...composeData, bcc: e.target.value })}
              />
              <Input 
                placeholder="Subject" 
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
              />
              <div className="min-h-[300px]">
                <textarea
                  className="w-full h-full min-h-[300px] p-4 border rounded-lg"
                  placeholder="Write your email..."
                  value={composeData.content}
                  onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                />
              </div>
              <div className="flex justify-between items-center">
                <Button variant="outline">
                  <Paperclip className="h-5 w-5 mr-2" />
                  Attach
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" disabled={isLoading}>Save Draft</Button>
                  <Button onClick={sendEmail} disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white border-b p-4">
              <div className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-gray-400" />
                <Input placeholder="Search emails..." className="max-w-md" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {selectedEmail ? (
                  <div className="bg-white rounded-lg border p-6">
                    <div className="border-b pb-4 mb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-semibold mb-2">{selectedEmail.subject || "(No subject)"}</h2>
                          <p className="text-sm text-gray-500">From: {selectedEmail.from_email}</p>
                          <p className="text-sm text-gray-500">{new Date(selectedEmail.created_at).toLocaleString()}</p>
                        </div>
                        <Button variant="ghost" onClick={() => setSelectedEmail(null)}>
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap">{selectedEmail.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border">
                    {emails.length === 0 ? (
                      <div className="p-12 text-center">
                        <Mail className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">No emails in this folder</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {emails.map((email: any) => (
                          <div
                            key={email.id}
                            onClick={() => setSelectedEmail(email)}
                            className="p-4 hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium">{email.subject || "(No subject)"}</p>
                                <p className="text-sm text-gray-500">{email.from_email}</p>
                              </div>
                              <p className="text-sm text-gray-500">
                                {new Date(email.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

