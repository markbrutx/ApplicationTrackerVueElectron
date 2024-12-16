const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  clearTodayData: () => ipcRenderer.invoke('clear-today-data'),
  clearStore: () => ipcRenderer.invoke('clear-store'),
  
  addResponse: (response) => ipcRenderer.invoke('add-response', response),
  getResponses: () => ipcRenderer.invoke('get-responses'),
  deleteResponse: (id) => ipcRenderer.invoke('delete-response', id),
  
  addJobBoard: (name) => ipcRenderer.invoke('add-job-board', name),
  getJobBoards: () => ipcRenderer.invoke('get-job-boards'),
  deleteJobBoard: (id) => ipcRenderer.invoke('delete-job-board', id),
  
  openInBrowser: (url) => ipcRenderer.invoke('open-in-browser', url),
  openCoverLetterTemplate: () => ipcRenderer.invoke('open-cover-letter-template'),
  
  updateCounter: () => ipcRenderer.invoke('update-counter'),
  onUpdateCounter: (callback) => {
    ipcRenderer.on('update-counter', callback)
    return () => ipcRenderer.removeListener('update-counter', callback)
  },
  
  getCharacter: () => ipcRenderer.invoke('getCharacter'),
  saveCharacter: (character) => ipcRenderer.invoke('saveCharacter', character),
  checkCharacterStatus: () => ipcRenderer.invoke('checkCharacterStatus'),
  gainExperience: () => ipcRenderer.invoke('gainExperience'),
  onCharacterDied: (callback) => {
    ipcRenderer.on('character-died', callback)
    return () => ipcRenderer.removeListener('character-died', callback)
  },
  onXPGained: (callback) => {
    ipcRenderer.on('xp-gained', callback)
    return () => ipcRenderer.removeListener('xp-gained', callback)
  },
  
  toggleNotifications: (enabled) => ipcRenderer.send('toggle-notifications', enabled),
  
  send: (channel, data) => {
    let validChannels = [
      'toMain',
      'update-counter',
      'download'
    ]
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data)
    }
  },
  receive: (channel, func) => {
    let validChannels = [
      'fromMain',
      'update-counter'
    ]
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args))
    }
  }
})
