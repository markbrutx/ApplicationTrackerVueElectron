const electron = require('electron')
const { app, BrowserWindow, ipcMain, globalShortcut, Menu, shell } = electron
const path = require('path')
const FirebaseManager = require('./firebase')
const http = require('http')
const fs = require('fs')

let mainWindow
let db

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
}

ipcMain.on('update-counter', (event) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-counter')
  }
})

app.whenReady().then(createWindow).catch(console.error)

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch(console.error)
  }
})

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('save-data', async (event, data) => {
  const { jobBoard, timestamp } = data
  return await db.addResponse(jobBoard, timestamp)
})

ipcMain.handle('load-data', async () => {
  return {
    responses: await db.getAllResponses(),
    jobBoards: await db.getAllJobBoards()
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
  await db.removeResponse(id)
  return await db.getAllResponses()
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

ipcMain.handle('open-cover-letter-template', async () => {
  const port = 3500
  const server = http.createServer((req, res) => {
    const templatePath = path.join(__dirname, '../public/templategen/index.html')
    fs.readFile(templatePath, (err, data) => {
      if (err) {
        res.writeHead(500)
        res.end('Error loading cover letter template')
        return
      }
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(data)
    })
  })

  server.listen(port, () => {
    shell.openExternal(`http://localhost:${port}`)
  })
})
