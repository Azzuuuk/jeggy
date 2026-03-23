'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Gamepad2, Plus, List, BookOpen, User, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import AddMenu from './AddMenu';

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  // Hide mobile nav for logged-out users
  if (!user) return null;

  const profileUrl = profile ? `/profile/${profile.username}` : '/login';

  const navItems = [
    { label: 'Games', href: '/games', icon: Gamepad2 },
    { label: 'Lists', href: '/lists', icon: List },
    { label: 'Add', href: '#', icon: Plus, isCenter: true },
    { label: 'Diary', href: '/diary', icon: BookOpen },
    user
      ? { label: 'Profile', href: profileUrl, icon: User }
      : { label: 'Log In', href: '/login', icon: LogIn },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-bg-card/90 backdrop-blur-xl border-t border-border md:hidden">
        <div className="flex items-center justify-around h-full px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            if (item.isCenter) {
              return (
                <button
                  key={item.label}
                  onClick={() => user ? setAddMenuOpen(true) : router.push('/login')}
                  className="flex flex-col items-center justify-center -mt-4"
                >
                  <div className="w-12 h-12 rounded-sm bg-accent-green flex items-center justify-center shadow-lg shadow-accent-green/20">
                    <Icon size={24} className="text-black" />
                  </div>
                  <span className="text-[10px] mt-0.5 text-accent-green font-medium">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center justify-center gap-0.5"
              >
                <Icon
                  size={20}
                  className={isActive ? 'text-accent-orange' : 'text-text-muted'}
                />
                <span
                  className={`text-[10px] ${
                    isActive ? 'text-accent-orange font-medium' : 'text-text-muted'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <AddMenu isOpen={addMenuOpen} onClose={() => setAddMenuOpen(false)} />
    </>
  );
}
