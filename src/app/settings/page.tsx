'use client';

import { useState } from 'react';
import { enhancedUserProfile } from '@/lib/mockData';
import TabNavigation from '@/components/ui/TabNavigation';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Download, Trash2 } from 'lucide-react';

const ALL_PLATFORMS = ['PC', 'PS5', 'Xbox Series X', 'Switch', 'Mobile'];

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? 'bg-accent-orange' : 'bg-bg-elevated'
      }`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Profile');
  const [exporting, setExporting] = useState(false);

  // Profile state
  const [displayName, setDisplayName] = useState(
    enhancedUserProfile.displayName
  );
  const [bio, setBio] = useState(enhancedUserProfile.bio);
  const [platforms, setPlatforms] = useState<string[]>(
    enhancedUserProfile.platforms
  );

  // Privacy state
  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showActivity: true,
    showRatingDistribution: true,
    allowFriendRequests: true,
  });

  // Notifications state
  const [notifications, setNotifications] = useState({
    newFollower: true,
    reviewReplies: true,
    listLikes: true,
    gameRecommendations: false,
    weeklyDigest: false,
  });

  const togglePlatform = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const inputClass =
    'bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:border-accent-orange focus:ring-1 focus:ring-accent-orange/30 outline-none w-full';

  const exportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [profile, games, lists, sessions] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_games').select('*').eq('user_id', user.id),
        supabase.from('lists').select('*').eq('user_id', user.id),
        supabase.from('gaming_sessions').select('*').eq('user_id', user.id),
      ]);

      const payload = {
        exported_at: new Date().toISOString(),
        profile: profile.data,
        games: games.data,
        lists: lists.data,
        sessions: sessions.data,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `jeggy-data-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Data exported successfully!', 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Failed to export data', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="ambient-orb w-[350px] h-[350px] -top-24 -right-20 bg-[radial-gradient(circle,rgba(99,102,241,0.07)_0%,transparent_70%)]" />

      <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-primary mb-6">Settings</h1>

      <TabNavigation
        tabs={['Profile', 'Account', 'Privacy', 'Notifications']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="mt-6">
        {/* Profile Tab */}
        {activeTab === 'Profile' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={enhancedUserProfile.username}
                readOnly
                className={`${inputClass} bg-bg-elevated/50 !text-text-muted cursor-not-allowed`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Bio
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Platforms
              </label>
              <div className="flex flex-wrap gap-3">
                {ALL_PLATFORMS.map((platform) => (
                  <label
                    key={platform}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={platforms.includes(platform)}
                      onChange={() => togglePlatform(platform)}
                      className="w-4 h-4 rounded border-border accent-accent-orange"
                    />
                    <span className="text-sm text-text-primary">
                      {platform}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => showToast('Settings saved!', 'success')}
              className="bg-accent-orange text-black px-5 py-2.5 rounded-sm hover:opacity-90 transition-opacity font-medium"
            >
              Save Changes
            </button>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'Account' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Email
              </label>
              <input
                type="email"
                value="alex@example.com"
                readOnly
                className={`${inputClass} bg-bg-elevated/50 !text-text-muted cursor-not-allowed`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-medium text-text-primary">
                  Change Password
                </h3>
                <span className="text-xs bg-bg-elevated text-text-muted px-2 py-0.5 rounded-sm">
                  Coming soon
                </span>
              </div>
              <div className="space-y-3 opacity-50">
                <input
                  type="password"
                  placeholder="Current password"
                  disabled
                  className={`${inputClass} cursor-not-allowed`}
                />
                <input
                  type="password"
                  placeholder="New password"
                  disabled
                  className={`${inputClass} cursor-not-allowed`}
                />
              </div>
            </div>

            {/* Data Export */}
            <div className="border-t border-border pt-6">
              <h3 className="text-sm font-medium text-text-primary mb-2">
                Download Your Data
              </h3>
              <p className="text-sm text-text-muted mb-3">
                Export all your Jeggy data (ratings, reviews, lists, sessions) as a JSON file.
              </p>
              <button
                onClick={exportData}
                disabled={exporting || !user}
                className="inline-flex items-center gap-2 text-sm bg-accent-green text-black px-5 py-2.5 rounded-sm hover:opacity-90 disabled:opacity-50 transition-opacity font-medium"
              >
                <Download size={15} />
                {exporting ? 'Exporting...' : 'Download My Data'}
              </button>
            </div>

            {/* Delete Account */}
            <div className="border-t border-border pt-6">
              <h3 className="text-sm font-medium text-red-400 mb-2">
                Delete Account
              </h3>
              <p className="text-sm text-text-muted mb-3">
                Once you delete your account, there is no going back. All your
                data will be permanently removed.
              </p>
              <button
                disabled
                className="inline-flex items-center gap-2 text-sm text-red-400 border border-red-400/30 px-4 py-2 rounded-sm opacity-50 cursor-not-allowed"
              >
                <Trash2 size={14} />
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'Privacy' && (
          <div className="space-y-4">
            {(
              [
                ['publicProfile', 'Public Profile'],
                ['showActivity', 'Show Activity in Feed'],
                ['showRatingDistribution', 'Show Rating Distribution'],
                ['allowFriendRequests', 'Allow Friend Requests'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm text-text-primary">{label}</span>
                <Toggle
                  enabled={privacy[key]}
                  onToggle={() =>
                    setPrivacy((prev) => ({ ...prev, [key]: !prev[key] }))
                  }
                />
              </div>
            ))}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'Notifications' && (
          <div className="space-y-4">
            {(
              [
                ['newFollower', 'New Follower'],
                ['reviewReplies', 'Review Replies'],
                ['listLikes', 'List Likes'],
                ['gameRecommendations', 'Game Recommendations'],
                ['weeklyDigest', 'Weekly Digest Email'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm text-text-primary">{label}</span>
                <Toggle
                  enabled={notifications[key]}
                  onToggle={() =>
                    setNotifications((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
