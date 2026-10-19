const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const gameDir = path.join(rootDir, 'game');
const docsDir = path.join(rootDir, '_docs');

if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// -------------------------------------------------------------
// Helper: Run command as Promise
// -------------------------------------------------------------
function runCmd(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: rootDir, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) resolve({ success: false, error: err.message });
      else resolve({ success: true, stdout });
    });
  });
}

// -------------------------------------------------------------
// 1. Clean Unused Plugins & Duplicates
// -------------------------------------------------------------
function cleanPlugins() {
  console.log('\n--- 1. Cleaning Unused Plugins & Duplicates ---');
  // Remove duplicate PKD_SimpleQuestSystem.js in game/js
  const dupJs = path.join(gameDir, 'js', 'PKD_SimpleQuestSystem.js');
  if (fs.existsSync(dupJs)) {
    fs.unlinkSync(dupJs);
    console.log('Removed duplicate: game/js/PKD_SimpleQuestSystem.js (630 KB)');
  }

  // Check active plugins in plugins.js
  const pluginsJsPath = path.join(gameDir, 'js', 'plugins.js');
  if (fs.existsSync(pluginsJsPath)) {
    const txt = fs.readFileSync(pluginsJsPath, 'utf8');
    const jsonStr = txt.substring(txt.indexOf('['), txt.lastIndexOf(']') + 1);
    const activePlugins = new Set(JSON.parse(jsonStr).filter(p => p.status).map(p => p.name + '.js'));

    const pluginsFolder = path.join(gameDir, 'js', 'plugins');
    const backupFolder = path.join(docsDir, 'plugins_reference');
    if (!fs.existsSync(backupFolder)) fs.mkdirSync(backupFolder, { recursive: true });

    let movedCount = 0;
    let savedBytes = 0;
    for (const f of fs.readdirSync(pluginsFolder)) {
      if (!f.endsWith('.js')) continue;
      if (!activePlugins.has(f)) {
        const src = path.join(pluginsFolder, f);
        const dst = path.join(backupFolder, f);
        savedBytes += fs.statSync(src).size;
        fs.renameSync(src, dst);
        movedCount++;
      }
    }
    console.log(`Moved ${movedCount} inactive plugins to _docs/plugins_reference/ (${(savedBytes / (1024 * 1024)).toFixed(2)} MB saved)`);
  }
}

