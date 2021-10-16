import { display } from "display";
import document from "document";
import { inbox } from "file-transfer";
import { existsSync } from "fs";
const QR_PATH = "/private/data/code1.txi";
const QR = document.getElementById("imageBackground") as ImageElement;

const loadQrCodes = () => {
    if (existsSync(QR_PATH)) {
        QR.href = QR_PATH;
    }
}

const processInboxQueue = () => {
    let fileName: string | undefined = undefined;
    while (fileName = inbox.nextFile()) {
        console.log(`/private/data/${fileName} is now available`);
        QR.href = `/private/data/${fileName}`;
        display.on = true;
    }
}

inbox.onnewfile = processInboxQueue;

loadQrCodes();
processInboxQueue();