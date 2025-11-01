"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Copy, Eye, EyeOff, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface BackupCodesDisplayProps {
  backupCodes: string[];
  onRegenerate?: () => void;
}

export default function BackupCodesDisplay({ backupCodes, onRegenerate }: BackupCodesDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'));
      setCopied(true);
      toast.success('Backup codes copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy backup codes');
    }
  };

  const handleDownload = () => {
    const content = `Bookin - Two-Factor Authentication Backup Codes

Generated: ${new Date().toLocaleString()}

IMPORTANT: Store these codes in a safe place. Each code can only be used once.

${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

If you lose access to your authenticator app, you can use these codes to access your account.
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bookin-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Backup Codes
        </CardTitle>
        <CardDescription>
          Save these codes in a safe place. Each code can only be used once.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warning */}
        <Alert>
          <AlertDescription>
            <strong>Important:</strong> These backup codes are your only way to access your account if you lose your authenticator app. Store them securely and never share them.
          </AlertDescription>
        </Alert>

        {/* Codes Display */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Your backup codes:</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
            >
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {isVisible ? 'Hide' : 'Show'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg">
            {backupCodes.map((code, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                <code className="text-sm font-mono">
                  {isVisible ? code : '••••••••'}
                </code>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button onClick={handleCopyAll} variant="outline" disabled={copied}>
            <Copy className="h-4 w-4 mr-2" />
            {copied ? 'Copied!' : 'Copy All'}
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        {/* Regenerate */}
        {onRegenerate && (
          <div className="pt-4 border-t">
            <Button onClick={onRegenerate} variant="destructive" className="w-full">
              Regenerate Backup Codes
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              This will invalidate all existing backup codes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

