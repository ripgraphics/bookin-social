"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SafeUser } from "@/app/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Bell,
  MessageSquare,
  Mail,
  Calendar,
  FileText,
  Ticket,
  ShoppingCart,
  Newspaper,
  Contact,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface AdminHeaderProps {
  currentUser: SafeUser;
}

const appsMenu = [
  {
    label: "Chat Application",
    subtitle: "New messages arrived",
    icon: <MessageSquare className="h-5 w-5" />,
    href: "/admin/apps/chat",
  },
  {
    label: "eCommerce App",
    subtitle: "New stock available",
    icon: <ShoppingCart className="h-5 w-5" />,
    href: "/admin/apps/ecommerce",
  },
  {
    label: "Notes App",
    subtitle: "To-do and Daily tasks",
    icon: <FileText className="h-5 w-5" />,
    href: "/admin/apps/notes",
  },
  {
    label: "Calendar App",
    subtitle: "Get dates",
    icon: <Calendar className="h-5 w-5" />,
    href: "/admin/apps/calendar",
  },
  {
    label: "Contact Application",
    subtitle: "2 Unsaved Contacts",
    icon: <Contact className="h-5 w-5" />,
    href: "/admin/apps/contacts",
  },
  {
    label: "Tickets App",
    subtitle: "Submit tickets",
    icon: <Ticket className="h-5 w-5" />,
    href: "/admin/apps/tickets",
  },
  {
    label: "Email App",
    subtitle: "Get new emails",
    icon: <Mail className="h-5 w-5" />,
    href: "/admin/apps/email",
  },
  {
    label: "Blog App",
    subtitle: "Added new blog",
    icon: <Newspaper className="h-5 w-5" />,
    href: "/admin/apps/blog",
  },
];

const notifications = [
  { id: 1, title: "Launch Admin", message: "Just see the my new admin!", time: "9:30 AM" },
  { id: 2, title: "Meeting Today", message: "Check your schedule", time: "9:10 AM" },
  { id: 3, title: "New Payment received", message: "Check your earnings", time: "9:00 AM" },
  { id: 4, title: "Pay Bills", message: "Just a reminder that you have pay", time: "8:30 AM" },
  { id: 5, title: "Go for Event", message: "Just a reminder for event", time: "8:00 AM" },
];

export default function AdminHeader({ currentUser }: AdminHeaderProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    } finally {
      setIsLoading(false);
    }
  };

  const getUserInitials = () => {
    if (currentUser.first_name && currentUser.last_name) {
      return `${currentUser.first_name[0]}${currentUser.last_name[0]}`.toUpperCase();
    }
    return currentUser.email?.[0]?.toUpperCase() || "U";
  };

  const getUserRole = () => {
    if (!currentUser.roles || currentUser.roles.length === 0) return "User";
    const role = currentUser.roles[0];
    // Handle both string and object role formats
    const roleName = typeof role === 'string' ? role : (role.name || role.display_name || 'User');
    return roleName.charAt(0).toUpperCase() + roleName.slice(1).replace("_", " ");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      {/* Search */}
      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-modernize-primary focus:outline-none focus:ring-1 focus:ring-modernize-primary"
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center space-x-4">
        {/* Apps Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 shadow-lg">
            <DropdownMenuLabel className="text-base font-semibold px-4 py-3">Apps</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto p-2">
              {appsMenu.map((app) => (
                <DropdownMenuItem key={app.href} asChild className="p-0">
                  <Link href={app.href} className="flex items-start space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                      {app.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{app.label}</p>
                      <p className="text-xs text-gray-500 truncate">{app.subtitle}</p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-modernize-danger">
                {notifications.length}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <Badge variant="secondary">{notifications.length} new</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3">
                  <div className="flex w-full items-start justify-between">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <span className="text-xs text-gray-500">{notification.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-modernize-primary cursor-pointer">
              See All Notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.image || undefined} />
                <AvatarFallback className="bg-modernize-primary text-white">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">
                  {currentUser.first_name} {currentUser.last_name}
                </p>
                <p className="text-xs text-gray-500">{getUserRole()}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {currentUser.first_name} {currentUser.last_name}
                </p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={isLoading} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              {isLoading ? "Logging out..." : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

