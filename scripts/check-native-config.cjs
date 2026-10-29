const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { applyRules } = require('../plugins/with-gl-keep.cjs');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'chess3d-r8-'));
const app = path.join(temporary, 'app');
fs.mkdirSync(app);
const file = path.join(app, 'proguard-rules.pro');
try {
  fs.writeFileSync(file, '# Native config regression fixture\n');
  applyRules(temporary);
  const first = fs.readFileSync(file, 'utf8');
  applyRules(temporary);
  assert.equal(fs.readFileSync(file, 'utf8'), first);
  assert.equal((first.match(/-keepclassmembers/g) ?? []).length, 2);
  if (process.argv[2]) {
    const mapping = fs.readFileSync(process.argv[2], 'utf8');
    const context = mapping.split('expo.modules.gl.GLContext ->')[1]?.split('\n\n')[0];
    assert.ok(context?.includes('void flush() -> flush'), 'R8 must retain the JNI callback name.');
  }
  console.log('Expo GL reflection/JNI keep rules are idempotent and mapped callback is preserved.');
} finally {
  fs.unlinkSync(file);
  fs.rmdirSync(app);
  fs.rmdirSync(temporary);
}
