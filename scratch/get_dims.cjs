const fs = require('fs');
const path = require('path');

function getPngDimensions(filePath) {
    const buffer = fs.readFileSync(filePath);
    if (buffer.toString('ascii', 1, 4) !== 'PNG') {
        throw new Error('Not a PNG file');
    }
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
}

const spriteDir = 'src/assets/sprites';
const files = fs.readdirSync(spriteDir).filter(f => f.endsWith('.png'));

const results = {};
files.forEach(file => {
    try {
        results[file] = getPngDimensions(path.join(spriteDir, file));
    } catch (e) {
        results[file] = { error: e.message };
    }
});

console.log(JSON.stringify(results, null, 2));
