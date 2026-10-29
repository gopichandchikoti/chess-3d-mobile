import fs from 'node:fs';

const source = fs.readFileSync('src/core/tokens.ts', 'utf8');
function luminance(hex) {
  const channels = hex
    .slice(1)
    .match(/../g)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a, b) {
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
let failed = false;
for (const theme of ['light', 'dark']) {
  const section = source.split(`${theme}: {`)[1].split('},')[0];
  const colors = Object.fromEntries(
    [...section.matchAll(/(\w+): '(#[a-f0-9]+)'/g)].map((match) => [match[1], match[2]]),
  );
  for (const [foreground, background] of [
    ['ink', 'background'],
    ['ink', 'surface'],
    ['muted', 'background'],
    ['muted', 'surface'],
    ['primary', 'surface'],
    ['error', 'surface'],
    ['onPrimary', 'primary'],
  ]) {
    const ratio = contrast(colors[foreground], colors[background]);
    console.log(`${theme} ${foreground}/${background}: ${ratio.toFixed(2)}:1`);
    if (ratio < 4.5) failed = true;
  }
  console.log(
    `${theme} border/surface: ${contrast(colors.border, colors.surface).toFixed(2)}:1 (visual boundary, not text)`,
  );
}
if (failed) throw new Error('A text token pair fails WCAG AA contrast.');
