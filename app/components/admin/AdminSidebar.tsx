"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SafeUser } from "@/app/types";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Mail,
  Calendar,
  FileText,
  Kanban,
  Receipt,
  UserCircle,
  Contact,
  Newspaper,
  Ticket,
  ShoppingCart,
  Sparkles,
  ChevronDown,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminSidebarProps {
  currentUser: SafeUser;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    children: [
      { label: "Modern", icon: null, href: "/admin" },
      { label: "eCommerce", icon: null, href: "/admin/dashboards/ecommerce" },
      { label: "Analytics", icon: null, href: "/admin/dashboards/analytics" },
    ],
  },
  {
    label: "Apps",
    icon: <Sparkles className="h-5 w-5" />,
    children: [
      { label: "Chat", icon: <MessageSquare className="h-4 w-4" />, href: "/admin/apps/chat" },
      { label: "Email", icon: <Mail className="h-4 w-4" />, href: "/admin/apps/email" },
      { label: "Calendar", icon: <Calendar className="h-4 w-4" />, href: "/admin/apps/calendar" },
      { label: "Notes", icon: <FileText className="h-4 w-4" />, href: "/admin/apps/notes" },
      { label: "Kanban", icon: <Kanban className="h-4 w-4" />, href: "/admin/apps/kanban" },
      { label: "Invoice", icon: <Receipt className="h-4 w-4" />, href: "/admin/apps/invoice" },
      { label: "User Profile", icon: <UserCircle className="h-4 w-4" />, href: "/admin/apps/profile" },
      { label: "Contacts", icon: <Contact className="h-4 w-4" />, href: "/admin/apps/contacts" },
      { label: "Blog", icon: <Newspaper className="h-4 w-4" />, href: "/admin/apps/blog" },
      { label: "Tickets", icon: <Ticket className="h-4 w-4" />, href: "/admin/apps/tickets" },
      { label: "eCommerce", icon: <ShoppingCart className="h-4 w-4" />, href: "/admin/apps/ecommerce" },
      { label: "Property Management", icon: <Building2 className="h-4 w-4" />, href: "/admin/apps/property-management" },
    ],
  },
  {
    label: "Management",
    icon: <Users className="h-5 w-5" />,
    children: [
      { label: "Users", icon: null, href: "/admin/users" },
      { label: "Roles", icon: null, href: "/admin/roles" },
      { label: "Permissions", icon: null, href: "/admin/permissions" },
      { label: "Amenities", icon: null, href: "/admin/amenities" },
    ],
  },
  {
    label: "Settings",
    icon: <Settings className="h-5 w-5" />,
    href: "/admin/settings",
  },
];

export default function AdminSidebar({ currentUser }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(["Dashboard", "Apps", "Management"]);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("admin-sidebar-collapsed");
    if (saved) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("admin-sidebar-collapsed", JSON.stringify(newState));
  };

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div
      className={cn(
        "relative flex flex-col border-r bg-white transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <Link href="/admin" className="flex items-center space-x-2">
            <img 
              src="/bookin.svg" 
              alt="Bookin Logo" 
              className="h-8 w-auto"
            />
          </Link>
        )}
        {isCollapsed && (
          <Link href="/admin" className="flex items-center justify-center w-full">
            <img 
              src="/bookin.svg" 
              alt="Bookin Logo" 
              className="h-8 w-8 object-contain"
            />
          </Link>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => (
            <div key={item.label}>
              {item.children ? (
                <>
                  <button
                    onClick={() => !isCollapsed && toggleExpanded(item.label)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      "hover:bg-gray-100 text-gray-700"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expandedItems.includes(item.label) && "rotate-180"
                        )}
                      />
                    )}
                  </button>
                  {!isCollapsed && expandedItems.includes(item.label) && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href!}
                          className={cn(
                            "flex items-center space-x-2 rounded-lg px-3 py-2 text-sm transition-colors",
                            isActive(child.href!)
                              ? "bg-modernize-primary/10 text-modernize-primary font-medium"
                              : "text-gray-600 hover:bg-gray-100"
                          )}
                        >
                          {child.icon}
                          <span>{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href!}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href!)
                      ? "bg-modernize-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Collapse Toggle */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className="w-full justify-center"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

