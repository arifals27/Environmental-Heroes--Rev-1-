const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const gameDir = path.join(rootDir, 'game');
const wwwDir = path.join(rootDir, 'www');

if (!fs.existsSync(gameDir)) {
  console.error('Error: "game" directory not found! Please place your RPG Maker MZ game files inside the "game" folder.');
  process.exit(1);
}

if (!fs.existsSync(wwwDir)) {
  fs.mkdirSync(wwwDir, { recursive: true });
}

console.log('Syncing files from "game/" to "www/"...');
try {
  // Robocopy /MIR mirrors game/ into www/, purging old files that were deleted or converted
  execSync(`robocopy "${gameDir}" "${wwwDir}" /MIR /NP /NFL /NDL /NJH /NJS /R:1 /W:1`, { stdio: 'inherit' });
  console.log('Successfully synced game/ -> www/');
} catch (err) {
  if (err.status <= 7) {
    console.log('Successfully synced game/ -> www/');
  } else {
    console.error('Error during sync:', err.message);
    process.exit(1);
  }
}
