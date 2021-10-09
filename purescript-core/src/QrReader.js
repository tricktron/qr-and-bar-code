"use strict";

const { MultiFormatReader, RGBLuminanceSource, BinaryBitmap, HybridBinarizer, DecodeHintType, BarcodeFormat } = require('@zxing/library');
const jsQR = require('jsqr');
const qrCodeGenerator = require('qrcode-generator');

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

exports.scanQrCodeImpl = left => right => qrcode => rgbaBuffer => width => height => {
    const code = jsQR(rgbaBuffer, width, height);
    if (code) {
        return right(qrcode(code.data));
    } else {
        return left("QR code could not be read");
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