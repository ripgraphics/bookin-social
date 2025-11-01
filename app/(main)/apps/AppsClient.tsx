"use client";

import { SafeUser } from "@/app/types";
import Link from "next/link";
import {
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
} from "lucide-react";

interface AppsClientProps {
  currentUser: SafeUser;
}

const apps = [
  {
    name: "Chat",
    description: "Send and receive messages",
    icon: MessageSquare,
    href: "/apps/chat",
    color: "from-blue-500 to-blue-600",
  },
  {
    name: "Email",
    description: "Manage your emails",
    icon: Mail,
    href: "/apps/email",
    color: "from-purple-500 to-purple-600",
  },
  {
    name: "Calendar",
    description: "Schedule and manage events",
    icon: Calendar,
    href: "/apps/calendar",
    color: "from-green-500 to-green-600",
  },
  {
    name: "Notes",
    description: "Create and organize notes",
    icon: FileText,
    href: "/apps/notes",
    color: "from-yellow-500 to-yellow-600",
  },
  {
    name: "Kanban",
    description: "Manage tasks and projects",
    icon: Kanban,
    href: "/apps/kanban",
    color: "from-pink-500 to-pink-600",
  },
  {
    name: "Invoice",
    description: "Create and manage invoices",
    icon: Receipt,
    href: "/apps/invoice",
    color: "from-indigo-500 to-indigo-600",
  },
  {
    name: "Profile",
    description: "Manage your profile",
    icon: UserCircle,
    href: "/apps/profile",
    color: "from-teal-500 to-teal-600",
  },
  {
    name: "Contacts",
    description: "Manage your contacts",
    icon: Contact,
    href: "/apps/contacts",
    color: "from-orange-500 to-orange-600",
  },
  {
    name: "Blog",
    description: "Read and write blog posts",
    icon: Newspaper,
    href: "/apps/blog",
    color: "from-red-500 to-red-600",
  },
  {
    name: "Tickets",
    description: "Submit and track support tickets",
    icon: Ticket,
    href: "/apps/tickets",
    color: "from-cyan-500 to-cyan-600",
  },
  {
    name: "eCommerce",
    description: "Browse and purchase products",
    icon: ShoppingCart,
    href: "/apps/ecommerce",
    color: "from-emerald-500 to-emerald-600",
  },
];

export default function AppsClient({ currentUser }: AppsClientProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Apps</h1>
          <p className="mt-2 text-gray-600">
            Access all your applications in one place
          </p>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {apps.map((app) => {
            const Icon = app.icon;
            return (
              <Link
                key={app.href}
                href={app.href}
                className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-5 transition-opacity duration-200`}
                />

                {/* Content */}
                <div className="relative p-6">
                  {/* Icon */}
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${app.color} mb-4`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Text */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {app.name}
                  </h3>
                  <p className="text-sm text-gray-600">{app.description}</p>

                  {/* Arrow Icon */}
                  <div className="mt-4 flex items-center text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    Open
                    <svg
                      className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

