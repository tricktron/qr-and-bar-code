import { outbox } from "file-transfer";
import { Image } from "image";
import { device } from "peer";
import { settingsStorage } from "settings";

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
        const buf = await image.export("image/vnd.fitbit.txi");
        const file = await outbox.enqueue(`${Date.now()}.txi`, buf);
        console.log(`Enqueued ${file.name}`);
    } catch (error) {
        console.log(error.message);
    }
}