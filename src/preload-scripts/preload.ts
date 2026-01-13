// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// 定义IPC通信接口
export interface IpcApi {
  // 文件操作
  selectMkvFile: () => Promise<string | null>;
  saveMkvFile: (defaultPath: string) => Promise<string | null>;
  
  // FFmpeg操作
  downloadFFmpeg: () => Promise<string>;
  exportMetadata: (inputPath: string) => Promise<string>;
  importMetadata: (inputPath: string, metadataPath: string, outputPath: string) => Promise<boolean>;
  
  // 文件内容操作
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;
  deleteFile: (filePath: string) => Promise<boolean>;
  
  // 元数据操作
  parseMetadata: (metadataPath: string) => Promise<any[]>;
  updateMetadata: (originalMetadataPath: string, chapters: any[]) => Promise<string>;
}

// 暴露API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  selectMkvFile: () => ipcRenderer.invoke('select-mkv-file'),
  saveMkvFile: (defaultPath: string) => ipcRenderer.invoke('save-mkv-file', defaultPath),
  
  // FFmpeg操作
  downloadFFmpeg: () => ipcRenderer.invoke('download-ffmpeg'),
  exportMetadata: (inputPath: string) => ipcRenderer.invoke('export-metadata', inputPath),
  importMetadata: (inputPath: string, metadataPath: string, outputPath: string) => 
    ipcRenderer.invoke('import-metadata', inputPath, metadataPath, outputPath),
  
  // 文件内容操作
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
  deleteFile: (filePath: string) => ipcRenderer.invoke('delete-file', filePath),
  
  // 元数据操作
  parseMetadata: (metadataPath: string) => ipcRenderer.invoke('parse-metadata', metadataPath),
  updateMetadata: (originalMetadataPath: string, chapters: any[]) => ipcRenderer.invoke('update-metadata', originalMetadataPath, chapters),
});

// 暴露ipcRenderer的部分方法用于接收事件
contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.on(channel, listener);
  },
  off: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => {
    ipcRenderer.off(channel, listener);
  },
});

