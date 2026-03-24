import Link from 'next/link';

const exploreLinks = [
  { label: 'Browse Games', href: '/games' },
  { label: 'Lists', href: '/lists' },
  { label: 'Discover', href: '/discover' },
];

const communityLinks = [
  { label: 'Activity Feed', href: '/feed' },
  { label: 'Discover Users', href: '/discover' },
  { label: 'Top Rated', href: '/games?sort=rating-desc' },
];

const aboutLinks = [
  { label: 'About Jeggy', href: '/about' },
  { label: 'Settings', href: '/settings' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

function FooterColumn({ heading, links }: { heading: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">{heading}</h4>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link href={link.href} className="text-sm text-text-muted hover:text-accent-orange transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg-card/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center -space-x-0.5 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/JeggyLogo.png" alt="Jeggy" className="h-9 w-auto" />
              <span className="text-lg font-bold text-text-primary font-[family-name:var(--font-display)]">Jeggy</span>
            </div>
            <p className="text-sm text-text-muted">
              Track, rate, and discover your next favorite game.
            </p>
          </div>

          <FooterColumn heading="Explore" links={exploreLinks} />
          <FooterColumn heading="Community" links={communityLinks} />
          <FooterColumn heading="About" links={aboutLinks} />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-text-muted">© 2026 Jeggy. All rights reserved.</span>
          <a
            href="https://www.igdb.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-muted hover:text-accent-orange transition-colors"
          >
            Game data powered by IGDB
          </a>
        </div>
      </div>
    </footer>
  );
}
