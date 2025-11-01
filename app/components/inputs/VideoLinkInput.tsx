'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface VideoLinkInputProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
}

/**
 * Supported video platforms
 */
export type VideoPlatform = 'youtube' | 'vimeo' | 'dailymotion' | 'tiktok' | null;

/**
 * Detect which video platform a URL belongs to
 */
function detectPlatform(url: string): VideoPlatform {
  if (!url) return null;

  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/vimeo\.com/.test(url)) return 'vimeo';
  if (/dailymotion\.com|dai\.ly/.test(url)) return 'dailymotion';
  if (/tiktok\.com/.test(url)) return 'tiktok';

  return null;
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }

  return null;
}

/**
 * Extract Vimeo video ID from various URL formats
 */
function extractVimeoVideoId(url: string): string | null {
  if (!url) return null;

  // Patterns: vimeo.com/VIDEO_ID, vimeo.com/channels/CHANNEL/VIDEO_ID, player.vimeo.com/video/VIDEO_ID
  const patterns = [
    /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(?:channels\/[^\/]+\/)?(\d+)/,
    /^(\d+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract Dailymotion video ID from various URL formats
 */
function extractDailymotionVideoId(url: string): string | null {
  if (!url) return null;

  // Patterns: dailymotion.com/video/VIDEO_ID, dai.ly/VIDEO_ID
  const patterns = [
    /(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/,
    /^([a-zA-Z0-9]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract TikTok video ID from URL format
 */
function extractTikTokVideoId(url: string): string | null {
  if (!url) return null;

  // Pattern: tiktok.com/@USERNAME/video/VIDEO_ID
  const pattern = /tiktok\.com\/@[^\/]+\/video\/(\d+)/;
  const match = url.match(pattern);
  
  if (match) {
    return match[1];
  }

  return null;
}

/**
 * Convert video URL to embeddable format based on platform
 */
function convertToEmbedUrl(url: string): { embedUrl: string; platform: VideoPlatform } | null {
  if (!url.trim()) return null;

  const platform = detectPlatform(url);
  
  if (!platform) return null;

  let videoId: string | null = null;
  let embedUrl: string | null = null;

  switch (platform) {
    case 'youtube':
      videoId = extractYouTubeVideoId(url);
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
      break;

    case 'vimeo':
      videoId = extractVimeoVideoId(url);
      if (videoId) {
        embedUrl = `https://player.vimeo.com/video/${videoId}`;
      }
      break;

    case 'dailymotion':
      videoId = extractDailymotionVideoId(url);
      if (videoId) {
        embedUrl = `https://www.dailymotion.com/embed/video/${videoId}`;
      }
      break;

    case 'tiktok':
      videoId = extractTikTokVideoId(url);
      if (videoId) {
        // TikTok iframe embed format: https://www.tiktok.com/embed/v2/VIDEO_ID
        embedUrl = `https://www.tiktok.com/embed/v2/${videoId}`;
      }
      break;

    default:
      return null;
  }

  if (embedUrl) {
    return { embedUrl, platform };
  }

  return null;
}

/**
 * Validate if URL is a valid video platform URL
 */
function isValidVideoUrl(url: string): boolean {
  if (!url.trim()) return false;
  
  const result = convertToEmbedUrl(url);
  return result !== null;
}

const VideoLinkInput: React.FC<VideoLinkInputProps> = ({
  value = '',
  onChange,
  disabled = false,
  placeholder = 'Paste video link (YouTube, Vimeo, Dailymotion, TikTok)...',
  label = 'Video Link',
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [hasBlurred, setHasBlurred] = useState(false);

  // Update state when value prop changes
  useEffect(() => {
    setInputValue(value || '');
    if (value) {
      const result = convertToEmbedUrl(value);
      setEmbedUrl(result?.embedUrl || null);
      setIsValid(result !== null);
    } else {
      setEmbedUrl(null);
      setIsValid(false);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (!newValue.trim()) {
      setEmbedUrl(null);
      setIsValid(false);
      onChange('');
      return;
    }

    const result = convertToEmbedUrl(newValue);
    if (result) {
      setEmbedUrl(result.embedUrl);
      setIsValid(true);
      onChange(result.embedUrl); // Return embed URL to parent
    } else {
      setEmbedUrl(null);
      setIsValid(false);
      // Don't call onChange with invalid URL
      if (hasBlurred) {
        // Only show error after user has interacted
      }
    }
  };

  const handleBlur = () => {
    setHasBlurred(true);
    if (inputValue.trim() && !isValid) {
      toast.error('Please enter a valid video link from YouTube, Vimeo, Dailymotion, or TikTok');
    }
  };

  const handleClear = () => {
    setInputValue('');
    setEmbedUrl(null);
    setIsValid(false);
    onChange('');
    setHasBlurred(false);
  };

  return (
    <div className="w-full space-y-3">
      <div className="space-y-2">
        <Label htmlFor="video-link-input">{label}</Label>
        <div className="relative">
          <Input
            id="video-link-input"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder={placeholder}
            className={`pr-10 ${
              hasBlurred && inputValue && !isValid
                ? 'border-red-500 focus:border-red-500'
                : isValid && inputValue
                ? 'border-green-500 focus:border-green-500'
                : ''
            }`}
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-100 rounded transition-colors"
              aria-label="Clear video link"
            >
              <AlertCircle className="h-4 w-4 text-neutral-400" />
            </button>
          )}
        </div>
      </div>

      {/* Validation Messages */}
      {hasBlurred && inputValue && !isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please enter a valid video link from a supported platform. Supported platforms:
            <ul className="list-disc list-inside mt-1 text-sm space-y-1">
              <li><strong>YouTube:</strong> youtube.com/watch?v=VIDEO_ID, youtu.be/VIDEO_ID</li>
              <li><strong>Vimeo:</strong> vimeo.com/VIDEO_ID, player.vimeo.com/video/VIDEO_ID</li>
              <li><strong>Dailymotion:</strong> dailymotion.com/video/VIDEO_ID, dai.ly/VIDEO_ID</li>
              <li><strong>TikTok:</strong> tiktok.com/@USERNAME/video/VIDEO_ID</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {isValid && inputValue && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Valid video link detected. Preview will appear below.
          </AlertDescription>
        </Alert>
      )}

      {/* Video Preview */}
      {embedUrl && isValid && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Preview</Label>
          <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-neutral-200 bg-neutral-100">
            <iframe
              src={embedUrl}
              title="Video preview"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoLinkInput;

