/* ============================================
   招聘信息聚合 - Electron preload 桥
   仅暴露受控的 IPC 调用（contextIsolation + sandbox 兼容）
   ============================================ */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  saveJobs: (jobs) => ipcRenderer.invoke('jobs:save', jobs),
  saveStatus: (statuses) => ipcRenderer.invoke('status:save', statuses),
  getInfo: () => ipcRenderer.invoke('desktop:info'),
});
