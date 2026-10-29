const fs = require('node:fs');
const path = require('node:path');
const { withDangerousMod } = require('expo/config-plugins');
const rules = [
  '-keepclassmembers class expo.modules.gl.GLView { public <init>(android.content.Context, expo.modules.kotlin.AppContext); }',
  '-keepclassmembers class expo.modules.gl.GLContext { public void flush(); }',
];
/** Preserve only the constructor and JNI callback that Expo resolves by reflection/name. */
function applyRules(platformRoot) {
  const file = path.join(platformRoot, 'app', 'proguard-rules.pro');
  let source = fs.readFileSync(file, 'utf8');
  for (const rule of rules)
    if (!source.includes(rule)) source += `\n# Chess 3D: Expo GL reflection/JNI boundary.\n${rule}\n`;
  fs.writeFileSync(file, source);
}
module.exports = (config) =>
  withDangerousMod(config, [
    'android',
    async (current) => {
      applyRules(current.modRequest.platformProjectRoot);
      return current;
    },
  ]);
module.exports.applyRules = applyRules;
