const { app, BrowserWindow, screen, Menu, dialog, protocol, net, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { getMenuTemplate, registWindowChannelFunc } = require('./controller/menu');
const registViwerChannelFunc = require('./controller/viewerRegister');
const registShortcut = require('./controller/shortcutRegister');
const { removeProjectFile, saveProject, registFileChannel, openProject } = require('./controller/menu/file');
const { requestFullscreenOff, registViewChannel } = require('./controller/menu/view');
const registRightClick = require('./controller/rightClickRegister');
const channel = require('./channel');

const gotTheLock = app.requestSingleInstanceLock();

let preloadPath;

function createWindow(_preloadPath) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  let mainWindow = new BrowserWindow({
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
  global.isSaved = {
    ...(global.isSaved || {}),
    [mainWindow.id]: true,
  };

  global.projectPath = {
    ...(global.projectPath || {}),
    [mainWindow.id]: {
      path: '',
      fileName: '',
    },
  };

  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.webContents.send(channel.SET_BROWSER_ID, mainWindow.id);

    if (_preloadPath || preloadPath) {
      openProject(mainWindow, _preloadPath || preloadPath);

      preloadPath = null;
    }
  });

  const menuTemplate = getMenuTemplate(mainWindow);

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.setResizable(true);

  mainWindow.on('close', (_event) => {
    if (!global.isSaved[mainWindow.id]) {
      const options = {
        type: 'question',
        buttons: ['Cancel', 'Yes'],
        title: 'Question',
        message: '종료하시겠습니까?',
        detail: '저장되지 않은 내용은 지워집니다.',
      };

      global.isOpenDialog = true;

      dialog.showMessageBox(null, options).then(({ response }) => {
        global.isOpenDialog = false;
        if (response === 0) {
          // 취소
          _event.preventDefault();
        }
      });
    }
  });

  mainWindow.on('closed', () => {
    delete global.isSaved[mainWindow.id];

    Object.values(channel).forEach((_channelVal) => {
      ipcMain.removeAllListeners(`${mainWindow.id}:${_channelVal}`);
    });

    if (global.projectPath[mainWindow.id]?.path) {
      removeProjectFile(mainWindow.id);
    }

    mainWindow = null;
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

app.on('open-file', (_event, _path) => {
  _event.preventDefault();

  if (BrowserWindow.getAllWindows().length === 0) {
    preloadPath = _path;
  } else {
    createWindow(_path);
  }
});

const dockMenu = Menu.buildFromTemplate([
  {
    label: 'New Window',
    click: () => createWindow(),
  },
]);

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (process.platform !== 'darwin') {
      // window open project..
    }
  });

  app.whenReady().then(() => {
    if (process.platform === 'darwin') {
      app.dock.setMenu(dockMenu);
    }

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
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
}

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
