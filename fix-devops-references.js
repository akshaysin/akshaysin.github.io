import fs from 'fs';
import path from 'path';

const contentDir = 'src/content/blog';

function fixDevopsReferences(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            fixDevopsReferences(filePath);
        } else if (file.endsWith('.md')) {
            let content = fs.readFileSync(filePath, 'utf8');
            const originalContent = content;

            // Replace devops.jpeg with devops.jpg
            content = content.replace(/devops\.jpeg/g, 'devops.jpg');

            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Fixed devops reference in: ${filePath}`);
            }
        }
    });
}

fixDevopsReferences(contentDir);
console.log('All devops.jpeg references have been fixed to devops.jpg');