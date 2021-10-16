"use strict";

const { MultiFormatReader, RGBLuminanceSource, BinaryBitmap, HybridBinarizer, DecodeHintType, BarcodeFormat } = require('@zxing/library');
const jsQR = require('jsqr');
const qrCodeGenerator = require('qrcode-generator');
const { UPNG } = require('upng');

function scanBarcode(rgbaBuffer, width, height) {
    const hints = new Map();
    const formats = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8];
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    const reader = new MultiFormatReader(hints);
    const luminances = toGrayscaleBuffer(rgbaBuffer, width, height);
    const luminanceSource = new RGBLuminanceSource(luminances, width, height);
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
    return reader.decode(binaryBitmap);
}

function toGrayscaleBuffer(imageBuffer, width, height) {
    /*Zxing works with grayscale images. They use a green-favoring average:
    https://github.com/zxing/zxing/blob/be2c5bdd883f9f42e794e4b0e7e1b30f436fc0a7/core/src/main/java/com/google/zxing/RGBLuminanceSource.java#L42-L56
    */
    const size = width * height;
    let greys = new Uint8ClampedArray(size);
    for (let i = 0; i < size; i++) {
        let red = imageBuffer[i * 4];
        let doubleGreen = imageBuffer[i * 4 + 1] * 2;
        let blue = imageBuffer[i * 4 + 2];
        greys[i] = (red + doubleGreen + blue) / 4;
    }
    return greys;
}

function b64ToUint6(nChr) {
    return nChr > 64 && nChr < 91 ?
        nChr - 65
        : nChr > 96 && nChr < 123 ?
            nChr - 71
            : nChr > 47 && nChr < 58 ?
                nChr + 4
                : nChr === 43 ?
                    62
                    : nChr === 47 ?
                        63
                        :
                        0;
}

exports.scanQrCodeEffImpl = image => () => {
    const qr = jsQR(image.rgbaPixels, image.width, image.height);
    if (qr) {
        return qr.data;
    } else {
        throw new Error("QR code could not be read");
    }
}

exports.scanBarcodeImpl = left => right => barcode => rgbaBuffer => width => height => {
    try {
        const res = scanBarcode(rgbaBuffer, width, height);
        return right(barcode(res.text));
    } catch (err) {
        return left("Barcode could not be read");
    }
}

exports.createBase64PNGQrCodeImpl = text => size => {
    const qr = qrCodeGenerator(0, 'L');
    qr.addData(text);
    qr.make();
    const qrModuleSize = size / (qr.getModuleCount() + 8);
    const margin = 4 * qrModuleSize;
    const base64GifQrImage = qr.createDataURL(qrModuleSize, margin);
    return base64GifQrImage.replace("data:image/gif", "data:image/png");
}

exports.decodePngImpl = arrayBuffer => {
    const image = UPNG.decode(arrayBuffer);
    const rgba = UPNG.toRGBA8(image);
    const rgbaPixels = new Uint8ClampedArray(rgba[0]);
    return {
        width: image.width,
        height: image.height,
        rgbaPixels: rgbaPixels
    };
}

exports.convertBase64StringToArrayBufferImpl = sBase64 => {
    var
        sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
        nOutLen = nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);
    for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
        nMod4 = nInIdx & 3;
        nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 6 * (3 - nMod4);
        if (nMod4 === 3 || nInLen - nInIdx === 1) {
            for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
                taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
            }
            nUint24 = 0;
        }
    }
    return taBytes.buffer;
}