export interface Game {
  id: string;
  title: string;
  coverImage: string;
  releaseDate: string;
  developer: string;
  publisher: string;
  platforms: Platform[];
  genres: string[];
  description: string;
  averageRating: number;
  totalRatings: number;
  gameModes: GameMode[];
  crossPlatform: boolean;
  timeToBeat: number;
  timeToBeatCompletionist?: number;
  difficulty: Difficulty;
  ageRating: string;
  price: PriceInfo;
  tags: string[];
  features?: string[];
  screenshots?: string[];
  trailerUrl?: string;
  similarGameIds?: string[];
  fileSize?: string;
  // Community engagement
  likesCount?: number;
  reviewsCount?: number;
  listsCount?: number;
  rankings?: { category: string; rank: number }[];
}

// Supabase game from the real database
export interface SupabaseGame {
  id: number;
  name: string;
  slug: string;
  summary: string | null;
  storyline: string | null;
  cover_url: string | null;
  screenshots: string[];
  release_year: number | null;
  first_release_date: number | null;
  genres: string[];
  platforms: string[];
  game_modes: string[];
  themes: string[];
  developers: string[];
  publishers: string[];
  igdb_rating: number | null;
  igdb_rating_count: number | null;
  metacritic_score: number | null;
  average_rating: number;
  total_ratings: number;
  total_reviews: number;
  total_likes: number;
  total_in_lists: number;
  time_to_beat_main: number | null;
  time_to_beat_main_extra: number | null;
  time_to_beat_completionist: number | null;
  time_to_beat_source: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserGameEntry_DB {
  id: string;
  user_id: string;
  game_id: string;
  rating: number | null;
  status: string | null;
  review: string | null;
  liked: boolean;
  platform: string | null;
  date_played: string | null;
  created_at: string;
  updated_at: string;
}

export type Platform = 'PC' | 'PS5' | 'Xbox Series X' | 'Switch' | 'Mobile';

export type GameMode = 'Single-player' | 'Local Co-op' | 'Online Co-op' | 'PvP';

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Very Hard';

export interface PriceEntry {
  price: number;
  onSale: boolean;
  salePrice?: number;
}

export interface PriceInfo {
  steam?: PriceEntry;
  epic?: PriceEntry;
  playstation?: PriceEntry;
  xbox?: PriceEntry;
  nintendo?: PriceEntry;
}

export interface Review {
  id: string;
  userId: string;
  username: string;
  handle: string;
  rating: number;
  reviewText: string;
  platform: Platform;
  date: string;
  helpfulVotes: number;
  spoiler: boolean;
  gameId: string;
}

export interface EnhancedUserProfile {
  id: string;
  username: string;
  handle: string;
  displayName: string;
  bio: string;
  avatar_url?: string | null;
  memberSince: string;
  platforms: Platform[];
  topFourGames: string[];
  stats: {
    gamesPlayed: number;
    reviewsWritten: number;
    avgRating: number;
    listsCreated: number;
    followers: number;
    following: number;
  };
  recentActivity: Activity[];
  ratingDistribution: { rating: number; count: number }[];
  gamesByPlatform: { platform: string; count: number }[];
  gamesByGenre: { genre: string; count: number }[];
  favoriteGenres: string[];
  favoriteDevelopers: { name: string; gamesRated: number; avgRating: number }[];
  monthlyActivity: { month: string; count: number }[];
  lists: UserList[];
  userReviews: string[]; // review IDs
  userGames: UserGameEntry[];
}

export interface Activity {
  id: string;
  type: 'rated' | 'reviewed' | 'added_to_list' | 'status_change';
  gameId: string;
  gameCover: string;
  gameTitle: string;
  rating?: number;
  status?: string;
  listName?: string;
  date: string;
}

export interface UserList {
  id: string;
  name: string;
  description: string;
  gameIds: string[];
  coverImages: string[];
  createdAt: string;
}

export interface UserGameEntry {
  gameId: string;
  status: GameStatus;
  userRating?: number;
  dateAdded: string;
}

// Keep old interfaces for backward compat
export interface UserReview {
  id: string;
  username: string;
  avatarUrl: string;
  rating: number;
  reviewText: string;
  date: string;
  helpfulCount: number;
  gameId: string;
}

export interface UserProfile {
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  joinDate: string;
  gamesPlayed: number;
  reviewsWritten: number;
  averageRating: number;
  favoriteGenres: string[];
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  type: 'rated' | 'reviewed' | 'added' | 'playing';
  gameId: string;
  gameTitle: string;
  gameCover: string;
  rating?: number;
  date: string;
}

export type GameStatus = 'Played' | 'Playing' | 'Completed' | '100% Completed' | 'Want to Play' | 'Dropped';

export type SortOption = 'relevance' | 'rating-desc' | 'rating-asc' | 'release-desc' | 'title-asc';

export type ReviewSortOption = 'recent' | 'helpful' | 'highest' | 'lowest';

export type ListCategory = 'Action' | 'RPG' | 'Co-op' | 'Indie' | 'Strategy' | 'Multiplayer' | 'General';

export interface GameList {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorUsername: string;
  creatorAvatar: string;
  gameIds: string[];
  category: ListCategory;
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  featured: boolean;
  rankingStyle?: 'numbered' | 'tiered';
  tiers?: {
    S: string[];
    A: string[];
    B: string[];
    C: string[];
    D: string[];
  };
}

export interface ListComment {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  text: string;
  likes: number;
  createdAt: string;
}

export interface FeedActivity {
  id: string;
  type: 'rating' | 'review' | 'list' | 'status' | 'milestone';
  userId: string;
  username: string;
  handle: string;
  gameId?: string;
  gameCover?: string;
  gameTitle?: string;
  listId?: string;
  listTitle?: string;
  listCovers?: string[];
  listGameCount?: number;
  rating?: number;
  reviewSnippet?: string;
  status?: string;
  milestoneCount?: number;
  milestoneGames?: string[];
  timestamp: string;
  likes: number;
  comments: number;
}

export interface DiscoverUser {
  id: string;
  username: string;
  handle: string;
  bio: string;
  stats: {
    gamesPlayed: number;
    avgRating: number;
    followers: number;
  };
  topGames: string[];
  isFollowing: boolean;
  compatibility?: number;
}

export interface FriendPlayed {
  userId: string;
  username: string;
  rating: number;
}

export interface QuickQuote {
  userId: string;
  username: string;
  quote: string;
  rating: number;
}

export interface TrendingData {
  percentChange: number;
  timePeriod: 'today' | 'week' | 'month';
  rankChange: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: { current: number; total: number };
}

export interface TasteTwin {
  userId: string;
  username: string;
  handle: string;
  compatibility: number;
  isFollowing: boolean;
}

export interface JournalEntry {
  id: string;
  userId: string;
  gameId: string;
  datePlayed: string; // ISO date
  rating: number;
  review?: string;
  platform: string;
  tags: string[];
  liked: boolean;
}

export interface FilterState {
  platforms: Platform[];
  genres: string[];
  gameModes: GameMode[];
  crossPlatform: boolean | null;
  priceRange: [number, number];
  minRating: number;
  releaseYearRange: [number, number];
}
