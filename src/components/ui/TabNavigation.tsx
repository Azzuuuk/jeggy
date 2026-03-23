'use client';

interface TabNavigationProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-border">
      <nav className="flex gap-0 overflow-x-auto scroll-row" aria-label="Tabs">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              activeTab === tab
                ? 'text-accent-orange'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-orange" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
