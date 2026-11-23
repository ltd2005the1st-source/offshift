// Offshift's two faces: Inter Tight for titles and big words,
// IBM Plex Sans for everything else (numbers included, in tabular figures).

export const DISPLAY = {
  family: 'Inter Tight',
  weight: 600 as const,
  /** Letter-spacing as a share of the font size. */
  tracking: -0.025,
  scale: 1,
};

export const TEXT = { family: 'IBM Plex Sans' };

export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500..700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap';
