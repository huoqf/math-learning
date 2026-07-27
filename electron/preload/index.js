import { contextBridge } from 'electron';
// 安全地暴露有限的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
});
