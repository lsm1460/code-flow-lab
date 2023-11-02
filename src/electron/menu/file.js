const { dialog, ipcMain } = require('electron');
const fs = require('fs');
const JSZip = require('jszip');
const { REQUEST_SAVE_PROJECT, SAVE_FILE } = require('../../consts/channel');

const openProject = async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog();

  if (canceled) {
    return;
  }

  const _extension = filePaths[0].split('.').pop();

  if (_extension !== 'cdfl') {
    return;
  }

  const _pathArray = filePaths[0].split('/');
  _pathArray.pop();
  const _path = _pathArray.join('/');

  fs.readFile(_path, async (err, data) => {
    if (!err) {
      const zip = new JSZip();

      const contents = await zip.loadAsync(data);

      Object.keys(contents.files).forEach((filename) => {
        const content = zip.file(filename).async('nodebuffer');

        const dest = _path + filename;
        fs.writeFileSync(dest, content);
      });
    }
  });
};

const saveProject = async (_web) => {
  const saveFile = (_filePath) => {
    _web.send(REQUEST_SAVE_PROJECT, null);

    ipcMain.on(SAVE_FILE, async (event, _contents) => {
      // TODO: 이미지까지 묶은 후 저장!

      const zip = new JSZip();
      zip.file('data.json', JSON.stringify(_contents));

      const _buffer = await zip.generateAsync({ type: 'nodebuffer' });

      fs.writeFile(`${_filePath}.cdfl`, _buffer, (_err) => {
        if (_err) {
          console.log('make error..');
          //tasks to perform in case of error

          return;
        }

        // TODO: webd으로 저장 완료보내야 함
      });
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
  openProject,
  saveProject,
};
