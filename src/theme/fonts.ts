// Offshift's two faces: Space Grotesk for titles and big words,
// IBM Plex Sans for everything else (numbers included, in tabular figures).

export const DISPLAY = {
  family: 'Space Grotesk',
  weight: 600 as const,
  /** Letter-spacing as a share of the font size. */
  tracking: -0.03,
  scale: 0.98,
};

export const TEXT = { family: 'IBM Plex Sans' };

export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500..700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap';
