const { app, BrowserWindow, screen, Menu, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { getMenuTemplate } = require('./menu');
const registeShortcut = require('./shortcutRegister');
const { SET_SAVED, GET_SAVED } = require('../consts/channel');

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

  global.isSaved = true;
  global.projectPath = '';

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
    if (!global.isSaved) {
      _event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.focus();

  ipcMain.on(SET_SAVED, (event) => {
    global.isSaved = false;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  registeShortcut(mainWindow);
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
