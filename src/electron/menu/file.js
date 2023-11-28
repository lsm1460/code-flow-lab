const { dialog, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const sharp = require('sharp');
const _ = require('lodash');
const {
  REQUEST_PROJECT,
  SAVE_FILE,
  SET_DOCUMENT,
  CREATE_DOCUMENT,
  REQUEST_SAVE_STATE,
  CHECK_SAVED,
  REQUEST_SAVE,
  OPEN_PROJECT,
} = require('../../consts/channel');

const checkSaved = (_mainWindow) =>
  new Promise((resolve) => {
    ipcMain.once(CHECK_SAVED, async (event, _isSaved) => {
      resolve(_isSaved);
    });

    _mainWindow.webContents.send(REQUEST_SAVE_STATE, null);
  });

const removeProjectFile = () => {
  if (!global.projectPath.path) {
    return;
  }

  fs.rmSync(`${global.projectPath.path}/.${global.projectPath.fileName}`, { recursive: true, force: true });

  global.projectPath = {
    path: '',
    fileName: '',
  };
};

const createProject = async (_mainWindow) => {
  if (global.isOpenDialog) {
    return;
  }

  const isSaved = await checkSaved(_mainWindow);

  let resetFlag = true;

  if (!isSaved) {
    const options = {
      type: 'question',
      buttons: ['Cancel', 'Yes'],
      title: 'Question',
      message: '새 프로젝트를 생성하시겠습니까?',
      detail: '저장되지 않은 내용은 지워집니다.',
    };

    global.isOpenDialog = true;

    const { response } = await dialog.showMessageBox(null, options);

    global.isOpenDialog = false;

    if (response === 0) {
      resetFlag = false;
    }
  }

  if (resetFlag) {
    _mainWindow.webContents.send(CREATE_DOCUMENT, null);

    if (global.projectPath.path) {
      removeProjectFile();
    }
  }
};

const openProject = async (_mainWindow, _filePath) => {
  if (global.isOpenDialog) {
    return;
  }

  const isSaved = await checkSaved(_mainWindow);

  if (!isSaved) {
    const options = {
      type: 'question',
      buttons: ['Cancel', 'Yes'],
      title: 'Question',
      message: '다른 프로젝트를 불러오시겠습니까?',
      detail: '저장되지 않은 내용은 지워집니다.',
    };

    global.isOpenDialog = true;

    const { response } = await dialog.showMessageBox(null, options);

    global.isOpenDialog = false;

    if (response === 0) {
      return;
    }
  }

  if (!_filePath) {
    global.isOpenDialog = true;

    const { canceled, filePaths } = await dialog.showOpenDialog({ filters: [{ name: 'all', extensions: ['cdfl'] }] });

    global.isOpenDialog = false;

    if (canceled) {
      return;
    }

    _filePath = filePaths[0];
  }

  if (global.projectPath.path) {
    removeProjectFile();
  }

  const _extension = _filePath.split('.').pop();

  if (_extension !== 'cdfl') {
    return;
  }

  const _pathArray = _filePath.split('/');
  const _fileName = _pathArray.pop().split('.')[0];

  const clonedFolderPath = [..._pathArray, `.${_fileName}`];
  const _path = clonedFolderPath.join('/');

  fs.mkdir(_path, { recursive: true }, (err) => {
    if (err) throw err;
  });

  fs.readFile(_filePath, async (err, data) => {
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

    let _document = JSON.parse(fs.readFileSync(`${_path}/data.json`, 'utf8'));
    _document = {
      ..._document,
      items: {
        ..._document.items,
        ..._.chain(_document.items)
          .pickBy((_item) => _item.elType === 'image' && _item.src)
          .mapValues((_item) => {
            const _imgName = path.basename(_item.src);

            return { ..._item, src: `${_path}/images/${_imgName}` };
          })
          .value(),
      },
    };

    global.projectPath = { path: _pathArray.join('/'), fileName: _fileName };

    _mainWindow.webContents.send(SET_DOCUMENT, _document);
  });
};

const saveProject = (_mainWindow) => {
  return new Promise((resolve, reject) => {
    if (global.isOpenDialog) {
      return;
    }

    const saveFile = async (_filePath) => {
      _mainWindow.webContents.send(REQUEST_PROJECT, null);

      ipcMain.once(SAVE_FILE, async (event, _contents) => {
        const zip = new JSZip();
        zip.file('data.json', JSON.stringify(_contents));

        const imageFolder = zip.folder('images');
        const _imgItemList = Object.values(_contents.items).filter((_item) => _item.elType === 'image' && _item.src);

        for (let _item of _imgItemList) {
          const _imgFileName = path.basename(_item.src);

          let _imgBuffer = fs.readFileSync(_item.src);

          _imgBuffer = await sharp(_imgBuffer, { failOn: 'truncated' })
            .resize({ width: 500, withoutEnlargement: true })
            .toBuffer();

          imageFolder.file(_imgFileName, _imgBuffer, { binary: true });
        }

        const _buffer = await zip.generateAsync({ type: 'nodebuffer' });

        fs.writeFile(`${_filePath}.cdfl`, _buffer, (_err) => {
          if (_err) {
            console.log('make error..');
            //tasks to perform in case of error

            return;
          }

          const _pathArray = _filePath.split('/');
          const fileName = _pathArray.pop();

          global.projectPath = {
            path: _pathArray.join('/'),
            fileName,
          };

          resolve(true);
        });
      });
    };

    if (global.projectPath.path) {
      saveFile(`${global.projectPath.path}/${global.projectPath.fileName}`);
    } else {
      global.isOpenDialog = true;

      dialog.showSaveDialog().then(({ filePath, canceled }) => {
        global.isOpenDialog = false;

        if (!canceled) {
          if (filePath) {
            saveFile(filePath);
          } else {
            reject('no file name..');
          }
        }
      });
    }
  });
};

const closeWindow = (_mainWindow) => {
  _mainWindow.close();
};

const registFileChannel = (_mainWindow) => {
  ipcMain.on(REQUEST_SAVE, () => {
    saveProject(_mainWindow);
  });

  ipcMain.on(OPEN_PROJECT, (_event, _path) => {
    openProject(_mainWindow, _path);
  });
};

module.exports = {
  checkSaved,
  removeProjectFile,
  createProject,
  openProject,
  saveProject,
  registFileChannel,
  closeWindow,
};
