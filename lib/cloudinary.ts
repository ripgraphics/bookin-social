/**
 * Cloudinary Image Optimization Utilities
 * Based on: https://cloudinary.com/documentation/image_optimization
 * 
 * Provides automatic format selection (f_auto) and quality optimization (q_auto:low)
 * for maximum compression while maintaining acceptable visual quality.
 */

/**
 * Optimizes Cloudinary image URLs with automatic format and quality settings
 * Applies f_auto (WebP/AVIF/JPEG) and q_auto:low (maximum compression)
 */
export function getOptimizedCloudinaryUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
  } = {}
): string {
  if (!url || !url.includes('res.cloudinary.com')) {
    return url || '/images/placeholder.jpg';
  }

  // Parse Cloudinary URL: https://res.cloudinary.com/{cloud}/image/upload/{transformations}/{publicId}
  const urlParts = url.split('/upload/');
  if (urlParts.length !== 2) {
    return url;
  }

  const baseUrl = urlParts[0];
  const assetPath = urlParts[1];

  // Build optimization transformations
  const transformations = [
    'f_auto', // Automatic format (WebP/AVIF/JPEG based on browser support)
    'q_auto:low', // Maximum compression with acceptable quality
  ];

  // Add size transformations if specified
  if (options.width) {
    transformations.push(`w_${options.width}`);
  }
  if (options.height) {
    transformations.push(`h_${options.height}`);
  }
  if (options.crop) {
    transformations.push(`c_${options.crop}`);
  }

  const transformationString = transformations.join(',');

  return `${baseUrl}/upload/${transformationString}/${assetPath}`;
}

/**
 * Predefined sizes for common use cases
 * Optimized for performance and visual quality balance
 */
export const CLOUDINARY_SIZES = {
  avatar: { width: 150, height: 150, crop: 'fill' },
  thumbnail: { width: 400, height: 400, crop: 'fill' },
  card: { width: 800, height: 600, crop: 'fill' },
  hero: { width: 1600, height: 900, crop: 'fill' },
  full: { width: 2000, height: 2000, crop: 'limit' },
};

/**
 * Cloudinary folder paths for organized media library
 */
export const CLOUDINARY_FOLDERS = {
  listings: 'bookin/listings',
  userProfileCover: 'bookin/user_profile_cover',
  userAvatar: 'bookin/user_avatar',
  userPhotoAlbum: 'bookin/user_photo_album',
} as const;

export type CloudinaryFolderType = keyof typeof CLOUDINARY_FOLDERS;

