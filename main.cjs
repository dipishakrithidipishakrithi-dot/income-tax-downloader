const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');
const os = require('os');

let mainWindow;

// Disable sandbox to allow preload execution
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: false // CRITICAL: Disabled to allow preload execution
    }
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, 'ui.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createMenu();
};

const createMenu = () => {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

app.on('ready', createWindow);

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

// IPC: Start bulk download
ipcMain.handle('start-bulk-download', async (event) => {
  try {
    const downloadsDir = path.join(
      os.homedir(),
      'Downloads',
      'IncomeTax_Files'
    );

    // Create directory if it doesn't exist
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    return {
      success: true,
      downloadsDir: downloadsDir,
      message: 'Download directory ready'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// IPC: Update progress (received from renderer)
ipcMain.on('download-progress', (event, data) => {
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', data);
  }
});

// IPC: Log download completion
ipcMain.on('download-complete', (event, data) => {
  console.log('Download completed:', data);
  if (mainWindow) {
    mainWindow.webContents.send('download-complete', data);
  }
});

// IPC: Handle download errors
ipcMain.on('download-error', (event, data) => {
  console.error('Download error:', data);
  if (mainWindow) {
    mainWindow.webContents.send('download-error', data);
  }
});

console.log('Main process initialized');