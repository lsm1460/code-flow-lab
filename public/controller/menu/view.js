const { ipcMain } = require('electron');
const {
  REQUEST_FULLSCREEN_ON,
  REQUEST_FULLSCREEN_OFF,
  REQUEST_PLAY,
  REQUEST_RESET_ZOOM,
  REQUEST_ZOOMIN,
  REQUEST_ZOOMOUT,
} = require('../../channel');

const onFullscreen = (_mainWindow) => {
  _mainWindow.setFullScreen(true);
};

const requestFullscreenOff = (_mainWindow) => {
  _mainWindow.webContents.send(REQUEST_FULLSCREEN_OFF);
};

const registViewChannel = (_mainWindow) => {
  ipcMain.on(REQUEST_FULLSCREEN_ON, () => {
    onFullscreen(_mainWindow);
  });
};

const requestPlay = (_mainWindow) => {
  _mainWindow.webContents.send(REQUEST_PLAY);
};

const requestResetZoom = (_mainWindow) => {
  _mainWindow.webContents.send(REQUEST_RESET_ZOOM);
};

const requestZoomin = (_mainWindow) => {
  _mainWindow.webContents.send(REQUEST_ZOOMIN);
};

const requestZoomout = (_mainWindow) => {
  _mainWindow.webContents.send(REQUEST_ZOOMOUT);
};

module.exports = {
  requestFullscreenOff,
  registViewChannel,
  requestPlay,
  requestResetZoom,
  requestZoomin,
  requestZoomout,
};
