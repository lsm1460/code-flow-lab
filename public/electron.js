const { app, BrowserWindow, screen, Menu, dialog, protocol, net, globalShortcut } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { getMenuTemplate, registWindowChannelFunc } = require('./controller/menu');
const registViwerChannelFunc = require('./controller/viewerRegister');
const registShortcut = require('./controller/shortcutRegister');
const {
  removeProjectFile,
  checkSaved,
  saveProject,
  registFileChannel,
  openProject,
} = require('./controller/menu/file');
const { requestFullscreenOff, registViewChannel } = require('./controller/menu/view');
const registRightClick = require('./controller/rightClickRegister');

let preloadPath;

function createWindow(_preloadPath) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 900,
    minHeight: 600,
    show: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 10, y: 16 },
    webPreferences: {
      enableRemoteModule: true,
      devTools: isDev,
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, './preload.js'),
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

    if (_preloadPath || preloadPath) {
      openProject(mainWindow, _preloadPath || preloadPath);

      preloadPath = null;
    }
  });

  const menuTemplate = getMenuTemplate(mainWindow, app);

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.setResizable(true);

  mainWindow.on('close', (_event) => {
    _event.preventDefault();

    checkSaved(mainWindow).then(async (_isSaved) => {
      if (_isSaved) {
        if (mainWindow) {
          mainWindow.hide();
          mainWindow.destroy();
          mainWindow = null;
        } else {
          app.exit();
        }
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
          mainWindow.hide();
          mainWindow.destroy();
          mainWindow = null;
        } else if (response === 2) {
          // 그냥 종료
          mainWindow.hide();
          mainWindow.destroy();
          mainWindow = null;
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

  mainWindow.on('leave-full-screen', () => {
    requestFullscreenOff(mainWindow);
  });

  registWindowChannelFunc(mainWindow);
  registFileChannel(mainWindow);
  registViewChannel(mainWindow);
  registViwerChannelFunc(mainWindow);
  registShortcut(mainWindow);
  registRightClick(mainWindow);

  globalShortcut.register('CommandOrControl+Q', () => {
    app.exit();
  });

  mainWindow.focus();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log('test...2');

      createWindow();
    }
  });

  protocol.handle(
    'local',
    (_req) => net.fetch(`file://${new URL(_req.url).pathname}`),
    (error) => {
      if (error) console.error('프로토콜 등록 실패');
    }
  );
});

app.on('open-file', (_event, _path) => {
  _event.preventDefault();

  if (BrowserWindow.getAllWindows().length === 0) {
    preloadPath = _path;
  } else {
    createWindow(_path);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
