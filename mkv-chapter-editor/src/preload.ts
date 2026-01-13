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
});

