"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import ProfileCompletionCircle from './ProfileCompletionCircle';
import { 
  Linkedin, 
  Twitter, 
  Facebook, 
  Instagram, 
  MapPin, 
  Briefcase, 
  Phone,
  Globe
} from 'lucide-react';

interface ProfileSidebarProps {
  avatarUrl?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  location?: string | null;
  jobTitle?: string | null;
  company?: string | null;
  phone?: string | null;
  website?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  profileCompletionPercentage: number;
}

export default function ProfileSidebar({
  avatarUrl,
  firstName,
  lastName,
  email,
  location,
  jobTitle,
  company,
  phone,
  website,
  linkedinUrl,
  twitterUrl,
  facebookUrl,
  instagramUrl,
  profileCompletionPercentage,
}: ProfileSidebarProps) {
  const getInitials = () => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const socialLinks = [
    { icon: Linkedin, url: linkedinUrl, color: 'text-blue-600' },
    { icon: Twitter, url: twitterUrl, color: 'text-blue-400' },
    { icon: Facebook, url: facebookUrl, color: 'text-blue-700' },
    { icon: Instagram, url: instagramUrl, color: 'text-pink-600' },
  ].filter(link => link.url);

  return (
    <div className="space-y-6">
      {/* Profile Summary Card */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Avatar */}
            <div className="relative">
              <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                <div className="h-full w-full rounded-full bg-white p-1">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">
                        {getInitials()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Name & Email */}
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {firstName} {lastName}
              </h3>
              <p className="text-sm text-gray-600">{email}</p>
            </div>

            <Separator />

            {/* Contact Info */}
            <div className="w-full space-y-3 text-left">
              {location && (
                <div className="flex items-center text-sm text-gray-700">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
              )}
              
              {jobTitle && (
                <div className="flex items-center text-sm text-gray-700">
                  <Briefcase className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                  <span className="truncate">{jobTitle}</span>
                </div>
              )}

              {company && (
                <div className="flex items-center text-sm text-gray-700">
                  <Briefcase className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                  <span className="truncate">{company}</span>
                </div>
              )}

              {phone && (
                <div className="flex items-center text-sm text-gray-700">
                  <Phone className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                  <span className="truncate">{phone}</span>
                </div>
              )}

              {website && (
                <div className="flex items-center text-sm text-gray-700">
                  <Globe className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                  <a 
                    href={website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    {website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>

            <Separator />

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center justify-center space-x-3">
                {socialLinks.map(({ icon: Icon, url, color }) => (
                  <a
                    key={url}
                    href={url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${color} hover:opacity-80 transition-opacity`}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Completion Card */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <h4 className="text-lg font-semibold mb-4 text-center">
            Profile Completion
          </h4>
          <div className="flex justify-center">
            <ProfileCompletionCircle 
              percentage={profileCompletionPercentage} 
              size="md" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Card */}
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <h4 className="text-lg font-semibold mb-4">Quick Stats</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Listings</span>
              <span className="font-semibold">0</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Reservations</span>
              <span className="font-semibold">0</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Favorites</span>
              <span className="font-semibold">0</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