// -------------------------------------------------------------
// 2. Clean Unused Audio
// -------------------------------------------------------------
function cleanUnusedAudio() {
  console.log('\n--- 2. Moving Unused RTP Audio ---');
  const dataDir = path.join(gameDir, 'data');
  const referencedAudio = new Set();

  for (const f of fs.readdirSync(dataDir)) {
    if (f.endsWith('.json')) {
      const c = fs.readFileSync(path.join(dataDir, f), 'utf8');
      const m = c.match(/"name"\s*:\s*"([^"]+)"/g);
      if (m) m.forEach(x => referencedAudio.add(x.replace(/"name"\s*:\s*"/, '').replace(/"/, '').toLowerCase()));
    }
  }

  const pjs = fs.readFileSync(path.join(gameDir, 'js', 'plugins.js'), 'utf8');
  const pm = pjs.match(/"[^"]+"/g);
  if (pm) pm.forEach(x => referencedAudio.add(x.replace(/"/g, '').toLowerCase()));

  const audioBackup = path.join(docsDir, 'unused_audio');
  if (!fs.existsSync(audioBackup)) fs.mkdirSync(audioBackup, { recursive: true });

  let movedAudio = 0;
  let savedAudioBytes = 0;

  for (const sub of ['bgm', 'bgs', 'me', 'se']) {
    const p = path.join(gameDir, 'audio', sub);
    if (!fs.existsSync(p)) continue;
    const subBackup = path.join(audioBackup, sub);
    if (!fs.existsSync(subBackup)) fs.mkdirSync(subBackup, { recursive: true });

    for (const f of fs.readdirSync(p)) {
      if (!f.endsWith('.ogg')) continue;
      const base = f.replace('.ogg', '').toLowerCase();
      if (!referencedAudio.has(base)) {
        const src = path.join(p, f);
        const dst = path.join(subBackup, f);
        savedAudioBytes += fs.statSync(src).size;
        fs.renameSync(src, dst);
        movedAudio++;
      }
    }
  }

  console.log(`Moved ${movedAudio} unused audio files to _docs/unused_audio/ (${(savedAudioBytes / (1024 * 1024)).toFixed(2)} MB saved)`);
}

// -------------------------------------------------------------
// 3. Compress Images to WebP with Parallel Workers
// -------------------------------------------------------------
async function compressImages() {
  console.log('\n--- 3. Converting PNG Images to WebP ---');
  const imgDir = path.join(gameDir, 'img');
  const allPngs = [];

  function collectPngs(dir) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) {
        collectPngs(full);
      } else if (item.endsWith('.png')) {
        allPngs.push(full);
      }
    }
  }

  collectPngs(imgDir);
  console.log(`Found ${allPngs.length} PNG images to process.`);

  let totalOrig = 0;
  let totalNew = 0;
  let convertedCount = 0;

  const CONCURRENCY = 6;
  let index = 0;

  async function worker() {
    while (index < allPngs.length) {
      const pngPath = allPngs[index++];
      const webpPath = pngPath.slice(0, -4) + '.webp';
      const relPath = path.relative(imgDir, pngPath);
      const subFolder = relPath.split(path.sep)[0];

      // Pixel art folders get lossless encoding to preserve 100% sharpness
      const isPixelArt = ['tilesets', 'characters', 'sv_actors', 'sv_enemies', 'system', 'pSQSystem'].includes(subFolder);
      const ffmpegArgs = isPixelArt ? '-c:v libwebp -lossless 1' : '-c:v libwebp -quality 82';

      const origSize = fs.statSync(pngPath).size;
      totalOrig += origSize;

      const res = await runCmd(`ffmpeg -y -i "${pngPath}" ${ffmpegArgs} "${webpPath}"`);
      if (res.success && fs.existsSync(webpPath)) {
        const newSize = fs.statSync(webpPath).size;
        if (newSize < origSize) {
          totalNew += newSize;
          fs.unlinkSync(pngPath);
          convertedCount++;
        } else {
          // If PNG is smaller (rare), keep PNG and discard WebP
          totalNew += origSize;
          fs.unlinkSync(webpPath);
        }
      } else {
        totalNew += origSize;
      }

      if (convertedCount % 100 === 0 && convertedCount > 0) {
        console.log(`  Processed ${convertedCount}/${allPngs.length} images...`);
      }
    }
  }

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  const savedMB = ((totalOrig - totalNew) / (1024 * 1024)).toFixed(2);
  const reductionPct = ((1 - totalNew / totalOrig) * 100).toFixed(1);
  console.log(`Converted ${convertedCount} images to WebP.`);
  console.log(`Original: ${(totalOrig / (1024 * 1024)).toFixed(2)} MB -> WebP: ${(totalNew / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Saved: ${savedMB} MB (${reductionPct}% reduction)!`);
}

// -------------------------------------------------------------
// 4. Compress Video
// -------------------------------------------------------------
async function compressVideo() {
  console.log('\n--- 4. Compressing Movie ---');
  const moviePath = path.join(gameDir, 'movies', 'videoplayback (29).webm');
  if (fs.existsSync(moviePath)) {
    const origSize = fs.statSync(moviePath).size;
    const tempMovie = path.join(gameDir, 'movies', 'temp_comp.webm');

    console.log('Optimizing videoplayback (29).webm...');
    const res = await runCmd(`ffmpeg -y -i "${moviePath}" -c:v libvpx-vp9 -crf 38 -b:v 0 -c:a libopus -b:a 48k "${tempMovie}"`);
    if (res.success && fs.existsSync(tempMovie)) {
      const newSize = fs.statSync(tempMovie).size;
      if (newSize < origSize) {
        fs.unlinkSync(moviePath);
        fs.renameSync(tempMovie, moviePath);
        console.log(`Video compressed from ${(origSize / (1024 * 1024)).toFixed(2)} MB to ${(newSize / (1024 * 1024)).toFixed(2)} MB!`);
      } else {
        fs.unlinkSync(tempMovie);
      }
    }
  }
}

// -------------------------------------------------------------
// Main execution
// -------------------------------------------------------------
async function main() {
  console.log('=============================================');
  console.log('      ENVIRONMENTAL HEROES ASSET COMPRESSION ');
  console.log('=============================================');
  const start = Date.now();

  cleanPlugins();
  cleanUnusedAudio();
  await compressImages();
  await compressVideo();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nAll optimizations completed successfully in ${elapsed}s!`);
}

main().catch(err => {
  console.error('Fatal error during compression:', err);
  process.exit(1);
});
