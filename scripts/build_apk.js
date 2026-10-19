const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');
const srcApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const dstApk = path.join(rootDir, 'EnvironmentalHeroes.apk');

console.log('=== Step 1: Syncing game assets (game/ -> www/) ===');
execSync('node scripts/prepare_www.js', { cwd: rootDir, stdio: 'inherit' });

console.log('\n=== Step 2: Copying web bundle to Android assets ===');
const publicAssets = path.join(androidDir, 'app', 'src', 'main', 'assets', 'public');
if (fs.existsSync(publicAssets)) {
  fs.rmSync(publicAssets, { recursive: true, force: true });
}
execSync('npx cap copy android', { cwd: rootDir, stdio: 'inherit' });

console.log('\n=== Step 3: Compiling APK with Gradle ===');
const appBuildDir = path.join(androidDir, 'app', 'build');
if (fs.existsSync(appBuildDir)) {
  fs.rmSync(appBuildDir, { recursive: true, force: true });
}
const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat assembleDebug' : './gradlew assembleDebug';
execSync(gradlewCmd, { cwd: androidDir, stdio: 'inherit' });

console.log('\n=== Step 4: Finalizing APK output ===');
if (fs.existsSync(srcApk)) {
  fs.copyFileSync(srcApk, dstApk);
  const sizeMB = (fs.statSync(dstApk).size / (1024 * 1024)).toFixed(2);
  console.log(`\nSUCCESS! APK built and copied to:\n${dstApk} (${sizeMB} MB)\n`);
} else {
  console.error('Error: app-debug.apk was not found after Gradle build.');
  process.exit(1);
}
