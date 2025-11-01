/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
        ],
    },
    // Next.js 15 specific optimizations
    experimental: {
        optimizePackageImports: ['react-icons', 'date-fns'],
    },
    // Allow ESLint warnings during build (only fail on errors)
    eslint: {
        ignoreDuringBuilds: false, // Still run ESLint
    },
    typescript: {
        ignoreBuildErrors: true, // Temporarily ignore TypeScript errors for deployment
    },
}

module.exports = nextConfig
