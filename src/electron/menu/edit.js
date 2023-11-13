const { clipboard, ipcMain } = require('electron');
const CryptoJS = require('crypto-js');
const {
  REQUEST_UNDO,
  REQUEST_REDO,
  REQUEST_CUT,
  SEND_CUT_OBJECTS,
  REQUEST_COPY,
  SEND_COPY_OBJECTS,
  REQUEST_PASTE,
} = require('../../consts/channel');

const requestUndo = (_mainWindow) => {
  _mainWindow.webContents.send(REQUEST_UNDO);
};

const requestRedo = (_mainWindow) => {
  _mainWindow.webContents.send(REQUEST_REDO);
};

const openCopyObjectChannel = () => {
  ipcMain.once(SEND_COPY_OBJECTS, async (event, _objects) => {
    const cipherText = CryptoJS.AES.encrypt(
      JSON.stringify({ ..._objects, 'copy-by': 'code-flow-lab' }),
      process.env.PRIVATE_KEY
    ).toString();

    clipboard.writeText(cipherText);
  });
};

const requestCut = (_mainWindow) => {
  _mainWindow.webContents.send(REQUEST_CUT);

  openCopyObjectChannel();
};

const requestCopy = (_mainWindow) => {
  _mainWindow.webContents.send(REQUEST_COPY);

  openCopyObjectChannel();
};

const requestPaste = (_mainWindow) => {
  try {
    let clipText = clipboard.readText();
    clipText = CryptoJS.AES.decrypt(clipText, process.env.PRIVATE_KEY).toString(CryptoJS.enc.Utf8);

    const objects = JSON.parse(clipText);

    if (objects['copy-by'] !== 'code-flow-lab') {
      throw new Error('not code flow lab objects');
    }

    delete objects['copy-by'];

    _mainWindow.webContents.send(REQUEST_PASTE, objects);
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  requestUndo,
  requestRedo,
  requestCut,
  requestCopy,
  requestPaste,
};