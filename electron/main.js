const electron = require('electron')
const { app, BrowserWindow, ipcMain, globalShortcut, Menu, shell, dialog, Notification } = electron
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const os = require('os')
const notificationTemplates = require('./notificationTemplates')

const homeDir = os.homedir()
const logFile = path.join(homeDir, 'application-tracker-debug.log')

function logToFile(message) {
  const timestamp = new Date().toISOString()
  const logMessage = `${timestamp}: ${message}\n`
  try {
    fs.appendFileSync(logFile, logMessage)
  } catch (err) {
    console.error('Failed to write to log file:', err)
  }
}

process.on('uncaughtException', (error) => {
  logToFile(`CRASH ERROR: ${error.stack}`)
  console.error('Uncaught Exception:', error)
  dialog.showErrorBox(
    'Application Error',
    `Error: ${error.message}\nCheck log file at: ${logFile}`
  )
})

process.on('unhandledRejection', (reason) => {
  logToFile(`UNHANDLED REJECTION: ${reason}`)
  console.error('Unhandled Rejection:', reason)
})

logToFile('Application starting...')
logToFile(`Electron version: ${process.versions.electron}`)
logToFile(`Chrome version: ${process.versions.chrome}`)
logToFile(`Node version: ${process.versions.node}`)
logToFile(`Platform: ${process.platform}`)
logToFile(`Architecture: ${process.arch}`)
logToFile(`User home directory: ${homeDir}`)

let mainWindow
let db
let httpServer

let notificationsEnabled = true;

async function createWindow() {
  try {
    logToFile('Starting createWindow function')
    
    logToFile('Initializing FirebaseManager')
    db = new FirebaseManager()
    logToFile('FirebaseManager initialized')
    
    logToFile('Creating BrowserWindow')
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      backgroundColor: '#1e1e1e',
      show: false 
    })
    logToFile('BrowserWindow created')

    mainWindow.once('ready-to-show', () => {
      logToFile('Window ready to show')
      mainWindow.show()
    })

    const isDev = process.env.NODE_ENV === 'development'
    logToFile(`Running in ${isDev ? 'development' : 'production'} mode`)

    if (isDev) {
      try {
        logToFile('Attempting to load dev server at http://localhost:5173')
        await mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools()
        logToFile('Dev server loaded successfully')
      } catch (e) {
        logToFile(`Failed to load dev server: ${e.stack}`)
        throw e
      }
    } else {
      try {
        const indexPath = path.join(__dirname, '../dist/index.html')
        logToFile(`Attempting to load production build from: ${indexPath}`)
        
        if (!fs.existsSync(indexPath)) {
          const error = new Error(`index.html not found at: ${indexPath}`)
          logToFile(error.message)
          throw error
        }

        logToFile('Loading index.html')
        await mainWindow.loadFile(indexPath)
        logToFile('index.html loaded successfully')
      } catch (e) {
        logToFile(`Failed to load production build: ${e.stack}`)
        throw e
      }
    }

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      logToFile(`Page failed to load: ${errorDescription} (${errorCode})`)
    })

    mainWindow.webContents.on('did-finish-load', () => {
      logToFile('Page finished loading')
    })

    mainWindow.webContents.on('crashed', (event) => {
      logToFile('WebContents crashed')
    })

    mainWindow.on('unresponsive', () => {
      logToFile('Window became unresponsive')
    })

    mainWindow.on('closed', () => {
      logToFile('Window closed')
      mainWindow = null
    })

  } catch (error) {
    logToFile(`Critical error in createWindow: ${error.stack}`)
    throw error
  }
}

app.on('ready', async () => {
  logToFile('App ready event fired')
  try {
    await createWindow()
    logToFile('Window created successfully')
    
    globalShortcut.register('F9', () => {
      if (mainWindow) {
        mainWindow.webContents.send('update-counter')
        
        if (notificationsEnabled) {
          const notification = new Notification({
            title: notificationTemplates.getRandomTitle(),
            body: notificationTemplates.getRandomMessage(),
            icon: path.join(__dirname, '../public/', process.platform === 'darwin' ? 'apptr.icns' : 'apptr.ico'),
            silent: false
          })
          notification.show()
        }
      }
    })
    logToFile('F9 hotkey registered')
  } catch (error) {
    logToFile(`Error during app startup: ${error.stack}`)
    dialog.showErrorBox(
      'Application Error',
      `Failed to start: ${error.message}\nCheck log file at: ${logFile}`
    )
    app.quit()
  }
})

app.on('window-all-closed', () => {
  logToFile('All windows closed')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  logToFile('App activated')
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('quit', () => {
  logToFile('App quitting')
  globalShortcut.unregisterAll()
  logToFile('Hotkeys unregistered')
})

const FirebaseManager = require('./firebase')
const http = require('http')

async function startTemplateServer() {
  logToFile('Starting template server...');
  
  let serverPath;
  if (process.env.NODE_ENV === 'development') {
    serverPath = path.join(__dirname, '../public/templategen');
  } else {
    serverPath = path.join(process.resourcesPath, 'public/templategen');
  }
  
  logToFile(`Template server path: ${serverPath}`);
  
  if (!fs.existsSync(serverPath)) {
    logToFile(`Template directory not found: ${serverPath}`);
    dialog.showErrorBox(
      'Template Error',
      `Template directory not found at: ${serverPath}`
    );
    return;
  }

  const server = http.createServer((req, res) => {
    const filePath = path.join(serverPath, req.url === '/' ? 'index.html' : req.url);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('File not found');
        return;
      }

      const ext = path.extname(filePath);
      const contentType = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
      }[ext] || 'text/plain';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });

  server.listen(8080, () => {
    logToFile('Template server started on port 8080');
  });

  httpServer = server;
}

ipcMain.handle('update-counter', (event) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-counter')
  }
})

ipcMain.handle('save-data', async (event, data) => {
  const { jobBoard, timestamp } = data
  const success = await db.addResponse(jobBoard, timestamp)
  if (success) {
    const data = await db.loadData()
    mainWindow.webContents.send('update-counter')
    return data
  }
  return null
})

ipcMain.handle('load-data', async () => {
  try {
    const data = await db.loadData()
    return data
  } catch (error) {
    logToFile('Error loading data:', error)
    return null
  }
})

ipcMain.handle('clear-today-data', async () => {
  await db.clearTodayData()
  return {
    responses: await db.getAllResponses(),
    jobBoards: await db.getAllJobBoards()
  }
})

ipcMain.handle('delete-response', async (event, id) => {
  try {
    await db.removeResponse(id)
    const data = await db.loadData()
    return data
  } catch (error) {
    logToFile('Error deleting response:', error)
    throw error
  }
})

ipcMain.handle('clear-store', async () => {
  try {
    await db.clearAllData()
    return { success: true }
  } catch (error) {
    logToFile('Error clearing store:', error)
    throw error
  }
})

ipcMain.handle('open-cover-letter-template', async () => {
  try {
    shell.openExternal('http://localhost:8080')
    return true
  } catch (error) {
    logToFile('Error opening cover letter template:', error)
    return false
  }
})

ipcMain.handle('open-in-browser', async (event, url) => {
  await shell.openExternal(url)
})

ipcMain.on('toggle-notifications', (event, enabled) => {
  notificationsEnabled = enabled;
})

app.on('ready', () => {
  startTemplateServer();
})
