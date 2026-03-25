'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, User, Plus, LogOut } from 'lucide-react';
import SearchAutocomplete from './SearchAutocomplete';
import AddMenu from './AddMenu';
import { NotificationsBell } from './NotificationsBell';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

const guestNavLinks = [
  { href: '/discover', label: 'DISCOVER' },
  { href: '/games', label: 'GAMES' },
  { href: '/lists', label: 'LISTS' },
  { href: '/feed', label: 'FEED' },
];

const navLinks = [
  ...guestNavLinks,
  { href: '/diary', label: 'DIARY' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile } = useProfile(user?.id);

  const profileUrl = profile ? `/profile/${profile.username}` : '/login';

  const isLanding = !user && pathname === '/';

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-border bg-bg-primary/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Logo */}
            <Link href={user ? '/home' : '/'} className="flex items-center -space-x-0.5 flex-shrink-0 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/JeggyLogo.png" alt="Jeggy" className="h-11 w-auto group-hover:rotate-[-8deg] transition-transform duration-300" />
              <span className="text-xl font-bold tracking-tight text-text-primary font-[family-name:var(--font-display)]">
                Jeggy
              </span>
            </Link>

            {/* Desktop nav links */}
            {!isLanding && (
              <div className="hidden md:flex items-center gap-1">
                {(user ? navLinks : guestNavLinks).map(link => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-2 text-xs tracking-widest font-semibold uppercase transition-colors ${
                        isActive
                          ? 'text-text-primary'
                          : 'text-text-muted hover:text-text-secondary'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Search bar - desktop */}
            {!isLanding ? (
              <div className="hidden md:block flex-1 max-w-xs">
                <SearchAutocomplete compact />
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <button
                    onClick={() => setAddMenuOpen(true)}
                    className="flex items-center gap-1.5 bg-accent-green hover:bg-accent-green-hover text-black text-xs font-bold px-4 py-2 rounded-sm uppercase tracking-wider transition-all duration-300"
                  >
                    <Plus size={14} />
                    ADD
                  </button>
                  <NotificationsBell />
                  <Link
                    href={profileUrl}
                    className="w-8 h-8 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-accent-orange/30 transition-all duration-300 overflow-hidden"
                  >
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} />
                    )}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-danger transition-colors"
                    title="Log out"
                  >
                    <LogOut size={16} />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-accent-green hover:bg-accent-green-hover text-black text-sm font-semibold px-4 py-2 rounded-sm transition-all duration-300"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile actions */}
            <div className="flex md:hidden items-center gap-1">
              {user && <NotificationsBell />}
              <button
                className="p-2 text-text-secondary hover:text-text-primary"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-bg-primary/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-3">
              {!isLanding && <SearchAutocomplete compact />}
              <div className="space-y-1 pt-2">
                {!isLanding && (user ? navLinks : guestNavLinks).map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary rounded-sm hover:bg-bg-elevated transition-all duration-300"
                  >
                    {link.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link
                      href={profileUrl}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary rounded-sm hover:bg-bg-elevated transition-all duration-300"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                      className="block w-full text-left px-3 py-2.5 text-sm text-danger hover:bg-bg-elevated rounded-md transition-colors"
                    >
                      Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary rounded-sm hover:bg-bg-elevated transition-all duration-300"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2.5 text-sm text-accent-green font-semibold hover:bg-bg-elevated rounded-md transition-colors"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <AddMenu isOpen={addMenuOpen} onClose={() => setAddMenuOpen(false)} />
    </>
  );
}
