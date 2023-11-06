const { dialog, ipcMain } = require('electron');
const fs = require('fs');
const JSZip = require('jszip');
const { REQUEST_PROJECT, SAVE_FILE, SET_DOCUMENT, CREATE_DOCUMENT } = require('../../consts/channel');

const createProject = (_mainWindow) => {
  if (!global.isSaved) {
    dialog
      .showMessageBox(_mainWindow, {
        type: 'question',
        title: 'Confirmation',
        message: '변경 사항이 저장되지 않았습니다. \n새 프로젝트를 진행하시겠습니까? ',
        buttons: ['Yes', 'No'],
      })
      .then((result) => {
        if (result.response === 0) {
          global.projectPath = '';
          global.isSaved = true;

          _mainWindow.webContents.send(CREATE_DOCUMENT, null);
        }
      });

    return;
  }
};

const openProject = async (_mainWindow) => {
  const { canceled, filePaths } = await dialog.showOpenDialog();

  if (canceled) {
    return;
  }

  const _extension = filePaths[0].split('.').pop();

  if (_extension !== 'cdfl') {
    return;
  }

  const _pathArray = filePaths[0].split('/');
  const _fileName = _pathArray.pop().split('.')[0];

  _pathArray.push(`.${_fileName}`);
  const _path = _pathArray.join('/');

  fs.mkdir(_path, { recursive: true }, (err) => {
    if (err) throw err;
  });

  fs.readFile(filePaths[0], async (err, data) => {
    if (err) {
      throw err;
    }

    const zip = new JSZip();

    const contents = await zip.loadAsync(data);

    for (let filename in contents.files) {
      const zipFile = zip.file(filename);

      const dest = `${_path}/${filename}`;

      if (zipFile) {
        const content = await zipFile.async('nodebuffer');

        fs.writeFileSync(dest, content);
      } else {
        fs.mkdir(dest, { recursive: true }, (err) => {
          if (err) throw err;
        });
      }
    }

    const _documetn = JSON.parse(fs.readFileSync(`${_path}/data.json`, 'utf8'));

    global.projectPath = _path;
    _mainWindow.webContents.send(SET_DOCUMENT, { path: _path, document: _documetn });
  });
};

const saveProject = async (_mainWindow) => {
  const saveFile = (_filePath) => {
    _mainWindow.webContents.send(REQUEST_PROJECT, null);

    ipcMain.on(SAVE_FILE, async (event, _contents) => {
      // TODO: 이미지까지 묶은 후 저장!

      const zip = new JSZip();
      zip.file('data.json', JSON.stringify(_contents));

      zip.folder('images').file('hello.txt', 'Hello World\n');

      const _buffer = await zip.generateAsync({ type: 'nodebuffer' });

      fs.writeFile(`${_filePath}.cdfl`, _buffer, (_err) => {
        if (_err) {
          console.log('make error..');
          //tasks to perform in case of error

          return;
        }

        global.isSaved = true;
        global.projectPath = _filePath;
        // TODO: webd으로 저장 완료보내야 함
      });
    });
  };

  if (global.projectPath) {
    saveFile(global.projectPath);
  } else {
    dialog.showSaveDialog().then(({ filePath, canceled }) => {
      if (!canceled) {
        if (filePath) {
          saveFile(filePath);
        } else {
          console.log('no file name..');
        }
      }
    });
  }
};

module.exports = {
  createProject,
  openProject,
  saveProject,
};
