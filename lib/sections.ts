/**
 * Central Story Section & Audio Asset Registry
 *
 * Used by both visitor client and admin panel to ensure
 * authoritative, synchronized section numbering and assets.
 */

export interface AudioAsset {
  id: string;
  title: string;
  type: 'music' | 'voice_note';
  description: string;
  synthesizedFrequency?: number[]; // Frequencies for pure Web Audio synthesis fallback
}

export interface StorySection {
  id: string;
  index: number;
  chapterNumber: string;
  title: string;
  subtitle: string;
  summary: string;
  defaultAudioId?: string;
  associatedAudios: AudioAsset[];
}

export const STORY_AUDIOS: AudioAsset[] = [
  {
    id: 'music-chimes',
    title: 'Ethereal Chimes (Harp)',
    type: 'music',
    description: 'Soft pentatonic harp arpeggios for quiet reflection',
    synthesizedFrequency: [329.63, 415.30, 493.88, 659.25, 830.61],
  },
  {
    id: 'music-reverie',
    title: 'Starlight Reverie (Piano)',
    type: 'music',
    description: 'Gentle ambient chords in A major',
    synthesizedFrequency: [440.00, 554.37, 659.25, 880.00],
  },
  {
    id: 'music-golden',
    title: 'Golden Hour (Lullaby)',
    type: 'music',
    description: 'Warm low acoustic tones',
    synthesizedFrequency: [261.63, 329.63, 392.00, 523.25],
  },
  {
    id: 'vn-greeting',
    title: 'Voice Note 1: A Quiet Greeting',
    type: 'voice_note',
    description: 'Spoken personal welcome to the visitor',
    synthesizedFrequency: [220.00, 277.18],
  },
  {
    id: 'vn-memories',
    title: 'Voice Note 2: That Autumn Afternoon',
    type: 'voice_note',
    description: 'Reflections on the polaroid memories',
    synthesizedFrequency: [246.94, 311.13],
  },
  {
    id: 'vn-promise',
    title: 'Voice Note 3: A Soft Promise',
    type: 'voice_note',
    description: 'Closing whispered promise before farewell',
    synthesizedFrequency: [196.00, 261.63],
  },
];

export const STORY_SECTIONS: StorySection[] = [
  {
    id: 'hero',
    index: 0,
    chapterNumber: 'Prologue',
    title: 'A Story for You',
    subtitle: 'Where memories find their home',
    summary: 'The opening dedication and botanical crest, welcoming the visitor.',
    defaultAudioId: 'music-chimes',
    associatedAudios: [STORY_AUDIOS[0], STORY_AUDIOS[3]],
  },
  {
    id: 'polaroids',
    index: 1,
    chapterNumber: 'Chapter I',
    title: 'Treasured Moments',
    subtitle: 'Golden light and captured whispers',
    summary: 'Polaroid gallery showcasing memories with natural angles and handwritten captions.',
    defaultAudioId: 'music-golden',
    associatedAudios: [STORY_AUDIOS[2], STORY_AUDIOS[4]],
  },
  {
    id: 'letter',
    index: 2,
    chapterNumber: 'Chapter II',
    title: 'The Letter',
    subtitle: 'Words kept close to the chest',
    summary: 'Parchment story letter with drop cap typography, floral flourishes, and wax seal.',
    defaultAudioId: 'music-reverie',
    associatedAudios: [STORY_AUDIOS[1], STORY_AUDIOS[4]],
  },
  {
    id: 'timeline',
    index: 3,
    chapterNumber: 'Chapter III',
    title: 'The Journey Map',
    subtitle: 'How every step brought us here',
    summary: 'Interactive chapter milestone cards tracking past memories and future chapters.',
    defaultAudioId: 'music-chimes',
    associatedAudios: [STORY_AUDIOS[0], STORY_AUDIOS[5]],
  },
  {
    id: 'closing',
    index: 4,
    chapterNumber: 'Chapter IV',
    title: 'A Promise for Tomorrow',
    subtitle: 'Until the next page is written',
    summary: 'Keepsake seal, selected ending path (A/B/C), final blessing, and session lock controls.',
    defaultAudioId: 'music-reverie',
    associatedAudios: [STORY_AUDIOS[1], STORY_AUDIOS[5]],
  },
];

export function getSectionByIndex(index: number): StorySection {
  const bounded = Math.max(0, Math.min(index, STORY_SECTIONS.length - 1));
  return STORY_SECTIONS[bounded];
}

export function getSectionById(id: string): StorySection | undefined {
  return STORY_SECTIONS.find((s) => s.id === id);
}

export function getAudioById(id: string): AudioAsset | undefined {
  return STORY_AUDIOS.find((a) => a.id === id);
}
