#!/usr/bin/env node

/**
 * Image Optimization Script
 * 
 * This script optimizes images in the public/images directory to meet performance budgets.
 * Target: Largest homepage image ≤ 300KB
 * 
 * Requirements:
 * - Install sharp: npm install sharp
 * - Or install imagemin: npm install imagemin imagemin-webp imagemin-avif
 */

import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const imagesDir = join(__dirname, '../public/images');

// Target sizes and quality settings
const OPTIMIZATION_CONFIG = {
  maxSizeKB: 300,
  ciMaxSizeKB: 400, // CI threshold (higher than optimization target)
  quality: {
    webp: 80,
    avif: 70,
    jpeg: 85,
    png: 90
  },
  sizes: {
    hero: { width: 1200, height: 800 },
    activity: { width: 800, height: 600 },
    logo: { width: 400, height: 200 }
  },
  // Whitelist for assets allowed to exceed CI limits
  whitelist: [
    // Original PNG files - kept as fallbacks, WebP versions are used
    'hero-dashboard.png',
    'hero-fitness.png',
    'activity-a.png',
    'activity-b.png',
    'activity-c.png',
    'hero-app.png',
    'logo-1.png'
  ]
};

async function analyzeImages(ciMode = false) {
  const threshold = ciMode ? OPTIMIZATION_CONFIG.ciMaxSizeKB : OPTIMIZATION_CONFIG.maxSizeKB;
  console.log(`🔍 Analyzing images in public/images... (${ciMode ? 'CI' : 'DEV'} mode, threshold: ${threshold}KB)\n`);

  try {
    const files = await readdir(imagesDir);
    const imageFiles = files.filter(file =>
      /\.(png|jpg|jpeg|webp|avif)$/i.test(file)
    );

    const results = [];

    for (const file of imageFiles) {
      const filePath = join(imagesDir, file);
      const stats = await stat(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      const isWhitelisted = OPTIMIZATION_CONFIG.whitelist.includes(file);
      const needsOptimization = sizeKB > threshold && !isWhitelisted;

      let status = '✅ OK';
      if (isWhitelisted && sizeKB > threshold) {
        status = '⚪ WHITELISTED';
      } else if (needsOptimization) {
        status = '❌ TOO LARGE';
      }

      results.push({
        file,
        sizeKB,
        needsOptimization,
        isWhitelisted,
        status
      });
    }

    // Sort by size (largest first)
    results.sort((a, b) => b.sizeKB - a.sizeKB);

    console.log('📊 Image Analysis Results:');
    console.log('─'.repeat(60));
    console.log('File'.padEnd(30) + 'Size'.padEnd(10) + 'Status');
    console.log('─'.repeat(60));
    
    results.forEach(({ file, sizeKB, status }) => {
      console.log(
        file.padEnd(30) + 
        `${sizeKB}KB`.padEnd(10) + 
        status
      );
    });

    console.log('─'.repeat(60));
    
    const oversized = results.filter(r => r.needsOptimization);
    if (oversized.length > 0) {
      console.log(`\n⚠️  ${oversized.length} images exceed ${threshold}KB limit`);

      if (ciMode) {
        console.log('\n❌ CI Asset Audit Failed:');
        oversized.forEach(({ file, sizeKB }) => {
          console.log(`  - ${file}: ${sizeKB}KB (limit: ${threshold}KB)`);
        });
        console.log('\nTo fix:');
        console.log('1. Optimize these images to under 400KB');
        console.log('2. Or add them to the whitelist in scripts/optimize-images.mjs');
      } else {
        console.log('\n📝 Optimization recommendations:');

        oversized.forEach(({ file, sizeKB }) => {
          const category = getImageCategory(file);
          const targetSize = OPTIMIZATION_CONFIG.sizes[category];

          console.log(`\n• ${file} (${sizeKB}KB):`);
          console.log(`  - Resize to ${targetSize.width}x${targetSize.height}px`);
          console.log(`  - Convert to WebP (quality ${OPTIMIZATION_CONFIG.quality.webp})`);
          console.log(`  - Target: <${OPTIMIZATION_CONFIG.maxSizeKB}KB`);
        });

        console.log('\n🛠️  To optimize images:');
        console.log('1. Install sharp: npm install sharp');
        console.log('2. Run: node scripts/optimize-images.mjs --optimize');
        console.log('3. Or use online tools like squoosh.app');
      }

      process.exit(1);
    } else {
      console.log(`\n✅ All images meet ${ciMode ? 'CI' : 'optimization'} requirements!`);
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Error analyzing images:', error.message);
    process.exit(1);
  }
}

function getImageCategory(filename) {
  if (filename.includes('hero')) return 'hero';
  if (filename.includes('activity')) return 'activity';
  if (filename.includes('logo')) return 'logo';
  return 'hero'; // default
}

async function optimizeImages() {
  console.log('🚀 Starting image optimization...\n');

  try {
    // Try to import sharp
    const sharp = await import('sharp').catch(() => null);

    if (!sharp) {
      console.log('❌ Sharp not found. Please install it:');
      console.log('npm install sharp');
      console.log('\nAlternatively, use online tools:');
      console.log('- https://squoosh.app/');
      console.log('- https://tinypng.com/');
      process.exit(1);
    }

    const files = await readdir(imagesDir);
    const imageFiles = files.filter(file =>
      ['.png', '.jpg', '.jpeg'].includes(extname(file).toLowerCase())
    );

    console.log(`Found ${imageFiles.length} images to optimize...\n`);

    for (const file of imageFiles) {
      const inputPath = join(imagesDir, file);
      const stats = await stat(inputPath);
      const sizeKB = Math.round(stats.size / 1024);

      if (sizeKB <= OPTIMIZATION_CONFIG.maxSizeKB) {
        console.log(`✅ ${file} (${sizeKB}KB) - already optimized`);
        continue;
      }

      console.log(`🔄 Optimizing ${file} (${sizeKB}KB)...`);

      const category = getImageCategory(file);
      const targetSize = OPTIMIZATION_CONFIG.sizes[category];
      const baseName = basename(file, extname(file));

      // Create WebP version
      const webpPath = join(imagesDir, `${baseName}.webp`);
      await sharp.default(inputPath)
        .resize(targetSize.width, targetSize.height, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: OPTIMIZATION_CONFIG.quality.webp })
        .toFile(webpPath);

      const webpStats = await stat(webpPath);
      const webpSizeKB = Math.round(webpStats.size / 1024);

      console.log(`  ✅ Created ${baseName}.webp (${webpSizeKB}KB)`);

      // If WebP is still too large, create AVIF
      if (webpSizeKB > OPTIMIZATION_CONFIG.maxSizeKB) {
        const avifPath = join(imagesDir, `${baseName}.avif`);
        await sharp.default(inputPath)
          .resize(targetSize.width, targetSize.height, {
            fit: 'cover',
            position: 'center'
          })
          .avif({ quality: OPTIMIZATION_CONFIG.quality.avif })
          .toFile(avifPath);

        const avifStats = await stat(avifPath);
        const avifSizeKB = Math.round(avifStats.size / 1024);

        console.log(`  ✅ Created ${baseName}.avif (${avifSizeKB}KB)`);
      }
    }

    console.log('\n🎉 Image optimization complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Update image references to use .webp/.avif versions');
    console.log('2. Run the analysis again to verify sizes');

  } catch (error) {
    console.error('❌ Error during optimization:', error.message);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);
const shouldOptimize = args.includes('--optimize');
const ciMode = args.includes('--ci') || process.env.CI === 'true';

if (shouldOptimize) {
  optimizeImages();
} else {
  analyzeImages(ciMode);
}
