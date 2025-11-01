"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'react-hot-toast';
import axios from 'axios';

// Components
import ProfileImageUpload from './components/ProfileImageUpload';
import CoverImageUpload from './components/CoverImageUpload';
import ProfileCompletionCircle from './components/ProfileCompletionCircle';
import PasswordStrengthIndicator from './components/PasswordStrengthIndicator';
import QRCodeDisplay from './components/QRCodeDisplay';
import BackupCodesDisplay from './components/BackupCodesDisplay';
import SessionCard from './components/SessionCard';
import ActivityLogItem from './components/ActivityLogItem';
import DeleteAccountModal from './components/DeleteAccountModal';
import ProfileHeader from './components/ProfileHeader';
import IntroductionCard from './components/IntroductionCard';
import PhotosGalleryCard from './components/PhotosGalleryCard';
import CreatePostCard from './components/CreatePostCard';
import PostsFeed from './components/PostsFeed';

// Utils
import { calculateProfileCompletion, getMissingProfileFields } from './utils/profileCompletion';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile: any;
  preferences: any;
  profile_completion_percentage: number;
  two_factor_enabled: boolean;
}

interface ActivityLog {
  activities: any[];
  total: number;
  page: number;
  totalPages: number;
}

interface ProfileClientProps {
  initialData?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile: any;
    preferences: any;
    posts: any[];
    profile_completion_percentage: number;
    two_factor_enabled: boolean;
  };
}

