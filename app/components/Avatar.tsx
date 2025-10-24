'use client';

import Image from "next/image";
import { getOptimizedCloudinaryUrl, CLOUDINARY_SIZES } from '@/lib/cloudinary';

interface AvatarProps {
    src: string | null | undefined;
};

const Avatar: React.FC<AvatarProps> = ({
    src
}) => {
    const avatarSrc = src 
        ? getOptimizedCloudinaryUrl(src, CLOUDINARY_SIZES.avatar) 
        : "/images/placeholder.jpg";
    
    return (
        <Image
            className="rounded-full"
            height="30"
            width="30"
            alt="Avatar"
            src={avatarSrc}
        />
    );
}

export default Avatar;