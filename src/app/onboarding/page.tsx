'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Gamepad2, Monitor, Smartphone, Search, X, AtSign, AlertCircle } from 'lucide-react';

const platformOptions = [
  { id: 'PC', label: 'PC', icon: <Monitor size={20} /> },
  { id: 'PlayStation 5', label: 'PlayStation 5', icon: <Gamepad2 size={20} /> },
  { id: 'PlayStation 4', label: 'PlayStation 4', icon: <Gamepad2 size={20} /> },
  { id: 'Xbox Series X|S', label: 'Xbox Series X|S', icon: <Gamepad2 size={20} /> },
  { id: 'Xbox One', label: 'Xbox One', icon: <Gamepad2 size={20} /> },
  { id: 'Nintendo Switch', label: 'Nintendo Switch', icon: <Gamepad2 size={20} /> },
  { id: 'Steam Deck', label: 'Steam Deck', icon: <Gamepad2 size={20} /> },
  { id: 'Mobile', label: 'Mobile', icon: <Smartphone size={20} /> },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [favoriteGames, setFavoriteGames] = useState<{ id: number; name: string; cover_url: string | null }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Load the current (auto-generated) username
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('username').eq('id', user.id).single().then(({ data }) => {
      if (data?.username) {
        setCurrentUsername(data.username);
        setUsername(data.username);
      }
    });
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Validate username with debounce
  useEffect(() => {
    if (!username || username === currentUsername) {
      setUsernameError('');
      return;
    }
    if (username.length < 3) {
      setUsernameError('Must be at least 3 characters');
      return;
    }
    if (username.length > 20) {
      setUsernameError('Must be 20 characters or fewer');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Only letters, numbers, and underscores');
      return;
    }

    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      if (data && data.id !== user?.id) {
        setUsernameError('Username is already taken');
      } else {
        setUsernameError('');
      }
      setCheckingUsername(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [username, currentUsername, user?.id]);

  const togglePlatform = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform],
    );
  };

  const searchGames = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); return; }
    try {
      const { data } = await supabase
        .from('games')
        .select('id, name, slug, cover_url, release_year')
        .ilike('name', `%${query}%`)
        .limit(8);
      setSearchResults(data || []);
    } catch { setSearchResults([]); }
  };

  const addFavorite = (game: any) => {
    if (favoriteGames.find(g => g.id === game.id) || favoriteGames.length >= 10) return;
    setFavoriteGames([...favoriteGames, { id: game.id, name: game.name, cover_url: game.cover_url }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleUsernameNext = async () => {
    if (!user || usernameError || checkingUsername) return;
    if (username !== currentUsername) {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ username, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      setLoading(false);
      if (error) {
        setUsernameError('Failed to save username. Try another.');
        return;
      }
    }
    setStep(2);
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const updates: Record<string, unknown> = {
        platforms,
        bio: bio.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (favoriteGames.length > 0) {
        updates.mount_rushmore_games = favoriteGames.slice(0, 4).map(g => g.id.toString());
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      if (error) throw error;

      router.push('/discover/taste-quiz');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  const totalSteps = 4;
  const usernameValid = username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username) && !usernameError && !checkingUsername;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 -mt-14">
      <div className="max-w-2xl w-full bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm p-8">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-none transition-colors ${
                i + 1 <= step ? 'bg-accent-green' : 'bg-bg-elevated'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Choose username */}
        {step === 1 && (
          <>
            <h2 className="text-3xl font-bold font-[family-name:var(--font-display)] mb-2 text-text-primary">Choose your username</h2>
            <p className="text-text-muted mb-6">This is your permanent identity on Jeggy. Choose wisely!</p>

            <div className="relative mb-2">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <AtSign size={16} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className={`w-full pl-10 pr-4 py-3 bg-bg-card/80 backdrop-blur-xl border rounded-sm text-text-primary placeholder-text-muted focus:outline-none transition-all duration-300 ${
                  usernameError ? 'border-danger focus:border-danger' : 'border-border focus:border-accent-green'
                }`}
                placeholder="nightowlgamer"
                maxLength={20}
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between mb-6 min-h-[24px]">
              {usernameError ? (
                <span className="text-xs text-danger flex items-center gap-1">
                  <AlertCircle size={12} /> {usernameError}
                </span>
              ) : checkingUsername ? (
                <span className="text-xs text-text-muted">Checking availability...</span>
              ) : username.length >= 3 && !usernameError ? (
                <span className="text-xs text-accent-green">✓ Available</span>
              ) : (
                <span className="text-xs text-text-muted">3 to 20 characters, letters, numbers, underscores</span>
              )}
              <span className="text-xs text-text-muted">{username.length}/20</span>
            </div>

            <p className="text-xs text-text-muted/70 mb-6">
              Your username cannot be changed later. Your display name can be updated anytime from settings.
            </p>

            <button
              onClick={handleUsernameNext}
              disabled={!usernameValid || loading}
              className="w-full py-3 bg-accent-green hover:bg-accent-green-hover disabled:opacity-50 text-black font-bold rounded-sm transition-all duration-300"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </>
        )}

        {/* Step 2: Platforms */}
        {step === 2 && (
          <>
            <h2 className="text-3xl font-bold font-[family-name:var(--font-display)] mb-2 text-text-primary">What platforms do you game on?</h2>
            <p className="text-text-muted mb-8">Select all that apply</p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {platformOptions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={`flex items-center gap-3 p-4 rounded-sm border-2 transition-all ${
                    platforms.includes(p.id)
                      ? 'border-accent-green bg-accent-green/10 text-text-primary'
                      : 'border-border text-text-secondary hover:border-border-light'
                  }`}
                >
                  {p.icon}
                  <span className="font-semibold text-sm">{p.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-bg-elevated hover:bg-border text-text-secondary font-bold rounded-sm transition-all duration-300"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={platforms.length === 0}
                className="flex-1 py-3 bg-accent-green hover:bg-accent-green-hover disabled:opacity-50 text-black font-bold rounded-sm transition-all duration-300"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 3: Bio */}
        {step === 3 && (
          <>
            <h2 className="text-3xl font-bold font-[family-name:var(--font-display)] mb-2 text-text-primary">Tell us about yourself</h2>
            <p className="text-text-muted mb-8">Optional, helps others get to know you</p>

            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Souls-like enthusiast and indie explorer. Always looking for the next hidden gem..."
              className="w-full px-4 py-3 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-green min-h-32 mb-2 transition-all duration-300"
              maxLength={200}
            />
            <p className="text-xs text-text-muted mb-8 text-right">{bio.length}/200</p>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-bg-elevated hover:bg-border text-text-secondary font-bold rounded-sm transition-all duration-300"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-3 bg-accent-green hover:bg-accent-green-hover text-black font-bold rounded-sm transition-all duration-300"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 4: Favorite games */}
        {step === 4 && (
          <>
            <h2 className="text-3xl font-bold font-[family-name:var(--font-display)] mb-2 text-text-primary">What are your favorite games?</h2>
            <p className="text-text-muted mb-6">Add up to 10 games to help us understand your taste (optional)</p>

            {/* Search */}
            <div className="relative mb-6">
              <div className="flex items-center gap-2 px-4 py-3 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm focus-within:border-accent-green transition-all duration-300">
                <Search size={16} className="text-text-muted flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => searchGames(e.target.value)}
                  placeholder="Search for games..."
                  className="flex-1 bg-transparent text-text-primary placeholder-text-muted outline-none text-sm"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm max-h-60 overflow-y-auto z-10">
                  {searchResults.map(game => (
                    <button
                      key={game.id}
                      onClick={() => addFavorite(game)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-bg-elevated transition-all duration-300 text-left"
                    >
                      <div className="w-10 h-14 rounded overflow-hidden bg-bg-elevated flex-shrink-0">
                        {game.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={game.cover_url} alt={game.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-text-muted">?</div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-primary">{game.name}</div>
                        <div className="text-xs text-text-muted">{game.release_year || ''}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected */}
            {favoriteGames.length > 0 && (
              <div className="grid grid-cols-5 gap-3 mb-6">
                {favoriteGames.map(game => (
                  <div key={game.id} className="relative group">
                    <div className="aspect-[3/4] rounded-sm overflow-hidden bg-bg-elevated">
                      {game.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={game.cover_url} alt={game.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">?</div>
                      )}
                    </div>
                    <button
                      onClick={() => setFavoriteGames(favoriteGames.filter(g => g.id !== game.id))}
                      className="absolute top-1 right-1 w-5 h-5 bg-danger rounded-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} className="text-white" />
                    </button>
                    <p className="text-[10px] text-text-muted mt-1 truncate">{game.name}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 bg-bg-elevated hover:bg-border text-text-secondary font-bold rounded-sm transition-all duration-300"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 py-3 bg-accent-green hover:bg-accent-green-hover disabled:opacity-50 text-black font-bold rounded-sm transition-all duration-300"
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
