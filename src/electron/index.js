const { app, BrowserWindow, screen, Menu, dialog, protocol, net } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { getMenuTemplate } = require('./menu');
const registeShortcut = require('./shortcutRegister');
const { removeProjectFile, checkSaved, saveProject, registSaveChannel } = require('./menu/file');
const CUSTOM_PROTOCOL = require('../consts/protocol');

let mainWindow;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 900,
    minHeight: 600,
    show: false,
    webPreferences: {
      enableRemoteModule: true,
      devTools: isDev,
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  global.isOpenDialog = false;
  global.projectPath = {
    path: '',
    fileName: '',
  };

  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const menuTemplate = getMenuTemplate(mainWindow);

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.setResizable(true);

  mainWindow.on('close', (_event) => {
    _event.preventDefault();

    checkSaved(mainWindow).then(async (_isSaved) => {
      if (_isSaved) {
        mainWindow.destroy();
      } else {
        const options = {
          type: 'question',
          buttons: ['Cancel', 'Yes', 'No'],
          title: 'Question',
          message: '종료하기 전 프로젝트를 저장하시겠습니까?',
          detail: '저장되지 않은 내용은 지워집니다.',
        };

        global.isOpenDialog = true;

        const { response } = await dialog.showMessageBox(null, options);

        global.isOpenDialog = false;

        if (response === 0) {
          // 취소
        } else if (response === 1) {
          // 저장 후 종료
          const res = await saveProject(mainWindow);
          console.log('saved..', res);
          mainWindow.destroy();
        } else if (response === 2) {
          // 그냥 종료
          mainWindow.destroy();
        }
      }
    });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;

    if (global.projectPath.path) {
      removeProjectFile();
    }
  });

  mainWindow.focus();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  registSaveChannel(mainWindow);
  registeShortcut(mainWindow);

  protocol.handle(
    CUSTOM_PROTOCOL,
    (_req) => net.fetch(`file://${new URL(_req.url).pathname}`),
    (error) => {
      if (error) console.error('프로토콜 등록 실패');
    }
  );
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
