import fs from 'fs';
import path from 'path';

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  if (!fs.existsSync(dirPath)) return 0;
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  }
  
  return totalSize;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

console.log('📊 Build Analysis Report\n');

// Analyze dist directory
const distSize = getDirectorySize('./dist');
console.log(`📦 Total build size: ${formatBytes(distSize)}`);

// Analyze assets
const assetsSize = getDirectorySize('./src/assets');
console.log(`🖼️ Assets size: ${formatBytes(assetsSize)}`);

// Count files
const assetsCount = fs.readdirSync('./src/assets').length;
console.log(`📁 Asset files: ${assetsCount}`);

// Show largest assets
console.log('\n🔍 Largest assets:');
const assetFiles = fs.readdirSync('./src/assets')
  .map(file => ({
    name: file,
    size: fs.statSync(path.join('./src/assets', file)).size
  }))
  .sort((a, b) => b.size - a.size)
  .slice(0, 5);

assetFiles.forEach((file, index) => {
  console.log(`${index + 1}. ${file.name} - ${formatBytes(file.size)}`);
});

console.log('\n✅ Analysis complete!');