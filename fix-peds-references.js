import fs from 'fs';
import path from 'path';

const contentDir = 'src/content/blog';

function fixPedsReferences(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            fixPedsReferences(filePath);
        } else if (file.endsWith('.md')) {
            let content = fs.readFileSync(filePath, 'utf8');
            const originalContent = content;

            // Replace peds.jpeg with peds.jpg
            content = content.replace(/peds\.jpeg/g, 'peds.jpg');

            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Fixed peds reference in: ${filePath}`);
            }
        }
    });
}

fixPedsReferences(contentDir);
console.log('All peds.jpeg references have been fixed to peds.jpg');