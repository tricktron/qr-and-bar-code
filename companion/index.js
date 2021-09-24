import { outbox } from "file-transfer";
import { Image } from "image";
import { device } from "peer";
import { settingsStorage } from "settings";
import jsQR from "jsqr";
import { MultiFormatReader, BarcodeFormat, DecodeHintType, RGBLuminanceSource, BinaryBitmap, HybridBinarizer, BrowserMultiFormatReader, BrowserQRCodeReader, QRCodeReader, HTMLCanvasElementLuminanceSource, loadWithRotation } from '@zxing/library';
import { BrowserCodeReader } from "@zxing/browser";
import JsBarcode from 'jsbarcode';

settingsStorage.setItem("screenWidth", device.screen.width);
settingsStorage.setItem("screenHeight", device.screen.height);

settingsStorage.onchange = function (evt) {
    if (evt.key === "background-image") {
        compressAndTransferImage(evt.newValue);
    }
};

function toGrayscaleBuffer(imageBuffer, width, height) {
    const grayscaleBuffer = new Uint8ClampedArray(width * height);
    for (let i = 0, j = 0, length = imageBuffer.length; i < length; i += 4, j++) {
        let gray;
        const alpha = imageBuffer[i + 3];
        // The color of fully-transparent pixels is irrelevant. They are often, technically, fully-transparent
        // black (0 alpha, and then 0 RGB). They are often used, of course as the "white" area in a
        // barcode image. Force any such pixel to be white:
        if (alpha === 0) {
            gray = 0xFF;
        } else {
            const pixelR = imageBuffer[i];
            const pixelG = imageBuffer[i + 1];
            const pixelB = imageBuffer[i + 2];
            // .299R + 0.587G + 0.114B (YUV/YIQ for PAL and NTSC),
            // (306*R) >> 10 is approximately equal to R*0.299, and so on.
            // 0x200 >> 10 is 0.5, it implements rounding.
            gray = (306 * pixelR + 601 * pixelG + 117 * pixelB + 0x200) >> 10;
        }
        grayscaleBuffer[j] = gray;
    }
    return grayscaleBuffer;
}

const compressAndTransferImage = async settingsValue => {
    const imageData = JSON.parse(settingsValue);
    const base64Image = imageData.imageUri.split(',')[1];
    //const uint8arr = b64toUint8ClampedArray(imageData.imageUri);
    try {
        const image = await Image.from(imageData.imageUri);

        const hints = new Map();
        //const formats = [BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX, BarcodeFormat.EAN_13];
        //hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
        hints.set(DecodeHintType.TRY_HARDER, true);
        //hints.set(DecodeHintType.ASSUME_GS1, true);
        const reader = new MultiFormatReader();
        reader.setHints(hints);

        JsBarcode(image.canvas, 'Coop', { format: 'pharmacode' });
        const base64Barcode = image.canvas.toDataURL();
        console.log(base64Barcode);
        image.drawingContext.drawImage(image.image, 0, 0);
        let rgba = image.drawingContext.getImageData(0, 0, image.width, image.height);
        const buf = await image.export("image/vnd.fitbit.txi");
        const file = await outbox.enqueue(`${Date.now()}.txi`, buf);
        console.log(`Enqueued ${file.name}`);
        console.log(rgba.data.length);

        //const grayScaleBuf = toGrayscaleBuffer(rgba.data, image.width, image.height);
        //console.log(grayScaleBuf.length);

        const len = image.width * image.height;

        const luminancesUint8Array = new Uint8ClampedArray(len);

        for (let i = 0; i < len; i++) {
            luminancesUint8Array[i] =
                ((rgba.data[i * 4] + rgba.data[i * 4 + 1] * 2 + rgba.data[i * 4 + 2]) /
                    4) & 0xff;
        }

        const luminanceSource = new RGBLuminanceSource(luminancesUint8Array, image.width, image.height);
        const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
        //reader.decode(binaryBitmap).then(res => console.log(res)).catch(err => console.log(err.message));
        const browserReader = new BrowserMultiFormatReader(hints);
        //const result = await browserReader.decodeFromImageUrl(imageData.imageUri);
        //const result = reader.decode(binaryBitmap);
        //console.log(result);

        const qr = jsQR(rgba.data, image.width, image.height);
        if (qr) {
            console.log('could decode the qr code');
            console.log(qr.version);
        } else {
            console.log('could not decode qr/bar code');
        }


    } catch (error) {
        console.log(error.message);
    }
}