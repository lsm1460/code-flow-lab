const { dialog, ipcMain } = require("electron");
const fs = require("fs");
const { 
  REQUEST_SAVE_PROJECT,
  SAVE_FILE,
} = require('../../consts/channel'); 

const saveProject = async (_web) => {
  const saveFile = _filePath => {
    _web.send(REQUEST_SAVE_PROJECT, null);

    ipcMain.on(SAVE_FILE, (event, _contents) => {
      console.log(_filePath, _contents);
      // TODO: 이미지와 json을 말아서 zip파일로 묶은 후 저장!

      // fs.writeFile(_filePath, contents, err => {
      //   if (err) {
      //     alert("An error ocurred saving the file :" + err.message);
      //     return;
      //   }
      //   console.log("saved");
      // });
    });
  };


  const { filePath, canceled } = await dialog.showSaveDialog();

  if (!canceled) {
    if (filePath) {
      saveFile(filePath);
    } else {
      console.log('no file name..');
    }
  }
};

module.exports = {
  saveProject
};