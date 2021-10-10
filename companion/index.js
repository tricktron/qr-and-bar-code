import { outbox } from "file-transfer";
import { Image } from "image";
import { device } from "peer";
import { settingsStorage } from "settings";
import { scanQrCode, createBase64PNGQrCode  } from "../node_modules/qr-reader";

settingsStorage.setItem("screenWidth", device.screen.width);
settingsStorage.setItem("screenHeight", device.screen.height);

settingsStorage.onchange = function (evt) {
    if (evt.key === "background-image") {
        compressAndTransferImage(evt.newValue);
    }
};

async function decodeQrCode(imageUri) {
    const image = await Image.from(imageUri);
    image.drawingContext.drawImage(image.image, 0, 0);
    const rgba = await image.drawingContext.getImageData(0, 0, image.width, image.height);
    const decodedText = scanQrCode(rgba.data)(image.width)(image.height).value0.value0;
    const base64QrCode = createBase64PNGQrCode(decodedText)(image.width);
    return await Image.from(base64QrCode);
}

const compressAndTransferImage = async settingsValue => {
    const imageData = JSON.parse(settingsValue);
    try {
        const qrImage = await decodeQrCode(imageData.imageUri);
        const buf = await qrImage.export("image/vnd.fitbit.txi");
        const file = await outbox.enqueue(`${Date.now()}.txi`, buf);
        console.log(`Enqueued ${file.name}`);
    } catch (error) {
        console.log(error.message);
    }
}