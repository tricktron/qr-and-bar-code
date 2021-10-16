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

async function decodeBinaryBufferToPNGBuffer(buffer) {
    return await sharp(buffer).ensureAlpha().png().toBuffer();
}

exports.decodeBufferToImageImpl = buffer => () => {
    return decodeBufferToImage(buffer);
}

exports.decodeBinaryBufferToPNGBufferImpl = buffer => () => {
    return decodeBinaryBufferToPNGBuffer(buffer);
}