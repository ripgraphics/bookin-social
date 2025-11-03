'use client';

import React from 'react';

type StatusVariant = 
  | 'draft' 
  | 'sent' 
  | 'paid' 
  | 'overdue' 
  | 'pending' 
  | 'approved' 
  | 'rejected'
  | 'active'
  | 'inactive'
  | 'completed'
  | 'cancelled'
  | 'refunded';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
}

const statusConfig: Record<StatusVariant, { bg: string; text: string; border: string }> = {
  draft: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-300'
  },
  sent: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300'
  },
  paid: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300'
  },
  overdue: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300'
  },
  pending: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300'
  },
  approved: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300'
  },
  rejected: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300'
  },
  active: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300'
  },
  inactive: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-300'
  },
  completed: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300'
  },
  cancelled: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-300'
  },
  refunded: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300'
  }
};

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
  // Determine variant from status if not provided
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
  const badgeVariant = variant || (normalizedStatus as StatusVariant);
  
  const config = statusConfig[badgeVariant] || statusConfig.draft;

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        border ${config.bg} ${config.text} ${config.border}
      `}
    >
      {status}
    </span>
  );
}

