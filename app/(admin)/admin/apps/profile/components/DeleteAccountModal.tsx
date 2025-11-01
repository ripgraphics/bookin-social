"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmationText: string) => Promise<void>;
  userEmail?: string;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  userEmail = '',
}: DeleteAccountModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [understood, setUnderstood] = useState(false);

  const expectedText = 'DELETE';
  const isConfirmationValid = confirmationText === expectedText;
  const canProceed = isConfirmationValid && acknowledged && understood;

  const handleConfirm = async () => {
    if (!canProceed) return;

    setIsDeleting(true);
    try {
      await onConfirm(confirmationText);
      // Reset form
      setConfirmationText('');
      setAcknowledged(false);
      setUnderstood(false);
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmationText('');
      setAcknowledged(false);
      setUnderstood(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <Trash2 className="h-5 w-5 mr-2" />
            Delete Account
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account and remove all data from our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Alert */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Warning:</strong> This action is irreversible. All your data will be permanently deleted.
            </AlertDescription>
          </Alert>

          {/* What will be deleted */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">The following will be permanently deleted:</Label>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Your profile and all personal information</li>
              <li>• All listings you&apos;ve created</li>
              <li>• All reservations and bookings</li>
              <li>• All messages and communications</li>
              <li>• All uploaded images and files</li>
              <li>• Your account settings and preferences</li>
              <li>• All activity logs and history</li>
            </ul>
          </div>

          {/* Confirmation checkboxes */}
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="acknowledged"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
              />
              <Label htmlFor="acknowledged" className="text-sm">
                I understand that this action cannot be undone and all my data will be permanently deleted.
              </Label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="understood"
                checked={understood}
                onCheckedChange={(checked) => setUnderstood(checked as boolean)}
              />
              <Label htmlFor="understood" className="text-sm">
                I have backed up any important data and no longer need access to this account.
              </Label>
            </div>
          </div>

          {/* Confirmation text input */}
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              To confirm, type <strong>DELETE</strong> in the box below:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className={isConfirmationValid ? 'border-green-500' : 'border-red-500'}
            />
            {confirmationText && !isConfirmationValid && (
              <p className="text-sm text-red-600">
                Please type exactly &quot;DELETE&quot; to confirm
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canProceed || isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? 'Deleting Account...' : 'Delete Account Permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

