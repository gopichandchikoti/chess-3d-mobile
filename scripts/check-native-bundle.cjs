const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[2] ?? 'dist';
let checked = 0;
function visit(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (/\.(hbc|bundle|map)$/.test(file)) {
      checked++;
      const source = fs.readFileSync(file).toString();
      if (source.includes('THREE_CJS_DEPRECATED') || source.includes('/three/build/three.cjs'))
        throw new Error(`Native bundle includes the Node-only Three.js entry: ${file}`);
    }
  }
}
visit(root);
if (!checked) throw new Error('No native bundles or source maps were inspected.');
console.log(`Native ES module regression check passed for ${checked} bundle/map files.`);
