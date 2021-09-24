import { me } from "appbit";
import { display } from "display";
import document from "document";
import * as fs from "fs";
import { inbox } from "file-transfer";
const SETTINGS_FILE = "settings.cbor";
const SETTINGS_TYPE = "cbor";

const imageBackground = document.getElementById("imageBackground");

let mySettings;
loadSettings();
me.onunload = saveSettings;

inbox.onnewfile = () => {
  let fileName;
  do {
    fileName = inbox.nextFile();
    if (fileName) {
      if (mySettings.bg && mySettings.bg !== "") {
        fs.unlinkSync(mySettings.bg);
      }
      mySettings.bg = `/private/data/${fileName}`;
      applySettings();
    }
  } while (fileName);
};

function loadSettings() {
  try {
    mySettings = fs.readFileSync(SETTINGS_FILE, SETTINGS_TYPE);
  } catch (ex) {
    mySettings = {};
  }
  applySettings();
}

function saveSettings() {
  fs.writeFileSync(SETTINGS_FILE, mySettings, SETTINGS_TYPE);
}

function applySettings() {
  if (mySettings.bg) {
    imageBackground.image = mySettings.bg;
  }
  display.on = true;
}