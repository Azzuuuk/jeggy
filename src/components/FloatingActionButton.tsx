'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plus } from 'lucide-react';
import AddMenu from './ui/AddMenu';

export function FloatingActionButton() {
  const { user } = useAuth();
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setAddMenuOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-accent-green hover:bg-accent-green-hover text-black rounded-full shadow-lg shadow-black/30 items-center justify-center z-40 transition-all duration-200 hidden md:flex"
        aria-label="Quick actions"
      >
        <Plus size={24} />
      </button>
      <AddMenu isOpen={addMenuOpen} onClose={() => setAddMenuOpen(false)} />
    </>
  );
}

