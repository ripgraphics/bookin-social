'use client';

import { useState, useCallback, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { X, RotateCw } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // 1 for square/circle, 16/9 for cover, null for free
  cropShape?: 'rect' | 'round';
  minWidth?: number;
  minHeight?: number;
}

export default function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
  cropShape = 'rect',
  minWidth = 100,
  minHeight = 100,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    
    // Initialize crop centered
    const crop = makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspectRatio || 1,
      naturalWidth,
      naturalHeight
    );
    
    setCrop(centerCrop(crop, naturalWidth, naturalHeight));
  }, [aspectRatio]);

  const getCroppedImg = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return;
    }

    setIsProcessing(true);

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    const pixelRatio = window.devicePixelRatio;
    canvas.width = crop.width * scaleX * pixelRatio;
    canvas.height = crop.height * scaleY * pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;

    ctx.save();

    // If circular crop, create circular clipping path
    if (cropShape === 'round') {
      ctx.beginPath();
      ctx.arc(
        canvas.width / (2 * pixelRatio),
        canvas.height / (2 * pixelRatio),
        Math.min(canvas.width, canvas.height) / (2 * pixelRatio),
        0,
        2 * Math.PI
      );
      ctx.clip();
    }

    ctx.drawImage(
      image,
      cropX,
      cropY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width / pixelRatio,
      canvas.height / pixelRatio
    );

    ctx.restore();

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1.0
      );
    });
  }, [completedCrop, cropShape]);

  const handleCropComplete = async () => {
    try {
      const blob = await getCroppedImg();
      if (blob) {
        onCropComplete(blob);
      }
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center min-h-[400px] max-h-[600px]">
        <div className={cropShape === 'round' ? 'relative' : ''}>
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio || undefined}
            minWidth={minWidth}
            minHeight={minHeight}
            className={cropShape === 'round' ? '[&_.ReactCrop__crop-selection]:rounded-full' : ''}
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imageSrc}
              style={{ maxHeight: '600px', maxWidth: '100%' }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>
      </div>
      
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleCropComplete} disabled={isProcessing || !completedCrop}>
          {isProcessing ? (
            <>
              <RotateCw className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Apply Crop'
          )}
        </Button>
      </div>
    </div>
  );
}

