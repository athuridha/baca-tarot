const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, 'public', 'tarotdeck');
const tempDir = path.join(__dirname, 'public', 'tarotdeck_opt');

// Create temp dir
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.webp'));

console.log(`Re-optimizing ${files.length} WebP images...`);

let totalBefore = 0;
let totalAfter = 0;

async function optimizeAll() {
  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(tempDir, file);
    const currentSize = fs.statSync(inputPath).size;
    totalBefore += currentSize;

    let quality = 75;
    if (currentSize > 100 * 1024) quality = 60;
    else if (currentSize > 50 * 1024) quality = 68;

    const info = await sharp(inputPath)
      .resize({ width: 600, height: 900, fit: 'inside', withoutEnlargement: true })
      .webp({ quality, effort: 6, smartSubsample: true })
      .toFile(outputPath);
    
    const newSize = fs.statSync(outputPath).size;

    if (newSize < currentSize) {
      totalAfter += newSize;
      const saved = ((1 - newSize / currentSize) * 100).toFixed(1);
      console.log(`  ${file}: ${(currentSize/1024).toFixed(0)}KB -> ${(newSize/1024).toFixed(0)}KB (-${saved}%)`);
    } else {
      // Copy original if webp optimization made it bigger
      fs.copyFileSync(inputPath, outputPath);
      totalAfter += currentSize;
      console.log(`  ${file}: ${(currentSize/1024).toFixed(0)}KB (kept original)`);
    }
  }

  // Replace originals with optimized
  for (const file of fs.readdirSync(tempDir)) {
    const src = path.join(tempDir, file);
    const dest = path.join(inputDir, file);
    fs.copyFileSync(src, dest);
  }
  
  // Cleanup
  fs.rmSync(tempDir, { recursive: true });

  console.log(`\nDone! ${(totalBefore/1024/1024).toFixed(2)}MB -> ${(totalAfter/1024/1024).toFixed(2)}MB (saved ${((1 - totalAfter/totalBefore) * 100).toFixed(1)}%)`);
}

optimizeAll().catch(console.error);
