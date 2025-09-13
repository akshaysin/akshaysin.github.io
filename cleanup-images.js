import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.join(__dirname, 'src', 'assets');

function cleanupDuplicateImages() {
    try {
        const files = fs.readdirSync(assetsDir);

        console.log('🧹 Cleaning up duplicate and malformed image files...\n');

        let cleanedCount = 0;

        // Group files by base name (without extension)
        const fileGroups = {};

        for (const file of files) {
            const ext = path.extname(file);
            const baseName = path.basename(file, ext);

            if (!fileGroups[baseName]) {
                fileGroups[baseName] = [];
            }
            fileGroups[baseName].push({ name: file, ext, fullPath: path.join(assetsDir, file) });
        }

        // Process each group
        for (const [baseName, fileList] of Object.entries(fileGroups)) {
            if (fileList.length > 1) {
                // Sort by preference: .jpg first, then .jpeg, then others
                const sortedFiles = fileList.sort((a, b) => {
                    const priority = { '.jpg': 1, '.jpeg': 2, '.png': 3 };
                    const aPriority = priority[a.ext.toLowerCase()] || 4;
                    const bPriority = priority[b.ext.toLowerCase()] || 4;
                    return aPriority - bPriority;
                });

                // Keep the first (preferred) file, remove others
                const keepFile = sortedFiles[0];
                const removeFiles = sortedFiles.slice(1);

                for (const file of removeFiles) {
                    try {
                        fs.unlinkSync(file.fullPath);
                        console.log(`🗑️ Removed duplicate: ${file.name}`);
                        cleanedCount++;
                    } catch (error) {
                        console.error(`❌ Error removing ${file.name}:`, error.message);
                    }
                }
            }
        }

        console.log(`\n✅ Cleanup complete! Removed ${cleanedCount} duplicate files.`);
        console.log('📁 Final assets directory contents:');

        // Show final file count
        const finalFiles = fs.readdirSync(assetsDir);
        console.log(`📊 Total files: ${finalFiles.length}`);

        // Count by extension
        const extCount = {};
        finalFiles.forEach(file => {
            const ext = path.extname(file).toLowerCase();
            extCount[ext] = (extCount[ext] || 0) + 1;
        });

        console.log('📋 Files by extension:', extCount);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    }
}

// Run the cleanup
cleanupDuplicateImages();