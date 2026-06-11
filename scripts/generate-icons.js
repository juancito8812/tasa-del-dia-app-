const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const SIZE = 1024;
const PADDING = 120;

// Colors from the app theme
const BG_DARK = '#1a1a2e';
const BG_MID = '#16213e';
const HIGHLIGHT = '#e94560';
const ACCENT = '#0f3460';
const TEXT_LIGHT = '#e0e0e0';
const GOLD = '#f0c040';

function createIconSVG(foregroundOnly = false) {
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const r = SIZE / 2 - PADDING;

  return `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${BG_DARK}" />
        <stop offset="100%" style="stop-color:${BG_MID}" />
      </linearGradient>
      <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${ACCENT}" />
        <stop offset="100%" style="stop-color:#0a1a3a" />
      </linearGradient>
      <linearGradient id="arrowGrad1" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" style="stop-color:${HIGHLIGHT}" />
        <stop offset="100%" style="stop-color:#ff6b6b" />
      </linearGradient>
      <linearGradient id="arrowGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${GOLD}" />
        <stop offset="100%" style="stop-color:#d4a017" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.3"/>
      </filter>
    </defs>

    ${!foregroundOnly ? `<rect width="${SIZE}" height="${SIZE}" rx="224" fill="url(#bgGrad)" />` : ''}
    
    <!-- Outer ring -->
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#circleGrad)" stroke="${ACCENT}" stroke-width="3" filter="url(#shadow)" />
    
    <!-- Inner decorative ring -->
    <circle cx="${cx}" cy="${cy}" r="${r - 30}" fill="none" stroke="${HIGHLIGHT}" stroke-width="1.5" opacity="0.15" stroke-dasharray="8,6" />
    
    <!-- Dollar sign $ -->
    <text x="${cx - 40}" y="${cy - 20}" font-family="Arial, Helvetica, sans-serif" font-size="320" font-weight="bold" fill="${GOLD}" text-anchor="middle" dominant-baseline="central" opacity="0.15">$</text>
    
    <!-- Bs text -->
    <text x="${cx + 100}" y="${cy + 30}" font-family="Arial, Helvetica, sans-serif" font-size="100" font-weight="bold" fill="${TEXT_LIGHT}" text-anchor="middle" dominant-baseline="central" opacity="0.12">Bs</text>
    
    <!-- Up arrow (exchange rate going up) -->
    <g transform="translate(${cx - 160}, ${cy - 80})">
      <polygon points="60,0 0,80 120,80" fill="url(#arrowGrad1)" />
      <rect x="42" y="70" width="36" height="80" rx="6" fill="url(#arrowGrad1)" />
    </g>
    
    <!-- Down arrow (exchange rate going down) -->
    <g transform="translate(${cx + 40}, ${cy + 40})">
      <polygon points="60,80 0,0 120,0" fill="url(#arrowGrad2)" />
      <rect x="42" y="10" width="36" height="70" rx="6" fill="url(#arrowGrad2)" />
    </g>
    
    <!-- Arrows text labels -->
    <text x="${cx - 100}" y="${cy + 170}" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="bold" fill="${HIGHLIGHT}" text-anchor="middle" opacity="0.7">USD</text>
    <text x="${cx + 100}" y="${cy + 170}" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="bold" fill="${GOLD}" text-anchor="middle" opacity="0.7">Bs</text>
  </svg>`;
}

async function generateIcon(svgContent, outputPath, size = SIZE) {
  const buffer = Buffer.from(svgContent);
  await sharp(buffer)
    .resize(size, size)
    .png()
    .toFile(outputPath);
  console.log(`✓ Generated: ${outputPath}`);
}

async function main() {
  // Create assets directory if it doesn't exist
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  // Generate main app icon (1024x1024 - full with background)
  const mainSvg = createIconSVG(false);
  await generateIcon(mainSvg, path.join(ASSETS_DIR, 'icon.png'));

  // Generate adaptive icon foreground (1024x1024 - transparent background)
  const foregroundSvg = createIconSVG(true);
  await generateIcon(foregroundSvg, path.join(ASSETS_DIR, 'adaptive-icon-foreground.png'));

  // Generate a smaller 512x512 version
  await generateIcon(mainSvg, path.join(ASSETS_DIR, 'icon-512.png'), 512);

  // Generate a 192x192 version for smaller displays
  await generateIcon(mainSvg, path.join(ASSETS_DIR, 'icon-192.png'), 192);

  console.log('\n✅ All icons generated successfully!');
  
  // Verify files exist
  const files = ['icon.png', 'adaptive-icon-foreground.png', 'icon-512.png', 'icon-192.png'];
  files.forEach(f => {
    const fp = path.join(ASSETS_DIR, f);
    const stats = fs.statSync(fp);
    console.log(`  ${f}: ${(stats.size / 1024).toFixed(1)} KB`);
  });
}

main().catch(console.error);
