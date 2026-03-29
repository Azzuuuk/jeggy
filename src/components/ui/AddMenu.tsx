'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gamepad2, ListOrdered, BookOpen, X } from 'lucide-react';
import QuickLogModal from './QuickLogModal';
import DiaryInputModal from './DiaryInputModal';
import SuccessToast from './SuccessToast';

interface AddMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddMenu({ isOpen, onClose }: AddMenuProps) {
  const router = useRouter();
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen && !quickLogOpen && !diaryOpen) return null;

  const handleAddGame = () => {
    onClose();
    setQuickLogOpen(true);
  };

  const handleCreateList = () => {
    onClose();
    router.push('/lists/create');
  };

  const handleLogDiary = () => {
    onClose();
    setDiaryOpen(true);
  };

  return (
    <>
      {/* Menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
          <div className="bg-bg-card/90 backdrop-blur-xl border border-border rounded-sm w-full max-w-sm shadow-2xl shadow-black/50" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-bold text-text-primary">What would you like to do?</h2>
              <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-all duration-300">
                <X size={20} />
              </button>
            </div>
            <div className="p-2">
              <button
                onClick={handleAddGame}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-sm hover:bg-bg-elevated transition-all duration-300 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-accent-orange/15 flex items-center justify-center flex-shrink-0">
                  <Gamepad2 size={20} className="text-accent-orange" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">Add Game</p>
                  <p className="text-xs text-text-muted">Rate, review, or track a game</p>
                </div>
              </button>
              <button
                onClick={handleCreateList}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-sm hover:bg-bg-elevated transition-all duration-300 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-accent-teal/15 flex items-center justify-center flex-shrink-0">
                  <ListOrdered size={20} className="text-accent-teal" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">Create List</p>
                  <p className="text-xs text-text-muted">Tier lists, rankings, or collections</p>
                </div>
              </button>
              <button
                onClick={handleLogDiary}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-sm hover:bg-bg-elevated transition-all duration-300 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-accent-green/15 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={20} className="text-accent-green" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">Log Diary</p>
                  <p className="text-xs text-text-muted">Record a gaming session</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modals */}
      <QuickLogModal isOpen={quickLogOpen} onClose={() => setQuickLogOpen(false)} onSuccess={() => setToast('Game logged successfully')} />
      <DiaryInputModal isOpen={diaryOpen} onClose={() => setDiaryOpen(false)} onSuccess={() => setToast('Session logged successfully')} />
      <SuccessToast message={toast || ''} show={!!toast} onDone={() => setToast(null)} />
    </>
  );
}
