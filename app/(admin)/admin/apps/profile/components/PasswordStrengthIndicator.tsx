"use client";

import { useEffect, useState } from 'react';
import { validatePasswordStrength, getPasswordStrengthColor, getPasswordStrengthPercentage } from '@/lib/password';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const [strength, setStrength] = useState<ReturnType<typeof validatePasswordStrength> | null>(null);

  useEffect(() => {
    if (password.length > 0) {
      setStrength(validatePasswordStrength(password));
    } else {
      setStrength(null);
    }
  }, [password]);

  if (!strength) {
    return null;
  }

  const percentage = getPasswordStrengthPercentage(strength.score);
  const colorClass = getPasswordStrengthColor(strength.strength);

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Strength label */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium capitalize">
          Password strength: {strength.strength.replace('-', ' ')}
        </span>
        <span className="text-sm text-gray-500">
          {strength.score}/4
        </span>
      </div>

      {/* Feedback */}
      {strength.feedback.length > 0 && (
        <ul className="space-y-1">
          {strength.feedback.map((feedback, index) => (
            <li key={index} className="text-sm text-gray-600 flex items-start">
              <span className="mr-2">•</span>
              <span>{feedback}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

