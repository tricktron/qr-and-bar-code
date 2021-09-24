import { outbox } from "file-transfer";
import { Image } from "image";
import { device } from "peer";
import { settingsStorage } from "settings";

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
    const imageData = JSON.parse(newImage);
    try {
        const image = await Image.from(imageData.imageUri);
        const buf = await image.export("image/vnd.fitbit.txi");
        const file = await outbox.enqueue(`${Date.now()}.txi`, buf);
        console.log(`Enqueued ${file.name}`);
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.log(err.message);
        }
    }
}