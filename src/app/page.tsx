'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  ArrowRight, ChevronDown, Star, Flame, Users, Gamepad2,
  Heart, MessageCircle, Trophy, Swords, Monitor, Calendar,
  Globe, Check, Play, Zap, Tv, Camera, Dice5
} from 'lucide-react';

interface GameCover {
  id: number;
  name: string;
  cover_url: string;
  slug: string;
  average_rating: number;
}

/* Animation variants (premium cubic-bezier) */
const ease = [0.4, 0, 0.2, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease } },
};
const slideLeft = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease } },
};
const slideRight = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const viewportOnce = { once: true, margin: '-80px' as const };

/* Animated counter */
function CountUp({ end, duration = 2, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const startTime = performance.now();
        const step = (now: number) => {
          const progress = Math.min((now - startTime) / (duration * 1000), 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * end));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* Floating particle field */
function ParticleField() {
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      dur: 18 + Math.random() * 22,
      delay: Math.random() * -30,
      color: ['#CCFF00', '#6366F1', '#FF9F7C', '#CCFF00', '#6366F1'][i % 5],
    })),
  []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full landing-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/* Atmospheric fog */
function AtmosphericFog({ variant = 'default' }: { variant?: 'default' | 'indigo' | 'warm' }) {
  const configs = {
    default: [
      { color: 'bg-acid/[0.04]', pos: 'top-[-20%] left-[-10%]', size: 'w-[600px] h-[600px]', anim: 'landing-fog-drift' },
      { color: 'bg-indigo/[0.05]', pos: 'top-[30%] right-[-5%]', size: 'w-[500px] h-[500px]', anim: 'landing-fog-drift-reverse' },
    ],
    indigo: [
      { color: 'bg-indigo/[0.06]', pos: 'top-[-10%] right-[10%]', size: 'w-[500px] h-[500px]', anim: 'landing-fog-drift' },
      { color: 'bg-peach/[0.04]', pos: 'bottom-[-10%] left-[20%]', size: 'w-[450px] h-[450px]', anim: 'landing-fog-drift-reverse' },
    ],
    warm: [
      { color: 'bg-peach/[0.05]', pos: 'top-[-15%] left-[20%]', size: 'w-[500px] h-[500px]', anim: 'landing-fog-drift' },
      { color: 'bg-rose/[0.03]', pos: 'bottom-[10%] right-[-5%]', size: 'w-[400px] h-[400px]', anim: 'landing-fog-drift-slow' },
    ],
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {configs[variant].map((blob, i) => (
        <div key={i} className={`absolute ${blob.pos} ${blob.size} ${blob.color} rounded-full blur-[140px] ${blob.anim}`} />
      ))}
    </div>
  );
}

/* Connective grid lines (blueprint) */
function ConnectiveGrid() {
  return (
    <div className="absolute inset-0 connective-grid pointer-events-none" aria-hidden="true" />
  );
}

/* ================================================================
   ROOT
   ================================================================ */
