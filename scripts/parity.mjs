import fs from 'node:fs';
import path from 'node:path';

const other = process.argv[2];
if (!other) {
  console.log('Pass the other repository path to compare mirrored contracts.');
  process.exitCode = 1;
} else {
  const names = fs.readdirSync('src/core').filter((name) => /\.(ts|tsx)$/.test(name));
  let differences = 0;
  for (const name of names) {
    const local = fs.readFileSync(path.join('src/core', name), 'utf8');
    const remote = fs.readFileSync(path.join(other, 'src/core', name), 'utf8');
    if (local !== remote) {
      differences++;
      console.error(`Different: ${name}`);
    }
  }
  if (differences) process.exitCode = 1;
  else console.log(`All ${names.length} core sources and fixtures match byte for byte.`);
}
