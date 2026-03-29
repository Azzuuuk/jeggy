'use client';

import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { X, Monitor, Gamepad2, Smartphone, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EditProfileModalProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
}

const platformOptions = [
  { id: 'PC', label: 'PC', icon: <Monitor size={16} /> },
  { id: 'PlayStation 5', label: 'PlayStation 5', icon: <Gamepad2 size={16} /> },
  { id: 'Xbox Series X', label: 'Xbox Series X', icon: <Gamepad2 size={16} /> },
  { id: 'Nintendo Switch', label: 'Nintendo Switch', icon: <Gamepad2 size={16} /> },
  { id: 'Mobile', label: 'Mobile', icon: <Smartphone size={16} /> },
];

const gamertag_fields = [
  { key: 'psn', label: 'PSN ID', placeholder: 'e.g. PlayerOne' },
  { key: 'xbox', label: 'Xbox Gamertag', placeholder: 'e.g. PlayerOne' },
  { key: 'nintendo', label: 'Nintendo Friend Code', placeholder: 'e.g. SW-1234-5678-9012' },
  { key: 'steam', label: 'Steam Username', placeholder: 'e.g. PlayerOne' },
] as const;

// Lightweight avatar system using DiceBear API (SVG, no storage needed)
const AVATAR_STYLES = ['bottts', 'shapes', 'icons', 'rings'] as const;
const AVATAR_BG_COLORS = ['CCFF00', '6366F1', 'FF9F7C', 'ef4444', '40bcad', 'F472B6', 'ff8000', 'a78bfa'];
const AVATAR_SEEDS = ['ace', 'bolt', 'nova', 'hex', 'flux', 'arc', 'zen', 'orb', 'pip', 'dot', 'ray', 'ink'];

