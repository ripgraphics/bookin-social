'use client';

import { useState } from 'react';
import axios from 'axios';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReceiptUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  multiple?: boolean;
}

export default function ReceiptUploader({ value, onChange, multiple = false }: ReceiptUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<string[]>(value ? [value] : []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);

    try {
      const uploadPromises = Array.from(fileList).map(async (file) => {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
          throw new Error(`Invalid file type: ${file.name}. Only images and PDFs are allowed.`);
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File too large: ${file.name}. Maximum size is 10MB.`);
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'property_management/receipts');

        const response = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            // Could add progress bar here if needed
          },
        });

        return response.data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      if (multiple) {
        const newFiles = [...files, ...uploadedUrls];
        setFiles(newFiles);
        // For multiple, we might want to return an array
        // For now, we'll just take the last one
        onChange(uploadedUrls[uploadedUrls.length - 1]);
      } else {
        setFiles([uploadedUrls[0]]);
        onChange(uploadedUrls[0]);
      }

      toast.success(`Uploaded ${uploadedUrls.length} file(s) successfully`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    if (newFiles.length > 0) {
      onChange(newFiles[0]);
    } else {
      onChange('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
              <div className="text-sm text-gray-600 mb-2">
                <label
                  htmlFor="receipt-upload"
                  className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                >
                  <span>Upload a file</span>
                  <input
                    id="receipt-upload"
                    name="receipt-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*,.pdf"
                    multiple={multiple}
                    onChange={handleUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF, PDF up to 10MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Uploaded Files Preview */}
      {files.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Uploaded Files</label>
          <div className="grid grid-cols-1 gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {file.split('/').pop()}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{file}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="ml-4 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

