import { outbox } from "file-transfer";
import { Image } from "image";
import { device } from "peer";
import { settingsStorage } from "settings";
import { scanQrCodeEff, createBase64PNGQrCode } from "../node_modules/qr-reader";

settingsStorage.setItem("screenWidth", device.screen.width.toString());
settingsStorage.setItem("screenHeight", device.screen.height.toString());

settingsStorage.onchange = (event: StorageChangeEvent) => {
    if (event.key === "background-image" && event.newValue) {
        compressAndTransferImage(event.newValue);
    }
}

const decodeQrCode = async (imageUri: String, imageSize: Image): Promise<Image> => {
    const decodedText = scanQrCodeEff(imageUri)();
    if (decodedText.value0.value0 === undefined) { // Left decodedText
        throw new Error(decodedText.value0);
    }
    // Right decodedText
    const base64QrCode = createBase64PNGQrCode(decodedText.value0.value0)(imageSize.width);
    return await Image.from(base64QrCode);
}

const compressAndTransferImage = async (settingsValue: string): Promise<void> => {
    const { imageUri, imageSize } = JSON.parse(settingsValue);
    try {
        const qrImage = await decodeQrCode(imageUri, imageSize);
        const buf = await qrImage.export("image/vnd.fitbit.txi");
        const file = await outbox.enqueue("code1.txi", buf);
        console.log(`Enqueued ${file.name}`);
    } catch (err) {
        err instanceof Error ? console.log(err.message) : console.log(err);
    }
}