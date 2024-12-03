const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  updateCounter: () => ipcRenderer.send('update-counter'),
  onUpdateCounter: (callback) => ipcRenderer.on('update-counter', callback),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadData: () => ipcRenderer.invoke('load-data'),
  clearTodayData: () => ipcRenderer.invoke('clear-today-data'),
  deleteResponse: (id) => ipcRenderer.invoke('delete-response', id),
  openCoverLetterTemplate: () => ipcRenderer.invoke('open-cover-letter-template')
})
