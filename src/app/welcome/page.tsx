'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';
import { games } from '@/lib/mockData';

const PLATFORMS = ['PC', 'PlayStation 5', 'Xbox Series X', 'Switch', 'Mobile'] as const;

const topGames = [...games]
  .sort((a, b) => b.totalRatings - a.totalRatings)
  .slice(0, 12);

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              s <= step ? 'bg-accent-green' : 'bg-border'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-text-muted">Step {step} of 5</span>
    </div>
  );
}

function StarRating({
  rating,
  onRate,
}: {
  rating: number;
  onRate: (r: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate(star)}
          className={`text-sm transition-colors ${
            star <= rating ? 'text-accent-orange' : 'text-text-muted'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function WelcomePage() {
  const [step, setStep] = useState(1);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [profile, setProfile] = useState({
    displayName: '',
    username: '',
    bio: '',
  });

  const ratedCount = Object.keys(ratings).length;

  function togglePlatform(platform: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  }

  function rateGame(gameId: string, star: number) {
    setRatings((prev) => ({ ...prev, [gameId]: star }));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <StepIndicator step={step} />

      {step > 1 && (
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          className="mt-4 text-text-muted hover:text-text-secondary transition-colors text-sm"
        >
          ← Back
        </button>
      )}

      {/* Step 1: Welcome */}
      {step === 1 && (
        <div className="flex flex-col items-center justify-center text-center min-h-[80vh]">
          <Gamepad2 size={56} className="text-accent-green mb-6" />
          <h1 className="text-4xl font-bold font-[family-name:var(--font-display)] tracking-tight text-text-primary mb-4">
            Welcome to Jeggy
          </h1>
          <p className="text-lg text-text-secondary max-w-md mx-auto mb-8">
            The social platform for gamers. Track every game you play. Rate and
            review. Find your next favorite.
          </p>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="bg-accent-green text-black px-8 py-3 rounded-sm font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Get Started →
          </button>
        </div>
      )}

      {/* Step 2: Platforms */}
      {step === 2 && (
        <div className="flex flex-col items-center justify-center text-center min-h-[80vh]">
          <h2 className="text-3xl font-bold font-[family-name:var(--font-display)] tracking-tight text-text-primary mb-2">
            What platforms do you game on?
          </h2>
          <p className="text-text-secondary mb-8">Select all that apply</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full mb-8">
            {PLATFORMS.map((platform) => {
              const selected = selectedPlatforms.includes(platform);
              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => togglePlatform(platform)}
                  className={`rounded-sm px-6 py-4 border transition-all duration-300 font-medium ${
                    selected
                      ? 'border-accent-green bg-accent-green/10 text-text-primary'
                      : 'bg-bg-card border-border text-text-secondary hover:border-text-muted'
                  }`}
                >
                  {platform}
                </button>
              );
            })}
          </div>
          <div className="flex gap-4">
            {selectedPlatforms.length > 0 ? (
              <button
                type="button"
                onClick={() => setStep(3)}
                className="bg-accent-green text-black px-8 py-3 rounded-sm font-semibold text-lg hover:opacity-90 transition-opacity"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-text-muted hover:text-text-secondary transition-colors text-sm"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Rate Some Games */}
      {step === 3 && (
        <div className="flex flex-col items-center justify-center text-center min-h-[80vh]">
          <h2 className="text-3xl font-bold font-[family-name:var(--font-display)] tracking-tight text-text-primary mb-2">
            Rate a few games to get started
          </h2>
          <p className="text-text-secondary mb-8">
            This helps us personalize your experience
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 w-full mb-8">
            {topGames.map((game) => (
              <div key={game.id} className="flex flex-col items-center gap-1">
                <div className="relative w-full aspect-[2/3] rounded-sm overflow-hidden bg-bg-elevated">
                  <Image
                    src={game.coverImage}
                    alt={game.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-xs text-text-primary truncate w-full">
                  {game.title}
                </span>
                <StarRating
                  rating={ratings[game.id] || 0}
                  onRate={(r) => rateGame(game.id, r)}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted">
              {ratedCount} of 5 rated
            </span>
            {ratedCount >= 5 ? (
              <button
                type="button"
                onClick={() => setStep(4)}
                className="bg-accent-green text-black px-8 py-3 rounded-sm font-semibold text-lg hover:opacity-90 transition-opacity"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(4)}
                className="text-text-muted hover:text-text-secondary transition-colors text-sm"
              >
                Skip for now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Profile Setup */}
      {step === 4 && (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <h2 className="text-3xl font-bold font-[family-name:var(--font-display)] tracking-tight text-text-primary mb-8 text-center">
            Set up your profile
          </h2>
          <div className="flex flex-col gap-4 w-full max-w-md">
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Display name
              </label>
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) =>
                  setProfile({ ...profile, displayName: e.target.value })
                }
                className="w-full bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green"
                placeholder="Your display name"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Username
              </label>
              <input
                type="text"
                value={profile.username}
                onChange={(e) =>
                  setProfile({ ...profile, username: e.target.value })
                }
                className="w-full bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green"
                placeholder="your_username"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Bio (optional)
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
                rows={3}
                className="w-full bg-bg-card/80 backdrop-blur-xl border border-border rounded-sm px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>
            <button
              type="button"
              onClick={() => setStep(5)}
              className="bg-accent-green text-black px-8 py-3 rounded-sm font-semibold text-lg hover:opacity-90 transition-opacity mt-4"
            >
              Create Profile →
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Done */}
      {step === 5 && (
        <div className="flex flex-col items-center justify-center text-center min-h-[80vh]">
          <span className="text-6xl mb-6 animate-bounce">🎉</span>
          <h2 className="text-4xl font-bold font-[family-name:var(--font-display)] tracking-tight text-text-primary mb-4">
            You&apos;re all set!
          </h2>
          <p className="text-lg text-text-secondary max-w-md mx-auto mb-8">
            Start exploring games, create lists, and connect with other gamers.
          </p>
          <Link
            href="/"
            className="bg-accent-green text-black px-8 py-3 rounded-sm font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Explore Jeggy →
          </Link>
        </div>
      )}
    </div>
  );
}
