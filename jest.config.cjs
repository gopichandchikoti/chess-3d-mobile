const preset = require('jest-expo/jest-preset');
module.exports = {
  ...preset,
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', 'index.ts', '!src/**/*.test.{ts,tsx}'],
  coverageThreshold: { global: { branches: 90, functions: 90, lines: 90, statements: 90 } },
  moduleNameMapper: { ...preset.moduleNameMapper, '^three$': '<rootDir>/node_modules/three/src/Three.js' },
  transformIgnorePatterns: preset.transformIgnorePatterns.map((pattern) =>
    pattern.startsWith('/node_modules/(?') ? pattern.replace('.pnpm|', '.pnpm|three|') : pattern,
  ),
};
