"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, Tablet, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface SessionCardProps {
  session: {
    id: string;
    device_info?: string;
    ip_address?: string;
    location?: string;
    last_active: string;
    created_at: string;
    isCurrent?: boolean;
  };
  onRevoke: (sessionId: string) => void;
}

export default function SessionCard({ session, onRevoke }: SessionCardProps) {
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      await onRevoke(session.id);
    } catch (error) {
      console.error('Error revoking session:', error);
    } finally {
      setIsRevoking(false);
    }
  };

  const getDeviceIcon = () => {
    const deviceInfo = session.device_info?.toLowerCase() || '';
    if (deviceInfo.includes('mobile') || deviceInfo.includes('android') || deviceInfo.includes('iphone')) {
      return <Smartphone className="h-4 w-4" />;
    } else if (deviceInfo.includes('tablet') || deviceInfo.includes('ipad')) {
      return <Tablet className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const formatDeviceInfo = () => {
    if (!session.device_info) return 'Unknown device';
    
    // Parse common device info patterns
    const info = session.device_info;
    if (info.includes('Chrome')) return `Chrome on ${info.split(' ')[0] || 'Unknown OS'}`;
    if (info.includes('Firefox')) return `Firefox on ${info.split(' ')[0] || 'Unknown OS'}`;
    if (info.includes('Safari')) return `Safari on ${info.split(' ')[0] || 'Unknown OS'}`;
    
    return info;
  };

  const formatLastActive = () => {
    try {
      return formatDistanceToNow(new Date(session.last_active), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Card className={session.isCurrent ? 'ring-2 ring-blue-500' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {getDeviceIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {formatDeviceInfo()}
                </p>
                {session.isCurrent && (
                  <Badge variant="secondary" className="text-xs">
                    Current
                  </Badge>
                )}
              </div>
              
              <div className="mt-1 space-y-1">
                {session.location && (
                  <p className="text-xs text-gray-500">
                    📍 {session.location}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  🌐 {session.ip_address || 'Unknown IP'}
                </p>
                <p className="text-xs text-gray-500">
                  Last active: {formatLastActive()}
                </p>
                <p className="text-xs text-gray-500">
                  Created: {new Date(session.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {!session.isCurrent && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleRevoke}
                  disabled={isRevoking}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isRevoking ? 'Revoking...' : 'Revoke Session'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

