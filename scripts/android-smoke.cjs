const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const sdk = process.env.ANDROID_HOME;
if (!sdk) throw new Error('ANDROID_HOME is required.');
const adb = path.join(sdk, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');
const serial = 'emulator-5562';
const call = (...args) => execFileSync(adb, ['-s', serial, ...args], { encoding: 'utf8', timeout: 25000 });
assert.ok(
  call('emu', 'avd', 'name')
    .split(/[\r\n]+/)
    .map((line) => line.trim())
    .includes('Chess3D_Agent_20261026'),
  'Only the isolated Chess3D AVD may be tested.',
);
const pause = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));
const events = [];
fs.mkdirSync('artifacts', { recursive: true });
function nodes() {
  call('shell', 'uiautomator', 'dump', '/sdcard/chess3d-smoke.xml');
  const xml = call('shell', 'cat', '/sdcard/chess3d-smoke.xml');
  return [...xml.matchAll(/<node\b[^>]*>/g)].map((match) =>
    Object.fromEntries([...match[0].matchAll(/([\w-]+)="([^"]*)"/g)].map((attribute) => [attribute[1], attribute[2]])),
  );
}
function alive() {
  assert.ok(call('shell', 'pidof', 'com.chess3d.offline').trim(), 'Native app must remain running.');
}
function swipe(down) {
  call('shell', 'input', 'swipe', '20', down ? '2050' : '1000', '20', down ? '1000' : '2050', '250');
}
async function top() {
  for (let i = 0; i < 5; i++) swipe(false);
  await pause();
}
async function seek(label, click = false) {
  for (let attempt = 0; attempt < 9; attempt++) {
    const list = nodes();
    const matches = list.filter((node) => {
      const bounds = [...(node.bounds ?? '').matchAll(/\d+/g)].map((match) => Number(match[0]));
      const visible =
        bounds.length === 4 &&
        bounds[2] > bounds[0] &&
        bounds[3] > bounds[1] &&
        bounds[0] >= 0 &&
        bounds[2] <= 1080 &&
        bounds[1] >= 100 &&
        bounds[3] <= 2340;
      return visible && [node.text, node['content-desc']].some((text) => text?.toLowerCase() === label.toLowerCase());
    });
    const node = matches.find((item) => item.clickable === 'true' && item.enabled === 'true') ?? matches[0];
    if (node) {
      if (click) {
        const bounds = [...node.bounds.matchAll(/\d+/g)].map((match) => Number(match[0]));
        call(
          'shell',
          'input',
          'tap',
          String(Math.round((bounds[0] + bounds[2]) / 2)),
          String(Math.round((bounds[1] + bounds[3]) / 2)),
        );
        await pause();
      }
      alive();
      return node;
    }
    swipe(true);
    await pause(100);
  }
  throw new Error(`Visible control or text missing: ${label}`);
}
async function tap(label) {
  return seek(label, true);
}
function capture(name) {
  call('shell', 'screencap', '-p', '/sdcard/chess3d-smoke.png');
  call('pull', '/sdcard/chess3d-smoke.png', `artifacts/${name}.png`);
  fs.writeFileSync(`artifacts/${name}.xml`, call('shell', 'cat', '/sdcard/chess3d-smoke.xml'));
}
async function record(name, task) {
  await task();
  events.push({ name, passed: true });
  process.stdout.write(`${name} passed\n`);
}
(async () => {
  await tap('Settings');
  await top();
  await tap('Reset local data');
  await tap('Confirm');
  await top();
  await record('welcome and native 3D', async () => {
    await seek('Play a game of chess.');
    capture('android-welcome');
  });
  await record('local legal move and camera', async () => {
    await tap('Two players');
    await tap('Start game');
    await seek('White to move');
    const mapping = fs.readFileSync('android/app/build/outputs/mapping/release/mapping.txt', 'utf8');
    const glClass = mapping.match(/expo\.modules\.gl\.GLView -> ([^:]+):/)?.[1];
    assert.ok(
      glClass && call('shell', 'dumpsys', 'activity', 'top').includes(`${glClass}{`),
      'The game must contain Expo GL native geometry rendering.',
    );
    call('shell', 'input', 'swipe', '250', '1350', '750', '1350', '400');
    capture('android-local-board');
    await tap('Play move');
    await top();
    await seek('Black to move');
    capture('android-after-e4');
  });
  await record('offline persistence after process restart', async () => {
    call('shell', 'cmd', 'connectivity', 'airplane-mode', 'enable');
    assert.equal(call('shell', 'settings', 'get', 'global', 'airplane_mode_on').trim(), '1');
    call('shell', 'am', 'force-stop', 'com.chess3d.offline');
    call('shell', 'am', 'start', '-n', 'com.chess3d.offline/.MainActivity');
    await pause(3000);
    await tap('Continue your game');
    await top();
    await seek('Black to move');
  });
  await record('completed game and local progress', async () => {
    await tap('Resign');
    await tap('Confirm');
    await top();
    await seek('White wins by resignation.');
    await tap('Your progress');
    await top();
    await seek('Completed games: 1');
    capture('android-progress');
  });
  for (const difficulty of ['Easy', 'Medium', 'Hard'])
    await record(`offline robot ${difficulty}`, async () => {
      await tap('Welcome');
      await top();
      await tap('Play the robot');
      await top();
      await tap(difficulty);
      await tap('Start game');
      await tap('Play move');
      await pause(3500);
      await top();
      await seek('White to move');
      await seek('Move history');
      const text = nodes()
        .map((node) => node.text)
        .join(' ');
      assert.ok(/e4.*[·•].*[a-hNBRQKO]/.test(text), 'A human move and robot reply must appear in history.');
      capture(`android-robot-${difficulty.toLowerCase()}`);
    });
  await record('themes and learning', async () => {
    await tap('Dark');
    capture('android-dark');
    await tap('Learn chess');
    await top();
    await tap('Mark lesson complete');
    await seek('Lesson completed');
  });
  await record('reset owned local data', async () => {
    await tap('Settings');
    await top();
    await tap('Reset local data');
    await tap('Confirm');
    await top();
    await seek('Enter the Game');
    await tap('Your progress');
    await top();
    await seek('Completed games: 0');
    capture('android-reset');
  });
  fs.writeFileSync(
    'artifacts/android-smoke.json',
    JSON.stringify({ serial, avd: 'Chess3D_Agent_20261026', release: true, metroStarted: false, events }, null, 2),
  );
})().catch((error) => {
  fs.writeFileSync('artifacts/android-smoke.json', JSON.stringify({ serial, events, failure: error.message }, null, 2));
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});
