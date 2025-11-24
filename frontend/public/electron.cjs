const { app, BrowserWindow } = require('electron');
const path = require('path');
const process = require('process');

// __filename and __dirname are available in CommonJS (.cjs) modules, so no need to derive them.

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (!app.isPackaged) {
    // Load React App (dev)
    win.loadURL("http://localhost:5173");

    // Uncomment this if you want devtools:
    // win.webContents.openDevTools();
  } else {
    // Load React App (production)
    win.loadFile(path.join(__dirname, "/frontend/dist/index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});