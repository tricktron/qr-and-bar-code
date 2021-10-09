"use strict";

const sharp = require('sharp');

async function decodeBufferToImage(buffer) {
    const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    return {
        width: info.width,
        height: info.height,
        rgbaPixels: Uint8ClampedArray.from(data)
    }
}

exports.decodeBufferToImageImpl = buffer => () => {
    return decodeBufferToImage(buffer);
}