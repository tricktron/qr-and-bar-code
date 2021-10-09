/*import { outbox } from "file-transfer";
import { Image } from "image";
import { device } from "peer";
import { settingsStorage } from "settings";
import * as PS from "./qr-reader-lib-es6.js";

settingsStorage.setItem("screenWidth", device.screen.width.toString());
settingsStorage.setItem("screenHeight", device.screen.height.toString());

settingsStorage.onchange = handleStorageChange;

function handleStorageChange(event: StorageChangeEvent): string {
    if (event.key === "background-image" && event.newValue) {
        compressAndTransferImage(event.newValue);
        return "success";
    } else {
        return "failure"
    }
}

async function compressAndTransferImage(newImage: string): Promise<void> {
    console.log(PS);
    const imageData = JSON.parse(newImage);
    try {
        const image = await Image.from(imageData.imageUri);
        image.drawingContext.drawImage(image.image, 0, 0);
        const rgba = await image.drawingContext.getImageData(0, 0, image.width, image.height);
        const qrCode = PS.__reserved_default.scanQrCode(rgba.data)(image.width)(image.height);
        console.log(qrCode);
        const arrayBuf = new Uint8ClampedArray(qrCode.value0.value0.dataBuffer);
        const qrCodeImage = await Image.from(arrayBuf);
        const buf = await qrCodeImage.export("image/vnd.fitbit.txi");
        //const buf = await image.export("image/vnd.fitbit.txi");
        const file = await outbox.enqueue(`${Date.now()}.txi`, buf);
        console.log(`Enqueued ${file.name}`);
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.log(err.message);
        }
    }
}
*/