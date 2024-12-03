const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  loadData: () => ipcRenderer.invoke('load-data'),
  onUpdateCounter: (callback) => {
    ipcRenderer.on('update-counter', callback)
    return () => ipcRenderer.removeListener('update-counter', callback)
  },
  openCoverLetterTemplate: () => ipcRenderer.invoke('open-cover-letter-template'),
  updateCounter: () => ipcRenderer.invoke('update-counter'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  deleteResponse: (id) => ipcRenderer.invoke('delete-response', id),
  clearTodayData: () => ipcRenderer.invoke('clear-today-data'),
  clearStore: () => ipcRenderer.invoke('clear-store')
})
