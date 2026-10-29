export const palettes = {
  light: {
    background: '#f4f0e7',
    surface: '#fffaf0',
    ink: '#252f2a',
    muted: '#506056',
    primary: '#285a43',
    onPrimary: '#ffffff',
    border: '#7e8e7f',
    error: '#a12c36',
    success: '#285a43',
    boardLight: '#deccb0',
    boardDark: '#688472',
    pieceLight: '#fff1d8',
    pieceDark: '#34291f',
    brass: '#c2974d',
  },
  dark: {
    background: '#151d19',
    surface: '#202c25',
    ink: '#f4f0e7',
    muted: '#b6c6bb',
    primary: '#a2cfb2',
    onPrimary: '#14251b',
    border: '#7a9583',
    error: '#ffadb1',
    success: '#a2cfb2',
    boardLight: '#b4a78c',
    boardDark: '#3e6050',
    pieceLight: '#fff1d8',
    pieceDark: '#34291f',
    brass: '#d9b36f',
  },
} as const;
export type Palette = { [K in keyof typeof palettes.light]: string };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, section: 48 } as const;
export const radii = { control: 8, panel: 16, dialog: 24 } as const;
export const fontSizes = { small: 12, caption: 14, body: 16, subheading: 20, heading: 28, display: 40 } as const;
export const springs = {
  snappy: { response: 0.32, damping: 0.86 },
  smooth: { response: 0.5, damping: 1 },
  bouncy: { response: 0.45, damping: 0.7 },
} as const;
