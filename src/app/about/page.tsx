import { Gamepad2, ListOrdered, Users, DollarSign, Trophy } from 'lucide-react';

const features = [
  {
    icon: Gamepad2,
    title: 'Rate & Review',
    description:
      'Rate games on a 1-10 scale and write reviews to share your thoughts with the community.',
  },
  {
    icon: ListOrdered,
    title: 'Curated Lists',
    description:
      'Create and share game lists for any occasion — top picks, hidden gems, genre deep-dives, and more.',
  },
  {
    icon: Users,
    title: 'Social Discovery',
    description:
      'Follow gamers with similar taste and discover new favorites through their ratings and recommendations.',
  },
  {
    icon: DollarSign,
    title: 'Price Comparison',
    description:
      'Compare prices across platforms so you never miss a deal on the games you want.',
  },
  {
    icon: Trophy,
    title: 'Track Your Journey',
    description:
      "Track what you've played, what you're playing, and what you want to play next — all in one place.",
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-primary mb-6">About Jeggy</h1>

      <p className="text-secondary">
        Jeggy is Letterboxd for video games — a platform where gamers can
        discover, rate, and track the games they love. We believe that gaming is
        a deeply personal experience, and every player deserves a place to
        celebrate their taste, share discoveries, and connect with others who
        share their passion.
      </p>

      <p className="text-secondary mt-4">
        Built by gamers, for gamers, Jeggy brings together a comprehensive game
        database, social features, and powerful discovery tools to help you find
        your next favorite game.
      </p>

      <h2 className="text-xl font-semibold mt-10 mb-4">
        What Makes Jeggy Special
      </h2>

      <div className="space-y-4">
        {features.map((feature) => (
          <div key={feature.title} className="flex gap-4">
            <div className="w-10 h-10 rounded-sm bg-accent-orange/10 flex items-center justify-center flex-shrink-0">
              <feature.icon size={20} className="text-accent-orange" />
            </div>
            <div>
              <h3 className="font-medium text-primary">{feature.title}</h3>
              <p className="text-sm text-secondary">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-4">Our Vision</h2>

      <p className="text-secondary">
        Our vision is to become the definitive gaming identity platform — a place
        where your gaming history, preferences, and social connections come
        together to create a rich, personal profile that evolves with you. We
        want every gamer to feel seen, understood, and connected through the
        games they love.
      </p>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Get In Touch</h2>
        <p className="text-secondary">
          Questions or suggestions? We&apos;d love to hear from you.
        </p>
        <p className="mt-2">
          Email:{' '}
          <a
            href="mailto:hello@jeggy.gg"
            className="text-accent-orange hover:underline"
          >
            hello@jeggy.gg
          </a>
        </p>
      </div>
    </div>
  );
}
