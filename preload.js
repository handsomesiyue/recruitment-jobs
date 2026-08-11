/* ============================================
   招聘信息聚合 - Electron preload 桥
   仅暴露受控的 IPC 调用（contextIsolation + sandbox 兼容）
   ============================================ */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  saveJobs: (jobs) => ipcRenderer.invoke('jobs:save', jobs),
  saveStatus: (statuses) => ipcRenderer.invoke('status:save', statuses),
  getInfo: () => ipcRenderer.invoke('desktop:info'),
  // AI 助手（OpenAI 兼容接口）
  aiGetConfig: () => ipcRenderer.invoke('ai:get-config'),
  aiSetConfig: (cfg) => ipcRenderer.invoke('ai:set-config', cfg),
  aiParse: (payload) => ipcRenderer.invoke('ai:parse', payload),
});
