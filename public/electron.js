const { app, BrowserWindow, screen } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
 
let mainWindow;
 
function createWindow() {
  const {width, height} = screen.getPrimaryDisplay().workAreaSize


  mainWindow = new BrowserWindow({
    width,
    height,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      devTools: isDev,
    },
  });
 
  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );
 
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
})
 
  mainWindow.setResizable(true);
  mainWindow.on("closed", () => (mainWindow = null));
  mainWindow.focus();
}
 
app.whenReady().then(() => {
  createWindow()
  app.on('activate', ()=> {
      if(BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
 
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
 
app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});