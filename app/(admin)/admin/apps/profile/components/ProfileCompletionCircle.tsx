"use client";

import { getProfileCompletionColor, getProfileCompletionMessage } from '../utils/profileCompletion';

interface ProfileCompletionCircleProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProfileCompletionCircle({ percentage, size = 'md' }: ProfileCompletionCircleProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const strokeWidth = {
    sm: 4,
    md: 6,
    lg: 8,
  };

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const colorClass = getProfileCompletionColor(percentage);
  const message = getProfileCompletionMessage(percentage);

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className={`relative ${sizeClasses[size]}`}>
        <svg className="transform -rotate-90" width="100%" height="100%" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth[size]}
            fill="none"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth[size]}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${colorClass} transition-all duration-500`}
          />
        </svg>
        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${textSizeClasses[size]} ${colorClass}`}>
            {percentage}%
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-600 text-center max-w-xs">
        {message}
      </p>
    </div>
  );
}

