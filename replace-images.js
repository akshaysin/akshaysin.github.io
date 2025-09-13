import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.join(__dirname, 'src', 'assets');
const resizedDir = path.join(assetsDir, 'resized');

function cleanFileName(fileName) {
    // Remove double extensions like .JPG.jpg -> .jpg
    return fileName.replace(/\.(\w+)\.\1$/, '.$1');
}

async function replaceImages() {
    try {
        const resizedFiles = fs.readdirSync(resizedDir);

        console.log('🔄 Replacing original images with resized versions...\n');

        let replacedCount = 0;

        for (const file of resizedFiles) {
            const cleanName = cleanFileName(file);
            const resizedPath = path.join(resizedDir, file);
            const targetPath = path.join(assetsDir, cleanName);

            try {
                // Copy resized image to replace original
                fs.copyFileSync(resizedPath, targetPath);
                console.log(`✅ Replaced: ${cleanName}`);
                replacedCount++;
            } catch (error) {
                console.error(`❌ Error replacing ${cleanName}:`, error.message);
            }
        }

        console.log(`\n🎉 Successfully replaced ${replacedCount} images!`);
        console.log('🧹 Cleaning up resized directory...');

        // Remove the resized directory
        fs.rmSync(resizedDir, { recursive: true, force: true });
        console.log('✅ Cleanup complete!');

    } catch (error) {
        console.error('❌ Error replacing images:', error);
    }
}

// Run the replacement
replaceImages();