export type CategorySlug =
  | 'the-golden-hour'
  | 'late-night-queues'
  | 'our-little-world'
  | 'folded-whispers';

export interface PhotoItem {
  id: string;
  imageUrl: string;
  caption: string;
  comments?: string;
  categorySlug: CategorySlug;
  orderIndex: number;
  isCover: boolean;
  dateLabel?: string;
  createdAt: string;
}

export interface PhotoCategoryMeta {
  slug: CategorySlug;
  title: string;
  subtitle: string;
  icon: string;
  themeColor: 'pistachio' | 'blush' | 'amber' | 'rose';
  description: string;
}

export const PHOTO_CATEGORIES: PhotoCategoryMeta[] = [
  {
    slug: 'the-golden-hour',
    title: 'The Golden Hour',
    subtitle: 'Day One & Warm Beginnings',
    icon: '🌅',
    themeColor: 'amber',
    description: 'Where our story quietly began — moments suspended in amber sunlight.',
  },
  {
    slug: 'late-night-queues',
    title: 'Late Night Queues',
    subtitle: 'Valorant & Midnight Laughs',
    icon: '🎮',
    themeColor: 'blush',
    description: 'Overtime clutches, late-night giggles, and heartbeats at 2 AM.',
  },
  {
    slug: 'our-little-world',
    title: 'Our Little World',
    subtitle: 'Minecraft & Inside Jokes',
    icon: '🌱',
    themeColor: 'pistachio',
    description: 'Little wooden houses, lost torches in birch forests, and our quiet corner.',
  },
  {
    slug: 'folded-whispers',
    title: 'Folded Whispers',
    subtitle: 'Letters & Kept Secrets',
    icon: '💌',
    themeColor: 'rose',
    description: 'Small notes tucked into books, whispered thoughts, and words kept forever.',
  },
];

export const DEFAULT_PHOTOS: PhotoItem[] = [
  // ── 1. The Golden Hour ──
  {
    id: 'gh-1',
    imageUrl: '/photos/golden-hour-1.jpg',
    caption: 'Where our story quietly began',
    comments: 'That first warm afternoon when time seemed to slow down.',
    categorySlug: 'the-golden-hour',
    orderIndex: 0,
    isCover: true,
    dateLabel: 'Day One',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'gh-2',
    imageUrl: '/photos/golden-hour-2.jpg',
    caption: 'Sunlight through the leaves',
    comments: 'A quiet bench and conversations that never felt forced.',
    categorySlug: 'the-golden-hour',
    orderIndex: 1,
    isCover: false,
    dateLabel: 'Golden Afternoon',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'gh-3',
    imageUrl: '/photos/golden-hour-3.jpg',
    caption: 'Walking without a destination',
    comments: 'The best walks are the ones where nobody checks the time.',
    categorySlug: 'the-golden-hour',
    orderIndex: 2,
    isCover: false,
    dateLabel: 'Sunset Glow',
    createdAt: new Date().toISOString(),
  },

  // ── 2. Late Night Queues ──
  {
    id: 'ln-1',
    imageUrl: '/photos/valorant-1.jpg',
    caption: 'Overtime clutch & laughing at 2 AM',
    comments: '12-12 overtime heartbeats. You promised we would win!',
    categorySlug: 'late-night-queues',
    orderIndex: 0,
    isCover: true,
    dateLabel: 'Overtime Match',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ln-2',
    imageUrl: '/photos/valorant-2.jpg',
    caption: 'Defusing with 0.1s on the clock',
    comments: 'My hands were shaking and you were laughing so hard.',
    categorySlug: 'late-night-queues',
    orderIndex: 1,
    isCover: false,
    dateLabel: 'Late Night Queue',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ln-3',
    imageUrl: '/photos/valorant-3.jpg',
    caption: 'Post-game debrief at 3 AM',
    comments: '"Just one more game" turned into watching the sky turn blue.',
    categorySlug: 'late-night-queues',
    orderIndex: 2,
    isCover: false,
    dateLabel: 'Midnight Echoes',
    createdAt: new Date().toISOString(),
  },

  // ── 3. Our Little World ──
  {
    id: 'ow-1',
    imageUrl: '/photos/minecraft-1.jpg',
    caption: 'Little wooden houses on the hill',
    comments: 'Our tiny home with the mismatched roof and flower pots.',
    categorySlug: 'our-little-world',
    orderIndex: 0,
    isCover: true,
    dateLabel: 'World Seed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ow-2',
    imageUrl: '/photos/minecraft-2.jpg',
    caption: 'Torches marking our way back',
    comments: 'Lost in the birch forest again until we saw the lighthouse glow.',
    categorySlug: 'our-little-world',
    orderIndex: 1,
    isCover: false,
    dateLabel: 'Cozy Shelter',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ow-3',
    imageUrl: '/photos/minecraft-3.jpg',
    caption: 'Our secret garden corner',
    comments: 'Rows of wheat, two dogs that never stand up, and peaceful music.',
    categorySlug: 'our-little-world',
    orderIndex: 2,
    isCover: false,
    dateLabel: 'The Secret Garden',
    createdAt: new Date().toISOString(),
  },

  // ── 4. Folded Whispers ──
  {
    id: 'fw-1',
    imageUrl: '/photos/whispers-1.jpg',
    caption: 'Words kept close to the chest',
    comments: 'Every letter meant every word. Kept right beside my favorite book.',
    categorySlug: 'folded-whispers',
    orderIndex: 0,
    isCover: true,
    dateLabel: 'Kept Forever',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fw-2',
    imageUrl: '/photos/whispers-2.jpg',
    caption: 'A small note tucked into a book',
    comments: 'A reminder that someone was thinking of you across the miles.',
    categorySlug: 'folded-whispers',
    orderIndex: 1,
    isCover: false,
    dateLabel: 'Page 42',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fw-3',
    imageUrl: '/photos/whispers-3.jpg',
    caption: 'The quiet between the sentences',
    comments: 'Sometimes the silence we shared was warmer than a thousand words.',
    categorySlug: 'folded-whispers',
    orderIndex: 2,
    isCover: false,
    dateLabel: 'Folded Care',
    createdAt: new Date().toISOString(),
  },
];
