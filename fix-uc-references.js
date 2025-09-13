import fs from 'fs';
import path from 'path';

const contentDir = 'src/content/blog';

function fixUcReferences(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            fixUcReferences(filePath);
        } else if (file.endsWith('.md')) {
            let content = fs.readFileSync(filePath, 'utf8');
            const originalContent = content;

            // Replace uc.jpeg with uc.jpg
            content = content.replace(/uc\.jpeg/g, 'uc.jpg');

            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Fixed uc reference in: ${filePath}`);
            }
        }
    });
}

fixUcReferences(contentDir);
console.log('All uc.jpeg references have been fixed to uc.jpg');