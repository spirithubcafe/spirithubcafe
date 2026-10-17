#!/usr/bin/env node

/**
 * Tier 1 Performance: Convert PNG logos to WebP format
 * 
 * Usage:
 *   npm install sharp
 *   node convert-logos-to-webp.js
 * 
 * This script converts PNG logo files to WebP format for better performance.
 * Expected savings: 11-20 KB per page load (15-20% of current weight)
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const QUALITY = 80;
const logos = [
  {
    input: 'public/images/logo/logo-light.png',
    output: 'public/images/logo/logo-light.webp',
    name: 'Logo Light'
  },
  {
    input: 'public/images/logo/logo-dark.png',
    output: 'public/images/logo/logo-dark.webp',
    name: 'Logo Dark'
  },
  {
    input: 'public/images/logo-s.png',
    output: 'public/images/logo-s.webp',
    name: 'Logo Small'
  }
];

async function convertToWebP(logo) {
  try {
    const inputPath = path.join(process.cwd(), logo.input);
    const outputPath = path.join(process.cwd(), logo.output);

    // Check if input exists
    if (!fs.existsSync(inputPath)) {
      console.warn(`⚠️  SKIPPED: ${logo.name} - Input file not found: ${logo.input}`);
      return { success: false, error: 'File not found' };
    }

    // Get file sizes
    const inputStats = fs.statSync(inputPath);
    const inputSizeKB = (inputStats.size / 1024).toFixed(1);

    // Convert to WebP
    await sharp(inputPath)
      .webp({ quality: QUALITY })
      .toFile(outputPath);

    const outputStats = fs.statSync(outputPath);
    const outputSizeKB = (outputStats.size / 1024).toFixed(1);
    const savings = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);

    console.log(`✅ ${logo.name}:`);
    console.log(`   Input:  ${logo.input} (${inputSizeKB} KB)`);
    console.log(`   Output: ${logo.output} (${outputSizeKB} KB)`);
    console.log(`   Saved:  ${savings}% (${(inputStats.size - outputStats.size) / 1024} KB reduction)`);
    console.log('');

    return { 
      success: true, 
      inputSize: inputStats.size,
      outputSize: outputStats.size,
      savings: inputStats.size - outputStats.size
    };
  } catch (err) {
    console.error(`❌ ${logo.name} - Conversion failed:`, err.message);
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('\n🖼️  Converting PNG logos to WebP format...\n');
  console.log(`Quality: ${QUALITY} (0-100, higher = better quality/larger file)\n`);

  let totalInputSize = 0;
  let totalOutputSize = 0;
  let successCount = 0;

  for (const logo of logos) {
    const result = await convertToWebP(logo);
    if (result.success) {
      totalInputSize += result.inputSize;
      totalOutputSize += result.outputSize;
      successCount++;
    }
  }

  if (successCount === 0) {
    console.error('\n❌ No logos were converted. Please ensure:');
    console.error('   1. sharp is installed: npm install sharp');
    console.error('   2. PNG files exist in public/images/');
    process.exit(1);
  }

  const totalSavings = totalInputSize - totalOutputSize;
  const totalSavingsPercent = ((1 - totalOutputSize / totalInputSize) * 100).toFixed(1);

  console.log('─'.repeat(60));
  console.log(`✨ Conversion complete: ${successCount}/${logos.length} logos converted\n`);
  console.log(`📊 Total Savings:`);
  console.log(`   Input:  ${(totalInputSize / 1024).toFixed(1)} KB`);
  console.log(`   Output: ${(totalOutputSize / 1024).toFixed(1)} KB`);
  console.log(`   Saved:  ${totalSavingsPercent}% (${(totalSavings / 1024).toFixed(1)} KB)\n`);

  console.log('📋 Next steps:');
  console.log('   1. Verify the .webp files are created in public/images/');
  console.log('   2. Run: npm run build');
  console.log('   3. Test: npm run serve');
  console.log('   4. Check Network tab in DevTools - WebP logos should load\n');

  console.log('🎯 Expected Performance Gain:');
  console.log(`   Page Weight: -${(totalSavings / 1024).toFixed(1)} KB`);
  console.log(`   LCP: -50-100ms (faster logo loading)`);
  console.log(`   CrUX Score: +3-5%\n`);
}

// Run with error handling
main().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
