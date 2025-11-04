'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Role {
  id: string;
  name: string;
  display_name: string;
}

interface TestUser {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  password: string;
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800 border-purple-300',
  admin: 'bg-red-100 text-red-800 border-red-300',
  moderator: 'bg-blue-100 text-blue-800 border-blue-300',
  user: 'bg-gray-100 text-gray-800 border-gray-300',
  owner: 'bg-green-100 text-green-800 border-green-300',
  host: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'co-host': 'bg-orange-100 text-orange-800 border-orange-300',
  guest: 'bg-indigo-100 text-indigo-800 border-indigo-300',
};

export default function TestUsersList() {
  const [users, setUsers] = useState<TestUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch in development
    if (process.env.NODE_ENV !== 'development') {
      setLoading(false);
      return;
    }

    fetch('/api/test-users')
      .then(res => res.json())
      .then(data => {
        if (data.users) {
          setUsers(data.users);
        }
      })
      .catch(err => {
        console.error('Failed to fetch test users:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (loading) {
    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-sm text-gray-600">Loading test accounts...</div>
      </div>
    );
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">Test Accounts</h3>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {users.length} accounts
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-600" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="mb-3">
                <h4 className="font-semibold text-gray-900 text-lg mb-1">
                  {user.fullName}
                </h4>
              </div>

              {/* Email */}
              <div className="mb-3">
                <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">
                  Email
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={user.email}
                    className="flex-1 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1.5"
                  />
                  <button
                    onClick={() => copyToClipboard(user.email, `email-${user.id}`)}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Copy email"
                  >
                    {copiedField === `email-${user.id}` ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="mb-3">
                <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">
                  Password
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={user.password}
                    className="flex-1 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(user.password, `password-${user.id}`)}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Copy password"
                  >
                    {copiedField === `password-${user.id}` ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Roles */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">
                  Roles
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <span
                        key={role.id}
                        className={`text-xs px-2 py-1 rounded border ${
                          ROLE_COLORS[role.name] || 'bg-gray-100 text-gray-800 border-gray-300'
                        }`}
                      >
                        {role.display_name || role.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">No roles</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

