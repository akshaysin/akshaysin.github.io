import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.join(__dirname, 'src', 'assets');
const outputDir = path.join(__dirname, 'src', 'assets', 'resized');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Target dimensions (16:9 aspect ratio for blog images)
const TARGET_WIDTH = 800;
const TARGET_HEIGHT = 450;

// Supported image extensions
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

async function resizeImage(inputPath, outputPath) {
    try {
        await sharp(inputPath)
            .resize(TARGET_WIDTH, TARGET_HEIGHT, {
                fit: 'cover', // Crop to fit the exact dimensions
                position: 'center' // Center crop
            })
            .jpeg({ quality: 85 }) // Convert to JPEG with good quality
            .toFile(outputPath);

        console.log(`✅ Resized: ${path.basename(inputPath)}`);
    } catch (error) {
        console.error(`❌ Error resizing ${path.basename(inputPath)}:`, error.message);
    }
}

async function processImages() {
    try {
        const files = fs.readdirSync(assetsDir);

        console.log(`🔍 Found ${files.length} files in assets directory`);
        console.log(`📐 Target size: ${TARGET_WIDTH}x${TARGET_HEIGHT} pixels`);
        console.log('⏳ Starting image resize process...\n');

        let processedCount = 0;

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();

            if (imageExtensions.includes(ext)) {
                const inputPath = path.join(assetsDir, file);
                const outputPath = path.join(outputDir, path.basename(file, ext) + '.jpg');

                await resizeImage(inputPath, outputPath);
                processedCount++;
            }
        }

        console.log(`\n🎉 Successfully processed ${processedCount} images!`);
        console.log(`📁 Resized images saved to: ${outputDir}`);
        console.log('\n📋 Next steps:');
        console.log('1. Review the resized images in src/assets/resized/');
        console.log('2. Replace original images with resized versions if satisfied');
        console.log('3. Update image paths in blog posts if needed');

    } catch (error) {
        console.error('❌ Error processing images:', error);
    }
}

// Run the script
processImages();