export default function ProfileClient({ initialData }: ProfileClientProps = {}) {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form state
  const [profileData, setProfileData] = useState({
    bio: '',
    phone: '',
    location: '',
    website: '',
    job_title: '',
    company: '',
    linkedin_url: '',
    twitter_url: '',
    facebook_url: '',
    instagram_url: '',
    profile_visibility: 'public',
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    push_notifications: false,
    marketing_emails: false,
    show_email: false,
    show_phone: false,
  });

  // Security state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 2FA state
  const [twoFactorData, setTwoFactorData] = useState({
    qrCodeUrl: '',
    secret: '',
    backupCodes: [] as string[],
    isGenerating: false,
    isVerifying: false,
    verificationToken: '',
  });

  // Profile feed state
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Activity log state
  const [activityLog, setActivityLog] = useState<ActivityLog>({
    activities: [],
    total: 0,
    page: 1,
    totalPages: 0,
  });

  // Sessions state
  const [sessions, setSessions] = useState<any[]>([]);

  // Modals state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load user data (skip if initialData is provided from server)
  useEffect(() => {
    if (initialData) {
      // Use server-provided data
      setUser(initialData);
      setProfileData({
        bio: initialData.profile?.bio || '',
        phone: initialData.profile?.phone || '',
        location: initialData.profile?.location || '',
        website: initialData.profile?.website || '',
        job_title: initialData.profile?.job_title || '',
        company: initialData.profile?.company || '',
        linkedin_url: initialData.profile?.linkedin_url || '',
        twitter_url: initialData.profile?.twitter_url || '',
        facebook_url: initialData.profile?.facebook_url || '',
        instagram_url: initialData.profile?.instagram_url || '',
        profile_visibility: initialData.profile?.profile_visibility || 'public',
      });
      setPreferences(initialData.preferences || preferences);
      setUserPosts(initialData.posts || []);
      setLoading(false);
    } else {
      // Fallback to client-side fetch (for backward compatibility)
      loadUserData();
    }
  }, [initialData]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/profile');
      const userData = response.data;
      
      setUser(userData);
      setProfileData({
        bio: userData.profile?.bio || '',
        phone: userData.profile?.phone || '',
        location: userData.profile?.location || '',
        website: userData.profile?.website || '',
        job_title: userData.profile?.job_title || '',
        company: userData.profile?.company || '',
        linkedin_url: userData.profile?.linkedin_url || '',
        twitter_url: userData.profile?.twitter_url || '',
        facebook_url: userData.profile?.facebook_url || '',
        instagram_url: userData.profile?.instagram_url || '',
        profile_visibility: userData.profile?.profile_visibility || 'public',
      });
      setPreferences(userData.preferences || preferences);
    } catch (error: any) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLog = async (page = 1) => {
    try {
      const response = await axios.get(`/api/profile/activity?page=${page}&limit=20`);
      setActivityLog(response.data);
    } catch (error: any) {
      console.error('Error loading activity log:', error);
      toast.error('Failed to load activity log');
    }
  };

  const loadSessions = async () => {
    try {
      const response = await axios.get('/api/profile/sessions');
      setSessions(response.data);
    } catch (error: any) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load sessions');
    }
  };

  // Profile handlers
  const handleProfileSave = async () => {
    try {
      setSaving(true);
      await axios.patch('/api/profile', profileData);
      toast.success('Profile updated successfully');
      await loadUserData(); // Reload to get updated completion percentage
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (url: string | null) => {
    try {
      // Optimistic update - update UI immediately
      if (user) {
        setUser({
          ...user,
          profile: {
            ...(user.profile || {}),
            avatar_url: url || null,
          },
        });
      }

      if (!url) {
        // Remove avatar using DELETE endpoint
        await axios.delete('/api/profile/images?type=avatar');
        toast.success('Avatar removed successfully');
        await loadUserData(); // Refresh to ensure consistency
        return;
      }

      const response = await axios.post('/api/profile/images', {
        imageUrl: url,
        imageType: 'avatar',
      });
      
      toast.success('Avatar updated successfully');
      await loadUserData(); // Refresh to ensure consistency
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update avatar';
      toast.error(errorMessage);
      // Revert optimistic update on error
      await loadUserData();
    }
  };

  const handleCoverChange = async (url: string | null) => {
    try {
      // Optimistic update - update UI immediately
      if (user) {
        setUser({
          ...user,
          profile: {
            ...(user.profile || {}),
            cover_image_url: url || null,
          },
        });
      }

      if (!url) {
        // Remove cover image using DELETE endpoint
        await axios.delete('/api/profile/images?type=cover');
        toast.success('Cover image removed successfully');
        await loadUserData(); // Refresh to ensure consistency
        return;
      }

      const response = await axios.post('/api/profile/images', {
        imageUrl: url,
        imageType: 'cover',
      });
      
      toast.success('Cover image updated successfully');
      await loadUserData(); // Refresh to ensure consistency
    } catch (error: any) {
      console.error('Error updating cover image:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update cover image';
      toast.error(errorMessage);
      // Revert optimistic update on error
      await loadUserData();
    }
  };

  // Preferences handlers
  const handlePreferencesSave = async () => {
    try {
      setSaving(true);
      await axios.patch('/api/profile/preferences', preferences);
      toast.success('Preferences updated successfully');
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  // Security handlers
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setSaving(true);
      await axios.post('/api/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // 2FA handlers
  const handleGenerate2FA = async () => {
    try {
      setTwoFactorData(prev => ({ ...prev, isGenerating: true }));
      const response = await axios.post('/api/profile/2fa', { action: 'generate' });
      
      setTwoFactorData(prev => ({
        ...prev,
        qrCodeUrl: response.data.qrCodeUrl,
        secret: response.data.secret,
        backupCodes: response.data.backupCodes,
        isGenerating: false,
      }));
    } catch (error: any) {
      console.error('Error generating 2FA:', error);
      toast.error('Failed to generate 2FA setup');
      setTwoFactorData(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleVerify2FA = async () => {
    try {
      setTwoFactorData(prev => ({ ...prev, isVerifying: true }));
      await axios.post('/api/profile/2fa', {
        action: 'verify',
        token: twoFactorData.verificationToken,
      });
      
      toast.success('2FA enabled successfully');
      setTwoFactorData(prev => ({
        ...prev,
        verificationToken: '',
        isVerifying: false,
      }));
      await loadUserData();
    } catch (error: any) {
      console.error('Error verifying 2FA:', error);
      toast.error(error.response?.data?.error || 'Failed to verify 2FA');
      setTwoFactorData(prev => ({ ...prev, isVerifying: false }));
    }
  };

  const handleDisable2FA = async () => {
    try {
      setSaving(true);
      await axios.delete('/api/profile/2fa', {
        data: { token: twoFactorData.verificationToken },
      });
      
      toast.success('2FA disabled successfully');
      setTwoFactorData(prev => ({
        ...prev,
        verificationToken: '',
        qrCodeUrl: '',
        secret: '',
        backupCodes: [],
      }));
      await loadUserData();
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      toast.error(error.response?.data?.error || 'Failed to disable 2FA');
    } finally {
      setSaving(false);
    }
  };

  // Session handlers
  const handleRevokeSession = async (sessionId: string) => {
    try {
      await axios.delete(`/api/profile/sessions?sessionId=${sessionId}`);
      toast.success('Session revoked');
      await loadSessions();
    } catch (error: any) {
      console.error('Error revoking session:', error);
      toast.error('Failed to revoke session');
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await axios.delete('/api/profile/sessions?revokeAll=true');
      toast.success('All sessions revoked');
      await loadSessions();
    } catch (error: any) {
      console.error('Error revoking sessions:', error);
      toast.error('Failed to revoke sessions');
    }
  };

  // Data export handler
  const handleDataExport = async () => {
    try {
      const response = await axios.get('/api/profile/export', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bookin-data-export-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  // Account deletion handler
  const handleAccountDeletion = async (confirmationText: string) => {
    try {
      await axios.post('/api/profile/delete', { confirmationText });
      toast.success('Account deletion request submitted');
      setShowDeleteModal(false);
    } catch (error: any) {
      console.error('Error requesting account deletion:', error);
      toast.error(error.response?.data?.error || 'Failed to submit deletion request');
    }
  };

  // Load data when switching tabs
  useEffect(() => {
    if (activeTab === 'activity') {
      loadActivityLog();
    } else if (activeTab === 'security') {
      loadSessions();
    } else if (activeTab === 'profile' && !initialData) {
      // Only load posts if we don't have initialData
      loadPosts();
    }
  }, [activeTab, initialData]);

  const loadPosts = async () => {
    try {
      setLoadingPosts(true);
      const response = await axios.get('/api/profile/posts');
      setUserPosts(response.data || []);
    } catch (error: any) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoadingPosts(false);
    }
  };


  const handlePostCreated = () => {
    loadPosts();
  };

  const handlePostDeleted = () => {
    loadPosts();
  };

  const handlePostUpdated = () => {
    loadPosts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Failed to load profile data</p>
        <Button onClick={loadUserData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const missingFields = getMissingProfileFields({
    ...(user.profile || {}),
    email_verified: true, // Assume verified for now
    two_factor_enabled: user.two_factor_enabled || false,
  });

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen pb-8">
      {/* Profile Header */}
      {user && (
        <div className="container mx-auto py-8 px-5">
          <ProfileHeader
            coverImageUrl={user.profile?.cover_image_url}
            avatarUrl={user.profile?.avatar_url}
            firstName={user.first_name}
            lastName={user.last_name}
            email={user.email}
            location={user.profile?.location}
            jobTitle={user.profile?.job_title}
            profileCompletionPercentage={user.profile_completion_percentage}
            isVerified={false}
            postsCount={0}
            followersCount={0}
            followingCount={0}
            socialLinks={{
              linkedin: user.profile?.linkedin_url,
              twitter: user.profile?.twitter_url,
              facebook: user.profile?.facebook_url,
              instagram: user.profile?.instagram_url,
            }}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onCoverChange={handleCoverChange}
            onAvatarChange={handleAvatarChange}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto py-8 px-5">
        {user ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Profile Tab - Social Feed */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Left Column - Introduction & Photos (4 columns) */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <IntroductionCard user={user || {}} />
                <PhotosGalleryCard 
                  canUpload={true}
                />
              </div>

              {/* Right Column - Create Post & Feed (8 columns) */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <CreatePostCard onPostCreated={handlePostCreated} />
                {loadingPosts ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading posts...</p>
                  </div>
                ) : (
                  <PostsFeed
                    posts={userPosts}
                    user={user || {}}
                    currentUserId={user?.id}
                    onPostDeleted={handlePostDeleted}
                    onPostUpdated={handlePostUpdated}
                  />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab - Profile Settings Forms */}
          <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cover Image */}
              <div>
                <Label className="text-base font-medium">Cover Image</Label>
                <CoverImageUpload
                  currentCoverUrl={user.profile?.cover_image_url}
                  onCoverChange={handleCoverChange}
                />
              </div>

              {/* Avatar */}
              <div>
                <Label className="text-base font-medium">Profile Picture</Label>
                <ProfileImageUpload
                  currentAvatarUrl={user.profile?.avatar_url}
                  userName={`${user.first_name} ${user.last_name}`}
                  onAvatarChange={handleAvatarChange}
                />
              </div>

              <Separator />

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={user.first_name}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Contact support to change your name
                  </p>
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={user.last_name}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Contact support to change your email
                </p>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profileData.location}
                    onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profileData.website}
                  onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {profileData.bio.length}/500 characters
                </p>
              </div>

              {/* Professional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={profileData.job_title}
                    onChange={(e) => setProfileData(prev => ({ ...prev, job_title: e.target.value }))}
                    placeholder="Software Engineer"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profileData.company}
                    onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Acme Inc."
                  />
                </div>
              </div>

              {/* Social Media Links */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Social Media</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={profileData.linkedin_url}
                      onChange={(e) => setProfileData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      value={profileData.twitter_url}
                      onChange={(e) => setProfileData(prev => ({ ...prev, twitter_url: e.target.value }))}
                      placeholder="https://twitter.com/username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={profileData.facebook_url}
                      onChange={(e) => setProfileData(prev => ({ ...prev, facebook_url: e.target.value }))}
                      placeholder="https://facebook.com/username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={profileData.instagram_url}
                      onChange={(e) => setProfileData(prev => ({ ...prev, instagram_url: e.target.value }))}
                      placeholder="https://instagram.com/username"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Completion */}
              {missingFields.length > 0 && (
                <Alert>
                  <AlertDescription>
                    <strong>Complete your profile:</strong> Add these fields to improve your profile completion:
                    <ul className="mt-2 list-disc list-inside">
                      {missingFields.slice(0, 5).map((field, index) => (
                        <li key={index}>{field}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={handleProfileSave} disabled={saving} className="w-full">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about updates and activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={preferences.email_notifications}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, email_notifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pushNotifications">Push Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={preferences.push_notifications}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, push_notifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketingEmails">Marketing Emails</Label>
                    <p className="text-sm text-gray-500">
                      Receive promotional emails and updates
                    </p>
                  </div>
                  <Switch
                    id="marketingEmails"
                    checked={preferences.marketing_emails}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, marketing_emails: checked }))
                    }
                  />
                </div>
              </div>

              <Button onClick={handlePreferencesSave} disabled={saving} className="w-full">
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                />
                {passwordData.newPassword && (
                  <PasswordStrengthIndicator password={passwordData.newPassword} />
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>

              <Button onClick={handlePasswordChange} disabled={saving} className="w-full">
                {saving ? 'Changing Password...' : 'Change Password'}
              </Button>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!user.two_factor_enabled ? (
                <div className="space-y-4">
                  {!twoFactorData.qrCodeUrl ? (
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">
                        Enable two-factor authentication to secure your account
                      </p>
                      <Button 
                        onClick={handleGenerate2FA} 
                        disabled={twoFactorData.isGenerating}
                      >
                        {twoFactorData.isGenerating ? 'Generating...' : 'Enable 2FA'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <QRCodeDisplay
                        qrCodeUrl={twoFactorData.qrCodeUrl}
                        secret={twoFactorData.secret}
                        userEmail={user.email}
                      />
                      
                      <div>
                        <Label htmlFor="verificationToken">Verification Code</Label>
                        <Input
                          id="verificationToken"
                          value={twoFactorData.verificationToken}
                          onChange={(e) => setTwoFactorData(prev => ({ ...prev, verificationToken: e.target.value }))}
                          placeholder="Enter 6-digit code from your app"
                          maxLength={6}
                        />
                      </div>

                      <div className="flex space-x-2">
                        <Button 
                          onClick={handleVerify2FA} 
                          disabled={twoFactorData.isVerifying || twoFactorData.verificationToken.length !== 6}
                          className="flex-1"
                        >
                          {twoFactorData.isVerifying ? 'Verifying...' : 'Verify & Enable'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setTwoFactorData(prev => ({ ...prev, qrCodeUrl: '', secret: '', backupCodes: [] }))}
                        >
                          Cancel
                        </Button>
                      </div>

                      {twoFactorData.backupCodes.length > 0 && (
                        <BackupCodesDisplay backupCodes={twoFactorData.backupCodes} />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      Two-factor authentication is currently enabled for your account.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label htmlFor="disableToken">Verification Code to Disable</Label>
                    <Input
                      id="disableToken"
                      value={twoFactorData.verificationToken}
                      onChange={(e) => setTwoFactorData(prev => ({ ...prev, verificationToken: e.target.value }))}
                      placeholder="Enter 6-digit code from your app"
                      maxLength={6}
                    />
                  </div>

                  <Button 
                    variant="destructive" 
                    onClick={handleDisable2FA}
                    disabled={saving || twoFactorData.verificationToken.length !== 6}
                    className="w-full"
                  >
                    {saving ? 'Disabling...' : 'Disable 2FA'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage your active sessions and devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRevokeAllSessions}
                  disabled={sessions.length <= 1}
                >
                  Revoke All Others
                </Button>
              </div>

              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onRevoke={handleRevokeSession}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                View your recent account activity and security events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-0">
                  {activityLog.activities.map((activity) => (
                    <ActivityLogItem key={activity.id} activity={activity} />
                  ))}
                </div>
              </ScrollArea>

              {activityLog.totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadActivityLog(activityLog.page - 1)}
                      disabled={activityLog.page <= 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-3 text-sm text-gray-600">
                      Page {activityLog.page} of {activityLog.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadActivityLog(activityLog.page + 1)}
                      disabled={activityLog.page >= activityLog.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control your privacy and data settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="profileVisibility">Profile Visibility</Label>
                  <Select
                    value={profileData.profile_visibility}
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, profile_visibility: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="connections">Connections Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="showEmail">Show Email Address</Label>
                    <p className="text-sm text-gray-500">
                      Display your email address on your public profile
                    </p>
                  </div>
                  <Switch
                    id="showEmail"
                    checked={preferences.show_email}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, show_email: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="showPhone">Show Phone Number</Label>
                    <p className="text-sm text-gray-500">
                      Display your phone number on your public profile
                    </p>
                  </div>
                  <Switch
                    id="showPhone"
                    checked={preferences.show_phone}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, show_phone: checked }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Data Management</h3>
                  <p className="text-sm text-gray-600">
                    Manage your personal data and account
                  </p>
                </div>

                <div className="flex space-x-4">
                  <Button variant="outline" onClick={handleDataExport}>
                    Export My Data
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          </TabsContent>
        </Tabs>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        )}
      </div>

      {/* Delete Account Modal */}
      {user && (
        <DeleteAccountModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleAccountDeletion}
          userEmail={user.email}
        />
      )}
    </div>
  );
}
