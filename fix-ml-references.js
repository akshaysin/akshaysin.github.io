import fs from 'fs';
import path from 'path';

const contentDir = 'src/content/blog';

function fixMlReferences(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            fixMlReferences(filePath);
        } else if (file.endsWith('.md')) {
            let content = fs.readFileSync(filePath, 'utf8');
            const originalContent = content;

            // Replace ml.jpeg with ml.jpg
            content = content.replace(/ml\.jpeg/g, 'ml.jpg');

            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Fixed ml reference in: ${filePath}`);
            }
        }
    });
}

fixMlReferences(contentDir);
console.log('All ml.jpeg references have been fixed to ml.jpg');