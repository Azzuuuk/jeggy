'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SupabaseGame } from '@/lib/types';
import { ChevronDown, Clipboard, Heart, Users } from 'lucide-react';

const heroImages = [
  'https://images.igdb.com/igdb/image/upload/t_1080p/co4jni.jpg', // Elden Ring
  'https://images.igdb.com/igdb/image/upload/t_1080p/co5vmg.jpg', // Zelda TOTK
  'https://images.igdb.com/igdb/image/upload/t_1080p/co670h.jpg', // Baldur's Gate 3
  'https://images.igdb.com/igdb/image/upload/t_1080p/co1tmu.jpg', // God of War Ragnarok
];

export default function LandingPage() {
  const [heroIdx, setHeroIdx] = useState(0);
  const [newReleases, setNewReleases] = useState<SupabaseGame[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setHeroIdx(i => (i + 1) % heroImages.length), 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchNewReleases = async () => {
      const { data } = await supabase
        .from('games')
        .select('id, name, slug, cover_url, average_rating, release_year')
        .not('release_year', 'is', null)
        .order('first_release_date', { ascending: false, nullsFirst: false })
        .limit(10);
      if (data) setNewReleases(data as SupabaseGame[]);
    };
    fetchNewReleases();
  }, []);

  return (
    <div className="min-h-screen -mt-16">
      {/* HERO — full viewport */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background images with crossfade */}
        {heroImages.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-1000 bg-cover bg-center"
            style={{
              backgroundImage: `url(${src})`,
              opacity: i === heroIdx ? 1 : 0,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-[#0e1217]" />

        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight text-white">
            Discover Your Next<br />Favorite Game
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Track, rate, and share the games you play.<br />
            Join thousands of gamers sharing their taste.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/welcome"
              className="px-8 py-4 bg-accent-green hover:bg-accent-green-hover text-black font-bold text-lg rounded-lg transition-colors"
            >
              Get Started — It&apos;s Free
            </Link>
            <Link
              href="/games"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold text-lg rounded-lg border border-white/20 transition-colors"
            >
              Browse Games →
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-400">
            The social network for gamers.
          </p>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 animate-bounce"
          aria-label="Scroll down"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </section>

      {/* FEATURED GAMES */}
      <section className="py-16 bg-gradient-to-b from-transparent to-bg-primary">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-xs uppercase tracking-widest text-text-muted mb-8">
            New Releases
          </p>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-row">
            {newReleases.map(game => (
              <Link key={game.id} href={`/games/${game.slug}`} className="flex-shrink-0 w-40 sm:w-48 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={game.cover_url || ''}
                  alt={game.name}
                  className="w-full aspect-[2/3] object-cover rounded-lg shadow-2xl shadow-black/40 group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 bg-bg-primary">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-xs uppercase tracking-widest text-text-muted mb-12">
            Jeggy Lets You...
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Clipboard className="w-6 h-6 text-accent-green" />,
                bg: 'bg-accent-green/10',
                title: 'Track Your Games',
                desc: 'Keep track of every game you&apos;ve played, are playing, or want to play.',
              },
              {
                icon: <Heart className="w-6 h-6 text-accent-orange" />,
                bg: 'bg-accent-orange/10',
                title: 'Rate & Review',
                desc: 'Show love for your favorites with ratings and detailed reviews.',
              },
              {
                icon: <Users className="w-6 h-6 text-blue-500" />,
                bg: 'bg-blue-500/10',
                title: 'Connect & Discover',
                desc: 'Follow gamers with similar taste and discover your next favorite.',
              },
            ].map(f => (
              <div key={f.title} className="bg-bg-card p-8 rounded-lg border border-border">
                <div className={`w-12 h-12 ${f.bg} rounded-lg flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">{f.title}</h3>
                <p className="text-text-secondary">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-gradient-to-t from-black to-bg-primary">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Start building your<br />gaming profile today
          </h2>
          <Link
            href="/welcome"
            className="inline-block px-10 py-5 bg-accent-green hover:bg-accent-green-hover text-black font-bold text-xl rounded-lg transition-colors"
          >
            Get Started — It&apos;s Free
          </Link>
          <p className="mt-4 text-text-muted">No credit card required</p>
        </div>
      </section>
    </div>
  );
}
