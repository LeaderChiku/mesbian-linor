/**
 * Central Content Management System (CMS) Schema & Defaults (Phase 4)
 * Allows customizing all visitor-facing text without code modifications.
 */

export interface CmsFields {
  // ── 1. Introductory & Hero Content ──
  heroDedication: string;
  heroTitle: string;
  heroWelcomeText: string;
  readyToBeginLabel: string;

  // ── 2. Story Letter Content ──
  letterTitle: string;
  letterDate: string;
  letterSalutation: string;
  letterParagraph1: string;
  letterParagraph2: string;
  letterParagraph3: string;
  letterSignature: string;

  // ── 3. Four Category Descriptions ──
  catGoldenHourTitle: string;
  catGoldenHourDesc: string;
  catLateNightTitle: string;
  catLateNightDesc: string;
  catOurWorldTitle: string;
  catOurWorldDesc: string;
  catFoldedWhispersTitle: string;
  catFoldedWhispersDesc: string;

  // ── 4. Endings Custom Content ──
  endingATitle: string;
  endingAWish: string;
  endingBTitle: string;
  endingBWish: string;
  endingCTitle: string;
  endingCWish: string;

  // ── 5. Romantic Twist Declaration Content ──
  twistTitle: string;
  twistSubtitle: string;
  twistDeclaration: string;
  twistWish: string;
}

export const DEFAULT_CMS_CONTENT: CmsFields = {
  // Hero
  heroDedication: 'An Interactive Keepsake',
  heroTitle: 'A Story for You',
  heroWelcomeText: 'Welcome to your personal scrapbook. Every photograph, note, and memory here has been assembled with love.',
  readyToBeginLabel: 'Ready to Begin',

  // Story Letter
  letterTitle: 'The Chapter We Write Together',
  letterDate: 'A Story Dedicated to You',
  letterSalutation: 'To the one reading this,',
  letterParagraph1: 'Before this website opened its doors to you, a quiet clock was ticking down the seconds. That pause was intentional — because the best stories should never be rushed into.',
  letterParagraph2: 'Within these scrapbook frames and handwritten lines lies a space created just for your thoughts and our shared laughter. As new memories are made, new chapters will unfold here in real time.',
  letterParagraph3: 'Take all the time you need. Breathe in the stillness, listen to the ambient music, and let every page speak to your heart.',
  letterSignature: 'Lovingly created,',

  // Categories
  catGoldenHourTitle: 'The Golden Hour',
  catGoldenHourDesc: 'Where our story quietly began — Day One moments in amber sunlight.',
  catLateNightTitle: 'Late Night Queues',
  catLateNightDesc: 'Valorant clutches, late-night laughter, and overtime heartbeats.',
  catOurWorldTitle: 'Our Little World',
  catOurWorldDesc: 'Minecraft houses, lost torches, and our cozy secret corner.',
  catFoldedWhispersTitle: 'Folded Whispers',
  catFoldedWhispersDesc: 'Little notes folded into books, and words kept forever close.',

  // Endings
  endingATitle: 'Thank You for Everything',
  endingAWish: 'I wish you a life full of moments that make you smile without knowing why.',
  endingBTitle: 'Some Things Are Hard to Keep Inside',
  endingBWish: 'I wish you find the kind of peace that feels like coming home.',
  endingCTitle: 'Something I’d Like to Say',
  endingCWish: 'I wish that whatever you choose leads you exactly where you’re meant to be.',

  // Romantic Twist
  twistTitle: 'A Confession for You',
  twistSubtitle: 'When the world falls away, only this remains',
  twistDeclaration: 'I didn’t just fall for the games we played or the late nights we stayed up talking. I fell for your laugh, the way you listen, and how everything feels right when you’re here.',
  twistWish: 'My wish has always been you.',
};

/**
 * Safely get a CMS string value with fallback to default text.
 */
export function getCmsValue(
  cmsData: Record<string, string> | null | undefined,
  key: keyof CmsFields
): string {
  if (cmsData && typeof cmsData[key] === 'string' && cmsData[key].trim().length > 0) {
    return cmsData[key];
  }
  return DEFAULT_CMS_CONTENT[key];
}
