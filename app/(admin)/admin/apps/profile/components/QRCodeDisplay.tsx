"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Download, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

interface QRCodeDisplayProps {
  qrCodeUrl: string;
  secret: string;
  userEmail: string;
}

export default function QRCodeDisplay({ qrCodeUrl, secret, userEmail }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      toast.success('Secret copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy secret');
    }
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `2fa-qr-code-${userEmail}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR code downloaded');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Smartphone className="h-5 w-5 mr-2" />
          Setup Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Scan the QR code with your authenticator app to enable 2FA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
            <img
              src={qrCodeUrl}
              alt="2FA QR Code"
              className="w-48 h-48"
            />
          </div>
        </div>

        {/* Instructions */}
        <Alert>
          <AlertDescription>
            <strong>Instructions:</strong>
            <ol className="mt-2 space-y-1 list-decimal list-inside">
              <li>Install an authenticator app like Google Authenticator, Authy, or 1Password</li>
              <li>Open the app and scan this QR code</li>
              <li>Enter the 6-digit code from your app to verify setup</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Manual Entry */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Can&apos;t scan? Enter this code manually:</label>
          <div className="flex items-center space-x-2">
            <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono break-all">
              {secret}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySecret}
              disabled={copied}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button onClick={handleDownloadQR} variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download QR Code
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

