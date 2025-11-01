"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Mail, Globe, MapPin } from 'lucide-react';

interface IntroductionCardProps {
  user: {
    first_name?: string;
    last_name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profile?: {
      bio?: string;
      company?: string;
      website?: string;
      location?: string;
      job_title?: string;
    };
  };
}

export default function IntroductionCard({ user }: IntroductionCardProps) {
  const profile = user.profile || {};
  const firstName = user.first_name || user.firstName || '';
  const lastName = user.last_name || user.lastName || '';
  const bio = profile.bio || `Hello, I am ${firstName} ${lastName}. I love making websites and graphics. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Introduction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{bio}</p>
        <div className="flex flex-col gap-3">
          {profile.company && (
            <div className="flex gap-3 items-center">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm">{profile.company}</p>
            </div>
          )}
          {user.email && (
            <div className="flex gap-3 items-center">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm">{user.email}</p>
            </div>
          )}
          {profile.website && (
            <div className="flex gap-3 items-center">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm">{profile.website}</p>
            </div>
          )}
          {profile.location && (
            <div className="flex gap-3 items-center">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm">{profile.location}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

