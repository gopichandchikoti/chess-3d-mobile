import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const findings = [];
const excluded = new Set([
  '.git',
  'node_modules',
  '.scratch',
  'coverage',
  'artifacts',
  'android',
  'ios',
  '.expo',
  'test-results',
  'playwright-report',
  'notices',
]);
const secret =
  /AKIA[A-Z0-9]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|ghp_[a-zA-Z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,}|sk-proj-[A-Za-z0-9_-]{40,}/;
let sources = 0;
let outputs = 0;
function visit(folder, output = false) {
  if (!fs.existsSync(folder)) return;
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      if (excluded.has(entry.name)) continue;
      visit(file, output || entry.name === 'dist');
      continue;
    }
    if (!/\.(ts|tsx|css|js|mjs|cjs|html|json|md|yaml|svg|gradle|hbc|bundle)$/.test(file)) continue;
    if (file.endsWith('audit.mjs')) continue;
    const source = fs.readFileSync(file).toString();
    if (output) outputs++;
    else sources++;
    if (secret.test(source)) findings.push(`${file}: possible secret`);
    if (!output && file.startsWith(`src${path.sep}`) && !file.includes('.test.')) {
      if (/dangerouslySetInnerHTML|\beval\s*\(|new\s+Function\s*\(/.test(source))
        findings.push(`${file}: unsafe execution`);
      if (/https?:\/\//.test(source)) findings.push(`${file}: runtime remote URL`);
    }
  }
}
visit('.');
const history = execFileSync('git', ['rev-list', '--all'], { encoding: 'utf8' }).trim();
let blobs = 0;
if (history) {
  const objects = execFileSync('git', ['rev-list', '--objects', '--all'], { encoding: 'utf8' }).trim().split('\n');
  for (const object of objects) {
    const id = object.split(' ')[0];
    if (execFileSync('git', ['cat-file', '-t', id], { encoding: 'utf8' }).trim() !== 'blob') continue;
    const data = execFileSync('git', ['cat-file', '-p', id], { maxBuffer: 32 * 1024 * 1024 }).toString();
    blobs++;
    if (secret.test(data)) findings.push(`Git history blob ${id}: possible secret`);
  }
}
for (const file of ['.env', '.env.local', 'node_modules/example', 'dist/example', '.scratch/example']) {
  const result = execFileSync('git', ['check-ignore', file], { encoding: 'utf8' }).trim();
  if (!result) findings.push(`Missing ignore rule for ${file}`);
}
console.log(
  'Pattern scan: ' +
    sources +
    ' source/configuration/document files; ' +
    outputs +
    ' output files; ' +
    blobs +
    ' historical blobs.',
);
console.log(history ? 'Existing Git history inspected.' : 'Git history is empty; no commits exist to scan.');
if (findings.length) {
  console.error(findings.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    'Configured patterns, runtime URL checks and ignore checks passed. This is not a complete security proof.',
  );
