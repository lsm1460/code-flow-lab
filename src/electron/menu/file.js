const { dialog, ipcMain } = require('electron');
const fs = require('fs');
const JSZip = require('jszip');
const {
  REQUEST_PROJECT,
  SAVE_FILE,
  SET_DOCUMENT,
  CREATE_DOCUMENT,
  REQUEST_SAVED,
  CHECK_SAVED,
} = require('../../consts/channel');

const checkSaved = (_mainWindow) =>
  new Promise((resolve) => {
    ipcMain.once(CHECK_SAVED, async (event, _isSaved) => {
      resolve(_isSaved);
    });

    _mainWindow.webContents.send(REQUEST_SAVED, null);
  });

const removeProjectFile = () => {
  if (!global.projectPath.path) {
    return;
  }

  fs.rmSync(`${global.projectPath.path}/.${global.projectPath.fileName}`, { recursive: true, force: true });
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

const openProject = async (_mainWindow) => {
  if (global.isOpenDialog) {
    return;
  }

  global.isOpenDialog = true;

  const { canceled, filePaths } = await dialog.showOpenDialog();

  global.isOpenDialog = false;

  if (canceled) {
    return;
  }

  if (global.projectPath.path) {
    removeProjectFile();
  }

  const _extension = filePaths[0].split('.').pop();

  if (_extension !== 'cdfl') {
    return;
  }

  const _pathArray = filePaths[0].split('/');
  const _fileName = _pathArray.pop().split('.')[0];

  const clonedFolderPath = [..._pathArray, `.${_fileName}`];
  const _path = clonedFolderPath.join('/');

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

    global.projectPath = { path: _pathArray.join('/'), fileName: _fileName };

    console.log('is in open..', global.projectPath);
    _mainWindow.webContents.send(SET_DOCUMENT, _documetn);
  });
};

const saveProject = (_mainWindow) => {
  return new Promise((resolve, reject) => {
    if (global.isOpenDialog) {
      return;
    }

    const saveFile = (_filePath) => {
      _mainWindow.webContents.send(REQUEST_PROJECT, null);

      ipcMain.once(SAVE_FILE, async (event, _contents) => {
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

module.exports = {
  checkSaved,
  removeProjectFile,
  createProject,
  openProject,
  saveProject,
};
