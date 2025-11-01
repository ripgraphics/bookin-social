"use client";

import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { 
  LogIn, 
  LogOut, 
  User, 
  Lock, 
  Shield, 
  Bell, 
  Image, 
  Settings,
  Trash2,
  Download,
  Eye
} from 'lucide-react';

interface ActivityLogItemProps {
  activity: {
    id: string;
    action_type: string;
    description: string;
    ip_address?: string;
    location?: string;
    metadata?: Record<string, any>;
    created_at: string;
  };
}

export default function ActivityLogItem({ activity }: ActivityLogItemProps) {
  const getActionIcon = () => {
    switch (activity.action_type) {
      case 'login':
        return <LogIn className="h-4 w-4 text-green-600" />;
      case 'logout':
        return <LogOut className="h-4 w-4 text-gray-600" />;
      case 'profile_update':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'password_change':
        return <Lock className="h-4 w-4 text-orange-600" />;
      case '2fa_enabled':
      case '2fa_disabled':
        return <Shield className="h-4 w-4 text-purple-600" />;
      case 'preferences_update':
        return <Settings className="h-4 w-4 text-indigo-600" />;
      case 'avatar_upload':
      case 'cover_image_upload':
        return <Image className="h-4 w-4 text-pink-600" />;
      case 'session_revoked':
        return <LogOut className="h-4 w-4 text-red-600" />;
      case 'account_deletion_requested':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'data_export':
        return <Download className="h-4 w-4 text-blue-600" />;
      default:
        return <Eye className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionBadgeColor = () => {
    switch (activity.action_type) {
      case 'login':
        return 'bg-green-100 text-green-800';
      case 'logout':
        return 'bg-gray-100 text-gray-800';
      case 'profile_update':
        return 'bg-blue-100 text-blue-800';
      case 'password_change':
        return 'bg-orange-100 text-orange-800';
      case '2fa_enabled':
        return 'bg-purple-100 text-purple-800';
      case '2fa_disabled':
        return 'bg-red-100 text-red-800';
      case 'preferences_update':
        return 'bg-indigo-100 text-indigo-800';
      case 'avatar_upload':
      case 'cover_image_upload':
        return 'bg-pink-100 text-pink-800';
      case 'session_revoked':
        return 'bg-red-100 text-red-800';
      case 'account_deletion_requested':
        return 'bg-red-100 text-red-800';
      case 'data_export':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = () => {
    try {
      return formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  const formatActionType = () => {
    return activity.action_type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="flex items-start space-x-3 p-4 border-b last:border-0 hover:bg-gray-50 transition-colors">
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">
        {getActionIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <Badge variant="secondary" className={`text-xs ${getActionBadgeColor()}`}>
            {formatActionType()}
          </Badge>
          <span className="text-sm text-gray-500">
            {formatTime()}
          </span>
        </div>

        <p className="text-sm text-gray-900 mb-2">
          {activity.description}
        </p>

        {/* Metadata */}
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          {activity.location && (
            <span className="flex items-center">
              📍 {activity.location}
            </span>
          )}
          {activity.ip_address && (
            <span className="flex items-center">
              🌐 {activity.ip_address}
            </span>
          )}
          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <span className="flex items-center">
              ℹ️ Additional details available
            </span>
          )}
        </div>

        {/* Additional metadata */}
        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
          <details className="mt-2">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
              Show details
            </summary>
            <pre className="mt-1 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(activity.metadata, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