function buildAvatarUrl(style: string, seed: string, bgColor: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=${bgColor}&size=128`;
}

export default function EditProfileModal({ profile, isOpen, onClose, onSave }: EditProfileModalProps) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(profile.display_name || profile.username);
  const [bio, setBio] = useState(profile.bio || '');
  const [platforms, setPlatforms] = useState<string[]>(profile.platforms || []);
  const [gamertags, setGamertags] = useState<Record<string, string>>({
    psn: profile.gamertags?.psn || '',
    xbox: profile.gamertags?.xbox || '',
    nintendo: profile.gamertags?.nintendo || '',
    steam: profile.gamertags?.steam || '',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>(AVATAR_STYLES[0]);
  const [selectedBg, setSelectedBg] = useState(AVATAR_BG_COLORS[0]);

  // Detect if user has a Google profile picture (not a DiceBear URL)
  const hasGooglePhoto = !!(profile.avatar_url && !profile.avatar_url.includes('dicebear.com'));

  // Sync state when profile changes
  useEffect(() => {
    setDisplayName(profile.display_name || profile.username);
    setBio(profile.bio || '');
    setPlatforms(profile.platforms || []);
    setAvatarUrl(profile.avatar_url || '');
    setGamertags({
      psn: profile.gamertags?.psn || '',
      xbox: profile.gamertags?.xbox || '',
      nintendo: profile.gamertags?.nintendo || '',
      steam: profile.gamertags?.steam || '',
    });
  }, [profile]);

  const togglePlatform = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform],
    );
  };

  const selectAvatar = (url: string) => {
    setAvatarUrl(url);
    setShowAvatarPicker(false);
  };

  const restoreGooglePhoto = () => {
    const googleUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
    if (googleUrl) {
      setAvatarUrl(googleUrl);
      setShowAvatarPicker(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanedGamertags = Object.fromEntries(
      Object.entries(gamertags).filter(([, v]) => v.trim())
        .map(([k, v]) => [k, v.trim()])
    );

    const result = await onSave({
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      platforms,
      avatar_url: avatarUrl || null,
      gamertags: Object.keys(cleanedGamertags).length > 0 ? cleanedGamertags : null,
    } as Partial<Profile>);

    setLoading(false);

    if (result.success) {
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    } else {
      setError(result.error || 'Failed to update profile');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="fixed inset-0 bg-black/80" />
        <div className="relative bg-bg-card border border-border rounded-sm max-w-lg w-full my-6">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-primary">Edit Profile</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-all duration-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-danger/10 border border-danger text-danger rounded-sm p-3 text-sm">
              {error}
            </div>
          )}

          {/* Avatar Section */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-bg-elevated flex-shrink-0 ring-2 ring-border">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-bold text-text-muted bg-accent-green/20">
                    {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="px-3 py-1.5 bg-bg-elevated hover:bg-border text-text-secondary text-xs font-medium rounded-sm transition-all duration-300"
                >
                  {showAvatarPicker ? 'Close Picker' : 'Choose Avatar'}
                </button>
                {hasGooglePhoto && avatarUrl?.includes('dicebear.com') && (
                  <button
                    type="button"
                    onClick={restoreGooglePhoto}
                    className="px-3 py-1.5 bg-bg-elevated hover:bg-border text-text-secondary text-xs rounded-sm transition-all duration-300"
                  >
                    Restore Google Photo
                  </button>
                )}
              </div>
            </div>

            {/* Avatar Picker */}
            {showAvatarPicker && (
              <div className="mt-3 p-4 bg-bg-elevated/50 border border-border rounded-sm">
                {/* Style selector */}
                <div className="flex gap-2 mb-3">
                  {AVATAR_STYLES.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setSelectedStyle(style)}
                      className={`px-2.5 py-1 text-xs rounded-sm transition-all ${
                        selectedStyle === style
                          ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                          : 'bg-bg-card text-text-muted border border-border hover:border-border-light'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>

                {/* Color selector */}
                <div className="flex gap-2 mb-3">
                  {AVATAR_BG_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedBg(color)}
                      className={`w-6 h-6 rounded-full transition-all ${selectedBg === color ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-card scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: `#${color}` }}
                    />
                  ))}
                </div>

                {/* Avatar grid */}
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_SEEDS.map((seed) => {
                    const url = buildAvatarUrl(selectedStyle, seed, selectedBg);
                    const isSelected = avatarUrl === url;
                    return (
                      <button
                        key={seed}
                        type="button"
                        onClick={() => selectAvatar(url)}
                        className={`relative w-full aspect-square rounded-sm overflow-hidden border-2 transition-all ${
                          isSelected ? 'border-accent-green scale-105' : 'border-border hover:border-border-light hover:scale-105'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={seed} className="w-full h-full" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-accent-green/20 flex items-center justify-center">
                            <Check size={16} className="text-accent-green" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green transition-all duration-300"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green min-h-24 transition-all duration-300"
              maxLength={200}
              placeholder="Tell us about your gaming interests..."
            />
            <p className="text-xs text-text-muted mt-1 text-right">{bio.length}/200</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Gaming Platforms</label>
            <div className="grid grid-cols-2 gap-3">
              {platformOptions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={`flex items-center gap-2 p-3 rounded-sm border-2 text-sm transition-all ${
                    platforms.includes(p.id)
                      ? 'border-accent-green bg-accent-green/10 text-text-primary'
                      : 'border-border text-text-secondary hover:border-border-light'
                  }`}
                >
                  {p.icon}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Gamertags</label>
            <p className="text-xs text-text-muted mb-3">Share your tags so other players can find you</p>
            <div className="space-y-3">
              {gamertag_fields.map((f) => (
                <div key={f.key} className="flex items-center gap-3">
                  <span className="text-xs text-text-muted w-16 flex-shrink-0 text-right">{f.label.split(' ')[0]}</span>
                  <input
                    type="text"
                    value={gamertags[f.key] || ''}
                    onChange={(e) => setGamertags(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="flex-1 px-3 py-2 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green transition-all duration-300"
                    maxLength={50}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-bg-elevated hover:bg-border text-text-secondary font-semibold rounded-sm transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || saved}
              className={`flex-1 py-3 rounded-sm font-semibold transition-all duration-300 ${saved ? 'bg-accent-green text-black' : 'bg-accent-green hover:bg-accent-green-hover disabled:opacity-50 text-black'}`}
            >
              {saved ? '✓ Saved!' : loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
