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

try {
    const dims = getPngDimensions('src/assets/sprites/player_sheet.png');
    console.log(JSON.stringify(dims));
} catch (e) {
    console.error(e.message);
}
