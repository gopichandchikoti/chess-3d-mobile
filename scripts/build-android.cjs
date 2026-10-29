const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
if (process.platform !== 'win32') throw new Error('Use expo run:android --variant release on this platform.');
require('../plugins/with-gl-keep.cjs').applyRules(path.join(process.cwd(), 'android'));
const sdk = process.env.ANDROID_HOME;
if (!sdk) throw new Error('Set ANDROID_HOME to an installed Android SDK.');
const cmakeDir = path.join(sdk, 'cmake');
const versions = fs
  .readdirSync(cmakeDir)
  .filter((name) => /^\d+\.\d+\.\d+$/.test(name))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const cmake = versions.at(-1);
if (!cmake) throw new Error('An installed SDK CMake is required.');
const abis = process.argv[2] ?? 'arm64-v8a,x86_64';
if (!abis.split(',').every((abi) => ['arm64-v8a', 'x86_64'].includes(abi)))
  throw new Error('Choose arm64-v8a and/or x86_64.');
const hermesPackage = require.resolve('hermes-compiler/package.json', {
  paths: [require.resolve('react-native/package.json')],
});
const hermes = path.join(path.dirname(hermesPackage), 'hermesc', 'win64-bin', 'hermesc.exe');
if (!fs.existsSync(hermes)) throw new Error('The installed Hermes compiler is missing.');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'chess3d-hermes-'));
const wrapper = path.join(temporary, 'hermesc.cmd');
if (/\s/.test(wrapper))
  throw new Error('A temporary folder without spaces is required for this Windows Hermes workaround.');
fs.writeFileSync(wrapper, '@echo off\r\n@"%CHESS3D_REAL_HERMES%" %*\r\n');
try {
  const command =
    '& \'.\\android\\gradlew.bat\' -p android assembleRelease --no-daemon --max-workers=2 --init-script ../scripts/android-build.gradle "-PreactNativeArchitectures=$env:CHESS3D_ABIS"';
  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', command], {
    stdio: 'inherit',
    env: {
      ...process.env,
      ANDROID_SDK_ROOT: sdk,
      EXPO_NO_TELEMETRY: '1',
      CMAKE_BUILD_PARALLEL_LEVEL: '2',
      CHESS3D_CMAKE_VERSION: cmake,
      CHESS3D_REAL_HERMES: hermes,
      CHESS3D_HERMES: wrapper,
      CHESS3D_ABIS: abis,
    },
  });
  process.exitCode = result.status ?? 1;
  if (result.status === 0) {
    const check = spawnSync(
      process.execPath,
      ['scripts/check-native-bundle.cjs', 'android/app/build/generated/sourcemaps/react/release'],
      { stdio: 'inherit' },
    );
    process.exitCode = check.status ?? 1;
    if (check.status === 0) {
      const native = spawnSync(
        process.execPath,
        ['scripts/check-native-config.cjs', 'android/app/build/outputs/mapping/release/mapping.txt'],
        { stdio: 'inherit' },
      );
      process.exitCode = native.status ?? 1;
    }
  }
} finally {
  fs.unlinkSync(wrapper);
  fs.rmdirSync(temporary);
}