export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [games, setGames] = useState<GameCover[]>([]);

  useEffect(() => {
    if (!loading && user) router.push('/home');
  }, [user, loading, router]);

  useEffect(() => {
    supabase
      .from('games')
      .select('id, name, cover_url, slug, average_rating')
      .not('cover_url', 'is', null)
      .gt('igdb_rating_count', 0)
      .order('igdb_rating_count', { ascending: false })
      .limit(30)
      .then(({ data }) => { if (data) setGames(data); });
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-8 h-8 border-2 border-acid border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (user) return null;

  return (
    <div className="min-h-screen -mt-14 overflow-hidden bg-surface landing-noise relative">
      {/* Subtle ambient color washes to break up flat black */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-indigo/[0.03] to-transparent" />
        <div className="absolute top-[40%] right-0 w-[60%] h-[40vh] bg-gradient-to-l from-acid/[0.02] to-transparent" />
        <div className="absolute top-[70%] left-0 w-[50%] h-[30vh] bg-gradient-to-r from-rose/[0.02] to-transparent" />
      </div>
      <ConnectiveGrid />
      <div className="relative z-10">
        <HeroSection games={games} />
        <StatsSection games={games} />
        <EcosystemStrip />
        <FeaturesSection games={games} />
        <ContentSection games={games} />
        <CommunitySection games={games} />
        <EventsSection />
        <CTASection games={games} />
      </div>
    </div>
  );
}

/* ================================================================
   HERO
   ================================================================ */
function HeroSection({ games }: { games: GameCover[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const blobY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);

  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const handleMove = useCallback((e: React.MouseEvent) => {
    setMouse({
      x: (e.clientX / window.innerWidth - 0.5) * 20,
      y: (e.clientY / window.innerHeight - 0.5) * 14,
    });
  }, []);

  // Use local poster images for hero background
  const HERO_POSTERS = [
    '/battleposter.jpg',
    '/creedposter.jpg',
    '/cyberposter.jpg',
    '/eldenposter.webp',
    '/strandposter.jpg',
    '/terrariaposter.jpg',
    '/zeldaposter.jpg',
    '/baldurposter.jpg',
    '/marioposter.jpg',
    '/nbaposter.png',
    '/warposter.jpg',
    '/fantasyposter.jpg',
  ];

  const columns = useMemo(() => {
    // Seeded shuffle to keep it stable across renders but unique per column
    const shuffle = (arr: string[], seed: number) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        seed = (seed * 16807 + 0) % 2147483647;
        const j = seed % (i + 1);
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    // 6 columns, each gets all 12 posters in a different shuffled order
    return Array.from({ length: 6 }, (_, ci) => shuffle(HERO_POSTERS, ci * 7 + 13));
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center overflow-hidden"
      onMouseMove={handleMove}
    >
      {/* Parallax gradient blob */}
      <motion.div
        className="absolute top-1/4 left-1/3 w-[700px] h-[700px] rounded-full blur-[200px] pointer-events-none"
        style={{
          y: blobY,
          background: 'radial-gradient(circle, rgba(204,255,0,0.08) 0%, rgba(99,102,241,0.06) 50%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <AtmosphericFog />
      <ParticleField />

      {/* Cover collage background */}
      {columns.length > 0 && (
        <div
          className="absolute inset-[-30%] pointer-events-none"
          aria-hidden="true"
          style={{
            transform: `translate(${mouse.x}px, ${mouse.y}px) rotate(-12deg) scale(1.3)`,
            transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div className="flex gap-2 h-full w-full">
            {columns.map((col, ci) => {
              const speed = 22 + ci * 5;
              const dir = ci % 2 === 0 ? 'up' : 'down';
              const quadrupled = [...col, ...col, ...col, ...col];
              return (
                <div
                  key={ci}
                  className="flex-1 flex flex-col gap-2"
                  style={{
                    animation: `landing-scroll-${dir} ${speed}s linear infinite`,
                    willChange: 'transform',
                  }}
                >
                  {quadrupled.map((poster, gi) => (
                    <div key={`${ci}-${gi}`} className="w-full aspect-[3/4] rounded-md overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={poster}
                        alt=""
                        className="w-full h-full object-cover opacity-70 saturate-[1.2]"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overlays — lighter to let covers pop */}
      <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-surface/30" />
      <div className="absolute inset-0 landing-scanlines pointer-events-none opacity-10" />

      {/* Content */}
      <motion.div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full pt-24" style={{ y: contentY }}>
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-acid/10 border border-acid/20 rounded-full text-acid text-xs font-[family-name:var(--font-mono)] tracking-wider mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-acid animate-pulse" />
              MENA&apos;S FIRST GAMING PLATFORM
            </div>
          </motion.div>

          <motion.h1
            className="text-6xl sm:text-7xl md:text-[6.5rem] font-black leading-[0.88] mb-8 font-[family-name:var(--font-display)]"
            style={{ letterSpacing: '-0.05em' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <span className="text-white block">Discover Your</span>
            <span className="relative inline-block glitch-wrapper">
              <span className="glitch-layer text-acid" aria-hidden="true">Gaming DNA.</span>
              <span className="glitch-layer text-acid" aria-hidden="true">Gaming DNA.</span>
              <span className="text-acid relative z-[1]">
                Gaming DNA.
              </span>
            </span>
            <br />
            <span className="text-white">Find Your </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo to-acid">
              Twin.
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-white/40 mb-10 max-w-lg leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            Track games. Rate honestly. Find gamers who think exactly like you.
            Built for people who actually care about games.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8, ease: [0.4, 0, 0.2, 1] }}
          >
            <Link
              href="/signup"
              className="group px-8 py-4 liquid-button text-surface font-bold text-lg rounded-lg"
            >
              <span className="flex items-center justify-center gap-2">
                Start Playing
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Link>
            <Link
              href="/games"
              className="px-8 py-4 border border-line text-white/70 font-semibold text-lg rounded-lg hover:bg-white/[0.03] hover:border-white/10 transition-all duration-500 text-center"
            >
              Browse 10,000+ Games
            </Link>
          </motion.div>
        </div>
      </motion.div>

      <button
        onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/20 hover:text-white/40 transition-colors duration-500"
        aria-label="Scroll down"
      >
        <span className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.2em]">Scroll</span>
        <ChevronDown size={18} className="animate-bounce" />
      </button>
    </section>
  );
}

/* ================================================================
   STATS -- terminal aesthetic with mono numbers
   ================================================================ */
function StatsSection({ games }: { games: GameCover[] }) {
  return (
    <section className="py-16 relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={stagger}
        >
          {/* Stat 1: Game Database */}
          <motion.div className="group" variants={fadeUp}>
            <div className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.2em] text-white/20 mb-3">Games Indexed</div>
            <div className="text-5xl md:text-6xl font-black font-[family-name:var(--font-mono)] text-white mb-3 tabular-nums">
              <CountUp end={10000} suffix="+" />
            </div>
            <div className="text-white/30 mb-4 text-sm">Indie & AAA titles</div>
            <div className="flex -space-x-2">
              {games.slice(0, 5).map((g, i) => (
                <div
                  key={g.id}
                  className="w-10 h-14 rounded border border-line overflow-hidden group-hover:-translate-y-1 transition-transform duration-500 flex-shrink-0"
                  style={{ zIndex: 5 - i, transitionDelay: `${i * 50}ms`, transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.cover_url.replace('t_cover_big', 't_thumb')} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
              <div className="w-10 h-14 rounded border border-line bg-surface-raised flex items-center justify-center text-[9px] text-white/20 font-[family-name:var(--font-mono)] flex-shrink-0">
                +9.9K
              </div>
            </div>
          </motion.div>

          {/* Stat 2: Active Community */}
          <motion.div className="group" variants={fadeUp}>
            <div className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.2em] text-white/20 mb-3">Active Players</div>
            <div className="text-5xl md:text-6xl font-black font-[family-name:var(--font-mono)] text-acid mb-3 tabular-nums">
              <CountUp end={2547} />
            </div>
            <div className="text-white/30 mb-4 text-sm">Community members</div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['A', 'S', 'O', 'L', 'K'].map((letter, i) => (
                  <div
                    key={letter}
                    className={`w-8 h-8 rounded-full border border-line flex items-center justify-center text-xs font-bold text-white flex-shrink-0 bg-gradient-to-br ${
                      ['from-indigo to-acid/50', 'from-acid/60 to-indigo/60', 'from-peach to-rose', 'from-indigo to-peach', 'from-acid/50 to-indigo'][i]
                    }`}
                    style={{ zIndex: 5 - i }}
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-acid text-xs">
                <div className="w-1.5 h-1.5 bg-acid rounded-full animate-pulse" />
                <span className="font-[family-name:var(--font-mono)]">234 online</span>
              </div>
            </div>
          </motion.div>

          {/* Stat 3: Ratings */}
          <motion.div className="group" variants={fadeUp}>
            <div className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.2em] text-white/20 mb-3">Community Ratings</div>
            <div className="text-5xl md:text-6xl font-black font-[family-name:var(--font-mono)] text-indigo mb-3 tabular-nums">
              <CountUp end={15234} />
            </div>
            <div className="text-white/30 mb-4 text-sm">Honest scores logged</div>
            <div className="space-y-1.5">
              {[
                { stars: 10, pct: 24, color: 'from-acid to-acid/40' },
                { stars: 8, pct: 38, color: 'from-indigo to-indigo/40' },
                { stars: 6, pct: 22, color: 'from-peach to-peach/40' },
                { stars: 4, pct: 12, color: 'from-rose to-rose/40' },
                { stars: 2, pct: 4, color: 'from-white/20 to-white/5' },
              ].map(r => (
                <div key={r.stars} className="flex items-center gap-2">
                  <span className="text-[10px] text-white/20 font-[family-name:var(--font-mono)] w-4 text-right">{r.stars}</span>
                  <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${r.color} rounded-full terminal-bar`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${r.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    />
                  </div>
                  <span className="text-[10px] text-white/20 font-[family-name:var(--font-mono)] w-7 text-right">{r.pct}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
    </section>
  );
}

/* ================================================================
   BLYZA ECOSYSTEM STRIP
   ================================================================ */
function EcosystemStrip() {
  return (
    <motion.section
      className="py-5 border-b border-line"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={viewportOnce}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Gamepad2 size={24} className="text-acid" />
            <div>
              <div className="text-[9px] font-[family-name:var(--font-mono)] uppercase tracking-[0.2em] text-white/20">Part of</div>
              <div className="font-bold text-white text-sm font-[family-name:var(--font-display)]">Blyza Entertainment</div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-500">
              <div className="w-7 h-7 rounded bg-gradient-to-br from-peach to-rose flex items-center justify-center">
                <Dice5 size={14} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-white">PlayBlyza</div>
                <div className="text-[9px] text-white/20">Party Games</div>
              </div>
            </div>
            <div className="w-px h-6 bg-line" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-500">
              <div className="w-7 h-7 rounded bg-gradient-to-br from-indigo to-indigo/60 flex items-center justify-center">
                <Trophy size={14} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-white">Blyza Live</div>
                <div className="text-[9px] text-acid">Coming Soon</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ================================================================
   FEATURES -- Asymmetric bento with glass-slab cards
   ================================================================ */
function FeaturesSection({ games }: { games: GameCover[] }) {
  return (
    <section className="py-20 sm:py-28 relative">
      <AtmosphericFog />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Heading */}
        <motion.div
          className="mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
        >
          <div className="flex items-end gap-4">
            <h2 className="text-4xl md:text-5xl font-black text-white leading-none font-[family-name:var(--font-display)]" style={{ letterSpacing: '-0.03em' }}>What you get</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-line to-transparent mb-2" />
          </div>
          <p className="text-white/30 text-base mt-3 max-w-xl">
            Not another game tracker. A platform that understands your taste and connects you with your tribe.
          </p>
        </motion.div>

        {/* Bento grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={stagger}
        >
          {/* Gaming DNA -- 7col, 2row */}
          <motion.div
            className="sm:col-span-2 lg:col-span-7 lg:row-span-2 glass-slab rounded-2xl p-6 sm:p-8 relative overflow-hidden group hover:border-acid/20"
            variants={scaleIn}
          >
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: 'radial-gradient(circle, #CCFF00 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }} />
            <div className="absolute inset-0 bg-gradient-to-br from-acid/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative z-10">
              <div className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.2em] text-acid/50 mb-2">Gaming DNA</div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 font-[family-name:var(--font-display)]" style={{ letterSpacing: '-0.03em' }}>
                Discover your gaming personality
              </h3>
              <p className="text-white/30 text-sm mb-6 max-w-md">
                Based on your ratings, we analyze your taste and tell you what kind of gamer you are.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                {/* Donut chart */}
                <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex-shrink-0">
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      background: 'conic-gradient(#CCFF00 0deg 169deg, #6366F1 169deg 270deg, #FF9F7C 270deg 324deg, #F472B6 324deg 360deg)',
                      mask: 'radial-gradient(circle, transparent 62%, black 64%)',
                      WebkitMask: 'radial-gradient(circle, transparent 62%, black 64%)',
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[8px] font-[family-name:var(--font-mono)] text-white/20 uppercase tracking-wider">You Are</span>
                    <span className="text-base sm:text-lg font-black text-white mt-0.5 font-[family-name:var(--font-display)] tracking-tight">THE SPECIALIST</span>
                  </div>
                </div>

                {/* Genre breakdown */}
                <div className="flex-1 w-full space-y-3">
                  {[
                    { name: 'Souls-like', pct: 47, dot: 'bg-acid', bar: 'from-acid to-acid/30' },
                    { name: 'RPG', pct: 28, dot: 'bg-indigo', bar: 'from-indigo to-indigo/30' },
                    { name: 'Roguelike', pct: 15, dot: 'bg-peach', bar: 'from-peach to-peach/30' },
                    { name: 'Platformer', pct: 10, dot: 'bg-rose', bar: 'from-rose to-rose/30' },
                  ].map(g => (
                    <div key={g.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${g.dot}`} />
                          <span className="text-sm text-white/40">{g.name}</span>
                        </div>
                        <span className="text-sm font-bold text-white/60 font-[family-name:var(--font-mono)]">{g.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full bg-gradient-to-r ${g.bar} rounded-full`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${g.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-acid/[0.03] blur-3xl" />
          </motion.div>

          {/* Gaming Twin -- 5col */}
          <motion.div
            className="sm:col-span-2 lg:col-span-5 glass-slab rounded-2xl p-6 relative overflow-hidden group hover:border-indigo/20"
            variants={slideLeft}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10">
              <div className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.2em] text-indigo/60 mb-2">Gaming Twin</div>
              <h3 className="text-lg font-bold text-white mb-1 font-[family-name:var(--font-display)]">Find your gaming twin</h3>
              <p className="text-white/30 text-xs mb-5">Match with gamers who rate games exactly like you</p>

              <div className="flex items-center justify-center gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo to-acid/50 flex items-center justify-center text-lg font-black text-white mx-auto ring-1 ring-indigo/30">A</div>
                  <span className="text-[10px] text-white/20 mt-1 block font-[family-name:var(--font-mono)]">You</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-16 sm:w-20 h-0.5 bg-gradient-to-r from-indigo to-acid rounded-full landing-pulse-glow" />
                  <motion.span
                    className="text-3xl font-black text-indigo mt-2 font-[family-name:var(--font-mono)]"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', delay: 0.4 }}
                  >95%</motion.span>
                  <span className="text-[9px] text-white/15 font-[family-name:var(--font-mono)]">MATCH</span>
                </div>
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-acid/60 to-indigo/60 flex items-center justify-center text-lg font-black text-white mx-auto ring-1 ring-acid/20">S</div>
                  <span className="text-[10px] text-white/20 mt-1 block font-[family-name:var(--font-mono)]">Sara K.</span>
                </div>
              </div>
              {games.length > 0 && (
                <div className="flex items-center justify-center gap-1 mt-4">
                  {games.slice(0, 4).map(g => (
                    <div key={g.id} className="w-7 h-9 rounded-sm overflow-hidden border border-line">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.cover_url.replace('t_cover_big', 't_thumb')} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                  <span className="text-[9px] text-white/15 font-[family-name:var(--font-mono)] ml-1.5">+43 shared</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Hot Takes -- 5col */}
          <motion.div
            className="lg:col-span-5 glass-slab rounded-2xl p-5 sm:p-6 relative overflow-hidden group hover:border-peach/20"
            variants={slideLeft}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-peach/[0.06] rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.2em] text-peach/60 mb-2">Hot Takes</div>
              <h3 className="text-lg font-bold text-white mb-1 font-[family-name:var(--font-display)]">Your spicy opinions</h3>
              <p className="text-white/30 text-xs mb-4">See where you disagree with the crowd</p>

              {games.length > 0 && (
                <div className="w-full aspect-[16/9] rounded-lg overflow-hidden mb-3 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={games[2]?.cover_url.replace('t_cover_big', 't_720p') || ''} alt="" className="w-full h-full object-cover opacity-35 scale-110" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-surface-card/70 to-transparent" />
                  <div className="absolute inset-0 flex items-end p-4">
                    <div className="flex items-end justify-between w-full">
                      <motion.div
                        className="text-center"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ type: 'spring', delay: 0.3 }}
                      >
                        <div className="text-3xl font-black text-acid font-[family-name:var(--font-mono)]">9.5</div>
                        <div className="text-[9px] text-white/20 font-[family-name:var(--font-mono)]">YOU</div>
                      </motion.div>
                      <Flame size={20} className="text-peach mb-1 animate-pulse" />
                      <motion.div
                        className="text-center"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ type: 'spring', delay: 0.5 }}
                      >
                        <div className="text-3xl font-black text-white/20 font-[family-name:var(--font-mono)]">6.8</div>
                        <div className="text-[9px] text-white/20 font-[family-name:var(--font-mono)]">CROWD</div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              )}
              <div className="text-center">
                <span className="inline-block px-3 py-1 bg-peach/10 border border-peach/20 rounded-full text-[10px] font-bold text-peach">
                  SPICY TAKE
                </span>
              </div>
            </div>
          </motion.div>

          {/* Tier Lists -- 4col, 2row */}
          <motion.div
            className="lg:col-span-4 lg:row-span-2 glass-slab rounded-2xl p-5 sm:p-6 relative overflow-hidden group hover:border-rose/20"
            variants={fadeUp}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10">
              <div className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.2em] text-rose/50 mb-2">Tier Lists</div>
              <h3 className="text-lg font-bold text-white mb-1 font-[family-name:var(--font-display)]">S/A/B/C/D Rankings</h3>
              <p className="text-white/30 text-xs mb-5">Create and share your definitive game rankings</p>

              <div className="space-y-2">
                {[
                  { tier: 'S', bg: 'bg-gradient-to-r from-rose to-peach', n: 2, start: 0 },
                  { tier: 'A', bg: 'bg-gradient-to-r from-acid to-acid/60', n: 3, start: 2 },
                  { tier: 'B', bg: 'bg-gradient-to-r from-indigo to-indigo/60', n: 3, start: 5 },
                  { tier: 'C', bg: 'bg-gradient-to-r from-peach to-peach/60', n: 2, start: 8 },
                  { tier: 'D', bg: 'bg-gradient-to-r from-white/20 to-white/10', n: 1, start: 10 },
                ].map((row, ri) => (
                  <motion.div
                    key={row.tier}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + ri * 0.08, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <div className={`w-8 h-8 ${row.bg} rounded flex items-center justify-center text-xs font-black text-white flex-shrink-0`}>
                      {row.tier}
                    </div>
                    <div className="flex gap-1 overflow-hidden">
                      {games.slice(row.start, row.start + row.n).map((g, i) => (
                        <div key={`${row.tier}-${i}`} className="w-8 h-11 rounded-sm overflow-hidden flex-shrink-0 border border-line">
                          {g.cover_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={g.cover_url.replace('t_cover_big', 't_thumb')} alt="" className="w-full h-full object-cover" loading="lazy" />
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* User list title preview */}
              <div className="mt-6 pt-5 border-t border-line">
                <div className="text-[9px] font-[family-name:var(--font-mono)] uppercase tracking-[0.2em] text-white/15 mb-2">Featured List</div>
                <div className="text-sm font-bold text-white/70 font-[family-name:var(--font-display)] mb-1">&ldquo;Best Metroidvanias of All Time&rdquo;</div>
                <div className="flex items-center gap-2 text-[10px] text-white/20 font-[family-name:var(--font-mono)]">
                  <span>by Sara K.</span>
                  <span>&middot;</span>
                  <span>24 games</span>
                  <span>&middot;</span>
                  <span className="text-acid">142 saves</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sessions -- 8col */}
          <motion.div
            className="sm:col-span-2 lg:col-span-8 glass-slab rounded-2xl p-5 sm:p-6 relative overflow-hidden group hover:border-indigo/20"
            variants={slideRight}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-indigo/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <div className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.2em] text-indigo/50 mb-2">Sessions</div>
                  <h3 className="text-lg font-bold text-white mb-1 font-[family-name:var(--font-display)]">Track every gaming session</h3>
                  <p className="text-white/30 text-xs mb-4">Log sessions, track hours, maintain your gaming diary</p>
                </div>
                <div className="text-right pl-4">
                  <span className="text-3xl font-black text-indigo font-[family-name:var(--font-mono)]">42h</span>
                  <div className="text-[10px] text-white/20 font-[family-name:var(--font-mono)]">this month</div>
                </div>
              </div>

              <div className="flex items-end gap-2 h-28">
                {[
                  { day: 'Mon', h: 2 }, { day: 'Tue', h: 4 }, { day: 'Wed', h: 1 },
                  { day: 'Thu', h: 6 }, { day: 'Fri', h: 3 }, { day: 'Sat', h: 8 }, { day: 'Sun', h: 5 },
                ].map((d, i) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <motion.div
                      className="w-full bg-gradient-to-t from-indigo to-indigo/20 rounded-t-sm min-h-[2px]"
                      style={{ height: 0 }}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${(d.h / 8) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: 0.3 + i * 0.06, ease: [0.4, 0, 0.2, 1] }}
                    />
                    <span className="text-[9px] text-white/15 font-[family-name:var(--font-mono)]">{d.day.slice(0, 2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Indie Discovery -- 8col */}
          <motion.div
            className="sm:col-span-2 lg:col-span-8 glass-slab rounded-2xl p-5 sm:p-6 relative overflow-hidden group hover:border-acid/20"
            variants={fadeUp}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <div className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.2em] text-acid/50 mb-2">Indie Discovery</div>
                  <h3 className="text-lg font-bold text-white mb-1 font-[family-name:var(--font-display)]">10,000+ indie games</h3>
                </div>
                <span className="text-xs text-acid font-[family-name:var(--font-mono)] px-3 py-1 bg-acid/[0.06] rounded-full border border-acid/10">Explore</span>
              </div>
              <p className="text-white/30 text-xs mb-4">Hidden gems, honest reviews, independent developers</p>

              <div className="flex gap-3 overflow-hidden">
                {(games.length > 0 ? games.slice(0, 8) : []).map((game, i) => (
                  <div key={game.id} className="flex-shrink-0 w-20 sm:w-24 relative group/card">
                    <div className="aspect-[3/4] rounded-lg overflow-hidden bg-white/[0.03] border border-line group-hover/card:border-acid/20 transition-colors duration-500">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={game.cover_url.replace('t_cover_big', 't_cover_small')}
                        alt={game.name}
                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700"
                        style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
                        loading="lazy"
                      />
                    </div>
                    {i % 3 === 0 && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-acid rounded text-[8px] font-bold text-surface">
                        HIDDEN GEM
                      </div>
                    )}
                    {game.average_rating > 0 && (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 rounded-b-lg">
                        <div className="flex items-center gap-0.5 justify-center">
                          <Star size={8} className="text-acid fill-acid" />
                          <span className="text-[10px] font-bold text-white font-[family-name:var(--font-mono)]">{game.average_rating.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* CTA under bento */}
        <motion.div
          className="mt-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 liquid-button text-surface font-bold text-lg rounded-lg"
          >
            Try Everything Free
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ================================================================
   CONTENT -- media showcase
   ================================================================ */
function ContentSection({ games }: { games: GameCover[] }) {
  const videoMockups = [
    { title: 'This Indie Game Will Blow Your Mind', views: '12K', duration: '14:22', isNew: true },
    { title: 'Top 10 Roguelikes You NEED to Play', views: '8.5K', duration: '18:45', isNew: true },
    { title: 'Why Hollow Knight is a Masterpiece', views: '15K', duration: '22:10', isNew: false },
    { title: 'Hades vs Dead Cells - The Ultimate Comparison', views: '9.2K', duration: '11:33', isNew: false },
  ];

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
      <AtmosphericFog variant="warm" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: Description */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={slideRight}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-peach/[0.06] border border-peach/20 rounded-full text-peach text-xs font-[family-name:var(--font-mono)] tracking-wider mb-6">
              <Tv size={14} />
              GAMING MEDIA BRAND
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight font-[family-name:var(--font-display)]" style={{ letterSpacing: '-0.03em' }}>
              Honest reviews.
              <br />
              Real opinions.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-peach to-rose">
                Indie focus.
              </span>
            </h2>

            <p className="text-lg text-white/30 mb-8">
              Daily content across YouTube, TikTok, Instagram, and JESTR.
              Indie game reviews, developer interviews, and authentic coverage for MENA gamers.
            </p>

            <div className="space-y-3 mb-8">
              {[
                { Icon: Play, text: 'In-depth video reviews', color: 'text-red-400', bg: 'bg-red-500/[0.06] border-red-500/15' },
                { Icon: Zap, text: '60-second TikTok takes', color: 'text-rose', bg: 'bg-rose/[0.06] border-rose/15' },
                { Icon: Camera, text: 'Instagram reels & highlights', color: 'text-indigo', bg: 'bg-indigo/[0.06] border-indigo/15' },
                { Icon: Swords, text: 'JESTR paid indie reviews', color: 'text-acid', bg: 'bg-acid/[0.06] border-acid/15' },
              ].map(p => (
                <div key={p.text} className="flex items-center gap-3">
                  <div className={`w-9 h-9 ${p.bg} border rounded-lg flex items-center justify-center ${p.color}`}>
                    <p.Icon size={16} />
                  </div>
                  <span className="text-white/40 text-sm">{p.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { label: 'YouTube', bg: 'bg-red-500/[0.08] border-red-500/20 text-red-400' },
                { label: 'TikTok', bg: 'bg-rose/[0.08] border-rose/20 text-rose' },
                { label: 'Instagram', bg: 'bg-indigo/[0.08] border-indigo/20 text-indigo' },
                { label: 'JESTR', bg: 'bg-acid/[0.08] border-acid/20 text-acid' },
              ].map(s => (
                <span key={s.label} className={`px-3 py-1 ${s.bg} border rounded-full text-xs font-[family-name:var(--font-mono)]`}>{s.label}</span>
              ))}
            </div>
          </motion.div>

          {/* Right: Video thumbnails */}
          <motion.div
            className="space-y-6"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={slideLeft}
          >
            <div className="grid grid-cols-2 gap-3">
              {videoMockups.map((v, i) => (
                <motion.div
                  key={i}
                  className="group cursor-pointer"
                  variants={fadeUp}
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                    {games[i + 10] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={games[i + 10].cover_url.replace('t_cover_big', 't_720p')}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-peach/10 to-rose/10" />
                    )}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                        <Play size={16} className="text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 rounded text-[10px] text-white font-[family-name:var(--font-mono)]">
                      {v.duration}
                    </div>
                    {v.isNew && (
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-acid rounded text-[9px] font-bold text-surface">
                        NEW
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-white line-clamp-2 group-hover:text-acid transition-colors duration-500 leading-tight">
                    {v.title}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/20 mt-0.5 font-[family-name:var(--font-mono)]">
                    <span>{v.views} views</span>
                    <span>{'\u00B7'}</span>
                    <span>2 days ago</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* TikTok reels row */}
            <div className="flex gap-2 overflow-hidden">
              {games.slice(16, 22).map((g) => (
                <div key={g.id} className="flex-shrink-0 w-20 relative group/reel">
                  <div className="aspect-[9/16] rounded-lg overflow-hidden bg-white/[0.03]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.cover_url.replace('t_cover_big', 't_cover_small')} alt="" className="w-full h-full object-cover group-hover/reel:scale-105 transition-transform duration-700" style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }} loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
                      <Heart size={8} className="text-rose" fill="#F472B6" />
                      <span className="text-[9px] text-white font-[family-name:var(--font-mono)]">{(2 + (g.id % 8)).toFixed(1)}K</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-slab rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-black text-peach font-[family-name:var(--font-mono)]">100+</div>
                <div className="text-xs text-white/20">Indie Reviews Published</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-rose font-[family-name:var(--font-mono)]">Daily</div>
                <div className="text-xs text-white/20">New Content</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
    </section>
  );
}

/* ================================================================
   COMMUNITY -- social feed with blurred avatars + timestamps
   ================================================================ */
function CommunitySection({ games }: { games: GameCover[] }) {
  const activities = useMemo(() => {
    const names = ['Ahmed M.', 'Sara K.', 'Omar H.', 'Layla A.', 'Khalid R.', 'Noor B.', 'Youssef T.', 'Fatima Z.', 'Hassan D.', 'Maryam J.'];
    const gradients = [
      'from-indigo to-acid/50', 'from-acid/60 to-indigo/60',
      'from-peach to-rose', 'from-indigo to-peach',
      'from-acid/50 to-indigo',
    ];
    if (games.length === 0) return [];

    return Array.from({ length: 14 }, (_, i) => {
      const game = games[i % games.length];
      const templates = [
        { text: `rated ${game.name}`, detail: `${(7 + (i * 0.3)).toFixed(1)}`, Icon: Star, color: 'text-acid' },
        { text: `is now playing ${game.name}`, detail: '', Icon: Gamepad2, color: 'text-indigo' },
        { text: `added ${game.name} to backlog`, detail: '', Icon: Heart, color: 'text-rose' },
        { text: `reviewed ${game.name}`, detail: '', Icon: MessageCircle, color: 'text-peach' },
      ];
      const t = templates[i % templates.length];
      return {
        id: i,
        name: names[i % names.length],
        initial: names[i % names.length][0],
        gradient: gradients[i % gradients.length],
        ...t,
        time: `${1 + i * 3}m ago`,
      };
    });
  }, [games]);

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      <AtmosphericFog variant="indigo" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          className="flex items-end gap-4 mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
        >
          <h2 className="text-4xl md:text-5xl font-black text-white leading-none font-[family-name:var(--font-display)]" style={{ letterSpacing: '-0.03em' }}>Live community</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-line to-transparent mb-2" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-acid animate-pulse" />
            <span className="text-xs text-acid font-[family-name:var(--font-mono)]">234 online</span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-4">
          {/* Activity feed */}
          <motion.div
            className="md:col-span-3 h-[420px] overflow-hidden relative rounded-2xl glass-slab"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={slideRight}
          >
            <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-surface-card to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-surface-card to-transparent z-10 pointer-events-none" />

            {activities.length > 0 && (
              <div className="landing-activity-scroll px-4 py-8 space-y-1">
                {[...activities, ...activities].map((a, i) => (
                  <div key={`${a.id}-${i}`} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/[0.02] transition-colors duration-500">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${a.gradient} flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ring-1 ring-white/[0.06]`}>
                      {a.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/40 truncate">
                        <span className="font-semibold text-white/70">{a.name}</span>{' '}
                        {a.text}
                        {a.detail && <span className={`font-bold ${a.color} ml-1 font-[family-name:var(--font-mono)]`}>{a.detail}</span>}
                      </p>
                    </div>
                    <span className="text-[10px] text-white/30 font-[family-name:var(--font-mono)] flex-shrink-0 tabular-nums">{a.time}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Stats + CTA */}
          <motion.div
            className="md:col-span-2 flex flex-col gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={slideLeft}
          >
            <div className="glass-slab rounded-2xl p-6 flex-1">
              <div className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.2em] text-white/20 mb-6">Platform Stats</div>
              <div className="space-y-5">
                {[
                  { label: 'Games Tracked', value: '10,247', color: 'text-acid', bar: 'from-acid to-acid/30', pct: 92 },
                  { label: 'Ratings Given', value: '48,392', color: 'text-peach', bar: 'from-peach to-peach/30', pct: 78 },
                  { label: 'Lists Created', value: '2,847', color: 'text-indigo', bar: 'from-indigo to-indigo/30', pct: 54 },
                  { label: 'Reviews Written', value: '12,583', color: 'text-rose', bar: 'from-rose to-rose/30', pct: 65 },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-white/25">{s.label}</span>
                      <span className={`text-lg font-black ${s.color} font-[family-name:var(--font-mono)] tabular-nums`}>{s.value}</span>
                    </div>
                    <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full bg-gradient-to-r ${s.bar} rounded-full terminal-bar`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${s.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-slab rounded-2xl p-6 text-center border-acid/10">
              <h3 className="text-2xl font-black text-white mb-2 font-[family-name:var(--font-display)]">Join the tribe</h3>
              <p className="text-sm text-white/25 mb-4">Find your gaming people</p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 liquid-button text-surface font-bold rounded-lg"
              >
                Sign Up Free
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   EVENTS -- Blyza Live teaser
   ================================================================ */
function EventsSection() {
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo/[0.03] via-transparent to-rose/[0.03]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Visual */}
          <motion.div
            className="relative"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={scaleIn}
          >
            <div className="aspect-video glass-slab rounded-2xl overflow-hidden relative flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 400 250" fill="none">
                <line x1="50" y1="40" x2="120" y2="40" stroke="white" strokeWidth="1" />
                <line x1="50" y1="80" x2="120" y2="80" stroke="white" strokeWidth="1" />
                <line x1="120" y1="40" x2="120" y2="80" stroke="white" strokeWidth="1" />
                <line x1="120" y1="60" x2="200" y2="60" stroke="white" strokeWidth="1" />
                <line x1="50" y1="140" x2="120" y2="140" stroke="white" strokeWidth="1" />
                <line x1="50" y1="180" x2="120" y2="180" stroke="white" strokeWidth="1" />
                <line x1="120" y1="140" x2="120" y2="180" stroke="white" strokeWidth="1" />
                <line x1="120" y1="160" x2="200" y2="160" stroke="white" strokeWidth="1" />
                <line x1="200" y1="60" x2="200" y2="160" stroke="white" strokeWidth="1" />
                <line x1="200" y1="110" x2="280" y2="110" stroke="white" strokeWidth="1" />
                <line x1="300" y1="40" x2="350" y2="40" stroke="white" strokeWidth="1" />
                <line x1="300" y1="80" x2="350" y2="80" stroke="white" strokeWidth="1" />
                <line x1="350" y1="40" x2="350" y2="80" stroke="white" strokeWidth="1" />
                <line x1="300" y1="140" x2="350" y2="140" stroke="white" strokeWidth="1" />
                <line x1="300" y1="180" x2="350" y2="180" stroke="white" strokeWidth="1" />
                <line x1="350" y1="140" x2="350" y2="180" stroke="white" strokeWidth="1" />
              </svg>
              <div className="text-center relative z-10">
                <div className="text-5xl sm:text-7xl font-black text-indigo tracking-tighter font-[family-name:var(--font-display)]" style={{ textShadow: '0 0 40px rgba(99,102,241,0.3)' }}>BLYZA</div>
                <div className="text-3xl sm:text-5xl font-black text-rose -mt-2 font-[family-name:var(--font-display)]" style={{ textShadow: '0 0 40px rgba(244,114,182,0.3)' }}>LIVE</div>
                <div className="mt-4 flex items-center justify-center gap-3 text-sm text-white/20">
                  <span className="flex items-center gap-1"><Trophy size={14} /> Tournaments</span>
                  <span>{'\u00B7'}</span>
                  <span className="flex items-center gap-1"><Users size={14} /> Community</span>
                  <span>{'\u00B7'}</span>
                  <span className="flex items-center gap-1"><Monitor size={14} /> Streamed</span>
                </div>
              </div>
              <div className="absolute top-0 left-1/4 w-48 h-48 bg-indigo/[0.06] rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-rose/[0.06] rounded-full blur-3xl" />
            </div>
            <div className="absolute top-4 right-4 rotate-12 px-4 py-2 bg-acid text-surface font-black text-sm uppercase tracking-wider rounded-sm hover:rotate-0 transition-transform duration-500">
              Coming Soon
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={slideLeft}
          >
            <div className="inline-block px-3 py-1 bg-indigo/[0.08] border border-indigo/20 rounded-full text-indigo text-xs font-[family-name:var(--font-mono)] mb-6">
              Q3 2026
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight font-[family-name:var(--font-display)]" style={{ letterSpacing: '-0.03em' }}>
              Gaming events.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo to-rose">
                Real competition.
              </span>
            </h2>

            <p className="text-lg text-white/30 mb-8">
              Professional tournaments at gaming cafes and venues across UAE and MENA.
              From weekly casuals to annual championships.
            </p>

            <div className="space-y-3 mb-8">
              {[
                { Icon: Calendar, text: 'Weekly cafe tournaments', color: 'text-acid' },
                { Icon: Swords, text: 'Monthly championships with prizes', color: 'text-indigo' },
                { Icon: Globe, text: 'Regional MENA events', color: 'text-rose' },
                { Icon: Monitor, text: 'Professional streaming & content', color: 'text-peach' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3">
                  <item.Icon size={16} className={item.color} />
                  <span className="text-white/40 text-sm">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="glass-slab rounded-xl p-5 border-indigo/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white font-[family-name:var(--font-display)]">Want early access?</h3>
                <div className="text-2xl font-black text-indigo font-[family-name:var(--font-mono)]">Q3 2026</div>
              </div>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo hover:bg-indigo/80 text-white font-bold rounded-lg transition-all duration-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.25)]"
              >
                Get Notified
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
    </section>
  );
}

/* ================================================================
   CTA -- final conversion with liquid button
   ================================================================ */
function CTASection({ games }: { games: GameCover[] }) {
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      {games.length > 0 && (
        <div className="absolute inset-0 opacity-[0.05]" aria-hidden="true">
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 h-full" style={{ transform: 'scale(1.1) rotate(3deg)' }}>
            {[...games, ...games].slice(0, 48).map((g, i) => (
              <div key={`cta-${g.id}-${i}`} className="aspect-[3/4] rounded overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.cover_url.replace('t_cover_big', 't_thumb')} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-surface/90 via-surface/95 to-surface" />

      <motion.div
        className="relative z-10 max-w-4xl mx-auto px-4 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeUp}
      >
        <h2 className="text-5xl md:text-7xl font-black text-white mb-6 leading-[0.95] font-[family-name:var(--font-display)]" style={{ letterSpacing: '-0.04em' }}>
          Ready to play?
        </h2>
        <p className="text-xl text-white/30 mb-10 max-w-xl mx-auto">
          Join the community. Track your games. Discover your taste. Find your people.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <Link
            href="/signup"
            className="group px-10 py-5 liquid-button text-surface font-black text-xl rounded-lg"
          >
            <span className="flex items-center justify-center gap-2">
              START DISCOVERING
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </Link>
          <Link
            href="/login"
            className="px-10 py-5 border border-line text-white/60 font-bold text-xl rounded-lg hover:bg-white/[0.03] hover:border-white/10 transition-all duration-500 text-center"
          >
            Log In
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-white/30">
          {['Free forever', 'No credit card', '60s signup'].map(t => (
            <span key={t} className="flex items-center gap-1.5">
              <Check size={12} className="text-acid" />
              {t}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
