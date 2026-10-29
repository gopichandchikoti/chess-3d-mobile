const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
const previous = config.resolver.resolveRequest;
const threeModule = path.join(path.dirname(require.resolve('three')), 'three.module.js');
// Three's legacy CommonJS entry calls Node-only process APIs. Hermes must load the maintained ES module.
config.resolver.resolveRequest = (context, name, platform) => {
  if (name === 'three') return { type: 'sourceFile', filePath: threeModule };
  return previous ? previous(context, name, platform) : context.resolveRequest(context, name, platform);
};
module.exports = config;
