const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

// Start Express server
function startServer() {
  console.log('Starting local server...');
  serverProcess = spawn('node', [path.join(__dirname, '../server/server.js')], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to start server:', err);
  });

  serverProcess.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

// Create the browser window
function createWindow() {
  console.log('Creating window...');
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, '../../public/icon.png'),
    show: false // Don't show until ready
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();
  });

  // Load the local server
  console.log('Loading http://localhost:3456');
  mainWindow.loadURL('http://localhost:3456');

  // Open DevTools automatically for debugging
  mainWindow.webContents.openDevTools();

  // Log any loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  console.log('App ready');
  startServer();
  
  // Wait a bit for server to start
  setTimeout(() => {
    createWindow();
  }, 3000); // Increased to 3 seconds

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  console.log('Quitting app, killing server...');
  // Kill server process
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on('will-quit', () => {
  console.log('App will quit');
});