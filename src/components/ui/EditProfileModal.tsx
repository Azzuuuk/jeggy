'use client';

import { useState, useEffect } from 'react';
import { Profile } from '@/hooks/useProfile';
import { X, Monitor, Gamepad2, Smartphone } from 'lucide-react';

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

export default function EditProfileModal({ profile, isOpen, onClose, onSave }: EditProfileModalProps) {
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
  const [error, setError] = useState('');

  // Sync state when profile changes
  useEffect(() => {
    setDisplayName(profile.display_name || profile.username);
    setBio(profile.bio || '');
    setPlatforms(profile.platforms || []);
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
      gamertags: Object.keys(cleanedGamertags).length > 0 ? cleanedGamertags : null,
    } as Partial<Profile>);

    setLoading(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Failed to update profile');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card/90 backdrop-blur-xl border border-border rounded-sm max-w-lg w-full max-h-[90vh] overflow-y-auto">
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
              disabled={loading}
              className="flex-1 py-3 bg-accent-green hover:bg-accent-green-hover disabled:opacity-50 text-black font-semibold rounded-sm transition-all duration-300"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
