import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const foldersToConvert = [
  { path: join(publicDir, 'card', 'Skill Card'), quality: 78 },
  { path: join(publicDir, 'Upgrade Pack'), quality: 75 },
];

let totalOriginal = 0;
let totalConverted = 0;
let count = 0;

for (const { path: folder, quality } of foldersToConvert) {
  const files = await readdir(folder);
  // Overwrite the webp files we just created with better compression
  const webpFiles = files.filter(f => /\.webp$/i.test(f));

  console.log(`\n📁 ${folder.split('/').slice(-2).join('/')} — ${webpFiles.length} webp files (re-compressing at q=${quality})`);

  for (const file of webpFiles) {
    const srcPath = join(folder, file);       // existing webp (from last run)
    const origJpg = join(folder, basename(file, '.webp') + '.jpg');

    // Prefer original JPG as source (better quality baseline)
    let srcFile = srcPath;
    try { await stat(origJpg); srcFile = origJpg; } catch { /* no jpg, use webp */ }

    const srcStat = await stat(srcFile);
    totalOriginal += srcStat.size;

    // Resize: cap max width at 800px (card display never exceeds 300px wide)
    // preserves aspect ratio automatically with sharp
    try {
      await sharp(srcFile)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality, effort: 6 })
        .toFile(srcPath + '.tmp');

      // Replace file
      const { rename } = await import('fs/promises');
      await rename(srcPath + '.tmp', srcPath);

      const destStat = await stat(srcPath);
      totalConverted += destStat.size;
      count++;

      const saving = (((srcStat.size - destStat.size) / srcStat.size) * 100).toFixed(0);
      console.log(`  ✅ ${file.padEnd(40)} ${(srcStat.size/1024).toFixed(0).padStart(5)}KB → ${(destStat.size/1024).toFixed(0).padStart(4)}KB  (-${saving}%)`);
    } catch (err) {
      console.error(`  ❌ ${file}: ${err.message}`);
    }
  }
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Total optimized : ${count} files`);
console.log(`Source size     : ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
console.log(`Optimized size  : ${(totalConverted / 1024 / 1024).toFixed(2)} MB`);
console.log(`Total saved     : ${((totalOriginal - totalConverted) / 1024 / 1024).toFixed(2)} MB  (-${(((totalOriginal - totalConverted) / totalOriginal) * 100).toFixed(0)}%)`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
