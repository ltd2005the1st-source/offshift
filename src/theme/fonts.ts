// Two-font pairings: a display face for titles and big words, a text face
// for everything else (numbers included, in tabular figures).
// The preview frame can switch between them so Đạt can choose one.

export type FontPairId = 'fraunces-inter' | 'instrument-dmsans' | 'space-plex' | 'bricolage-figtree';

export interface FontPair {
  id: FontPairId;
  name: string;
  note: string;
  display: { family: string; weight: 400 | 500 | 600 | 700; tracking: number; scale: number; css: string };
  text: { family: string; css: string };
}

export const FONT_PAIRS: FontPair[] = [
  {
    id: 'fraunces-inter',
    name: 'Fraunces + Inter',
    note: 'Soft, warm serif titles over the clearest small text there is. Calm at 3 a.m.',
    display: { family: 'Fraunces', weight: 600, tracking: -0.022, scale: 1, css: 'Fraunces:opsz,wght@9..144,400..700' },
    text: { family: 'Inter', css: 'Inter:opsz,wght@14..32,400..700' },
  },
  {
    id: 'instrument-dmsans',
    name: 'Instrument Serif + DM Sans',
    note: 'Elegant, editorial titles with a friendly, rounded body. The most distinctive.',
    display: { family: 'Instrument Serif', weight: 400, tracking: -0.01, scale: 1.14, css: 'Instrument+Serif' },
    text: { family: 'DM Sans', css: 'DM+Sans:opsz,wght@9..40,400..700' },
  },
  {
    id: 'space-plex',
    name: 'Space Grotesk + IBM Plex Sans',
    note: 'Technical and precise, like a good instrument panel. Feels clinical in a good way.',
    display: { family: 'Space Grotesk', weight: 600, tracking: -0.03, scale: 0.98, css: 'Space+Grotesk:wght@400..700' },
    text: { family: 'IBM Plex Sans', css: 'IBM+Plex+Sans:wght@400;500;600;700' },
  },
  {
    id: 'bricolage-figtree',
    name: 'Bricolage Grotesque + Figtree',
    note: 'Keeps Daybook’s character in the titles, with a quieter, rounder body.',
    display: { family: 'Bricolage Grotesque', weight: 600, tracking: -0.028, scale: 1, css: 'Bricolage+Grotesque:opsz,wght@12..96,400..700' },
    text: { family: 'Figtree', css: 'Figtree:wght@400..700' },
  },
];

export const DEFAULT_PAIR: FontPairId = 'fraunces-inter';

export const pairById = (id: string | undefined) => FONT_PAIRS.find((p) => p.id === id) ?? FONT_PAIRS[0];

/** One Google Fonts URL with every pairing, so switching never flashes. */
export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?' +
  [...new Set(FONT_PAIRS.flatMap((p) => [p.display.css, p.text.css]))].map((f) => `family=${f}`).join('&') +
  '&display=swap';
