const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  startBulkDownload: () => ipcRenderer.invoke('start-bulk-download'),
  
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, data) => callback(data));
  },
  
  onDownloadComplete: (callback) => {
    ipcRenderer.on('download-complete', (event, data) => callback(data));
  },
  
  onDownloadError: (callback) => {
    ipcRenderer.on('download-error', (event, data) => callback(data));
  },
  
  sendDownloadProgress: (data) => {
    ipcRenderer.send('download-progress', data);
  },
  
  sendDownloadComplete: (data) => {
    ipcRenderer.send('download-complete', data);
  },
  
  sendDownloadError: (data) => {
    ipcRenderer.send('download-error', data);
  }
});

console.log('Preload script loaded successfully');