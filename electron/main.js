const electron = require('electron')
const { app, BrowserWindow, ipcMain, globalShortcut, Menu, shell } = electron
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process');

// Load environment variables
try {
  const envConfig = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8')
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      process.env[key.trim()] = value.trim()
    }
  })
} catch (err) {
  console.error('\x1b[31m%s\x1b[0m', `
╔════════════════════════ ERROR ════════════════════════╗
║                                                       ║
║   Missing .env file!                                 ║
║                                                       ║
║   Please create a .env file in the root directory    ║
║   You can copy the variables from .env.example       ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
`)
  process.exit(1)
}

const FirebaseManager = require('./firebase')
const http = require('http')

let mainWindow
let db
let httpServer

async function createWindow() {
  db = new FirebaseManager()
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#1e1e1e',
    icon: path.join(__dirname, '../public/jobs.ico'),
    frame: true,
    titleBarStyle: 'default',
    title: 'Application Tracker'
  })

  const menu = Menu.buildFromTemplate([])
  Menu.setApplicationMenu(menu)

  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    try {
      await mainWindow.loadURL('http://localhost:5173')
      mainWindow.webContents.openDevTools()
    } catch (e) {
      console.error('Failed to load dev server:', e)
    }
  } else {
    try {
      const indexPath = path.join(__dirname, '../dist/index.html')
      await mainWindow.loadFile(indexPath)
    } catch (e) {
      console.error('Failed to load production build:', e)
    }
  }

  globalShortcut.register('F9', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-counter')
    }
  })

  globalShortcut.register('CommandOrControl+Right', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-counter')
    }
  })
}

function startTemplateServer() {
  const serverPath = path.join(__dirname, '../public/templategen');
  httpServer = spawn('npx', ['http-server', serverPath, '-p', '8080', '--cors'], {
    stdio: 'inherit'
  });
}

ipcMain.on('update-counter', (event) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-counter')
  }
})

app.whenReady().then(() => {
  startTemplateServer();
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (httpServer) {
      httpServer.kill();
    }
    app.quit();
  }
})

ipcMain.handle('save-data', async (event, data) => {
  const { jobBoard, timestamp } = data
  const success = await db.addResponse(jobBoard, timestamp)
  if (success) {
    mainWindow.webContents.send('update-counter')
    return true
  }
  return false
})

ipcMain.handle('load-data', async () => {
  try {
    const data = await db.loadData()
    return data
  } catch (error) {
    console.error('Error loading data:', error)
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
    console.error('Error deleting response:', error)
    throw error
  }
})

ipcMain.handle('clear-store', async () => {
  try {
    await db.clearAllData()
    return { success: true }
  } catch (error) {
    console.error('Error clearing store:', error)
    throw error
  }
})

ipcMain.handle('update-counter', async () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-counter')
    return true
  }
  return false
})

ipcMain.handle('open-cover-letter-template', async () => {
  try {
    // Открываем шаблонизатор в браузере по умолчанию
    shell.openExternal('http://localhost:8080')
    return true
  } catch (error) {
    console.error('Error opening cover letter template:', error)
    return false
  }
})
