import { outbox } from "file-transfer";
import { Image } from "image";
import { device } from "peer";
import { settingsStorage } from "settings";
import * as PS from "./qr-reader-lib-es6.js";
import { encode, TXIOutputFormat } from "@fitbit/image-codec-txi";
import qrCodeGenerator from "qrcode-generator";

settingsStorage.setItem("screenWidth", device.screen.width);
settingsStorage.setItem("screenHeight", device.screen.height);

settingsStorage.onchange = function (evt) {
    if (evt.key === "background-image") {
        compressAndTransferImage(evt.newValue);
    }
};

const compressAndTransferImage = async settingsValue => {
    const imageData = JSON.parse(settingsValue);
    try {
        const image = await Image.from(imageData.imageUri);
        image.drawingContext.drawImage(image.image, 0, 0);
        const rgba = await image.drawingContext.getImageData(0, 0, image.width, image.height);
        const qrCode = PS.__reserved_default.scanQrCode(rgba.data)(image.width)(image.height);
        console.log(qrCode);
        const encodedText = qrCode.value0.value0.text;
        const qr = qrCodeGenerator(0, 'M');
        qr.addData(encodedText);
        qr.make();
        const moduleSize = qr.getModuleCount();
        const scaledModuleSize = 300 / (moduleSize + 8);
        const margin = 2 * scaledModuleSize;
        console.log("The module size is:", moduleSize);
        console.log("The scaled module size is:", scaledModuleSize);
        console.log("The margin is:", margin);
        //const base64QrImage = qr.createDataURL();
        const base64QrImage = qr.createDataURL(scaledModuleSize, 4 * scaledModuleSize);
        console.log(base64QrImage);
        const pngBase64Image = base64QrImage.replace("data:image/gif", "data:image/png");
        const qrImage = await Image.from(pngBase64Image);
        console.log(qrImage.width);
        //const buf = encode(qrCodeImage, { outputFormat: TXIOutputFormat.RGB565, rle: true });
        const buf = await qrImage.export("image/vnd.fitbit.txi");
        const file = await outbox.enqueue(`${Date.now()}.txi`, buf);
        console.log(`Enqueued ${file.name}`);
    } catch (error) {
        console.log(error);
        console.log(error.message);
    }
}