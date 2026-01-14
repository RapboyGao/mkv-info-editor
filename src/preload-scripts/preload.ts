// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { ChapterData, MkvFileData } from '../shared'; // 使用index.ts导出

// 定义IPC通信接口
export interface IpcApi {
  // 文件操作
  selectMkvFile: () => Promise<string | null>;
  saveMkvFile: (defaultPath: string) => Promise<string | null>;
  
  // FFmpeg操作
  downloadFFmpeg: () => Promise<string>;
  exportMetadata: (inputPath: string) => Promise<string>;
  importMetadata: (inputPath: string, metadataPath: string, outputPath: string) => Promise<boolean>;
  getMkvDuration: (filePath: string) => Promise<number>;
  getMkvFileInfo: (filePath: string) => Promise<MkvFileData>;
  generateMkvFile: (inputPath: string, mkvFileData: string, outputPath: string) => Promise<boolean>;
  
  // 文件内容操作
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;
  deleteFile: (filePath: string) => Promise<boolean>;
  
  // 元数据操作
  updateMetadata: (originalMetadataPath: string, chapters: ChapterData[]) => Promise<string>;
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
  getMkvDuration: (filePath: string) => ipcRenderer.invoke('get-mkv-duration', filePath),
  getMkvFileInfo: (filePath: string) => ipcRenderer.invoke('get-mkv-file-info', filePath),
  generateMkvFile: (inputPath: string, mkvFileData: MkvFileData, outputPath: string) => 
    ipcRenderer.invoke('generate-mkv-file', inputPath, mkvFileData, outputPath),
  
  // 文件内容操作
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
  deleteFile: (filePath: string) => ipcRenderer.invoke('delete-file', filePath),
  
  // 元数据操作
  updateMetadata: (originalMetadataPath: string, chapters: ChapterData[]) => ipcRenderer.invoke('update-metadata', originalMetadataPath, chapters),
});

// 暴露ipcRenderer的部分方法用于接收事件
contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) => {
    ipcRenderer.on(channel, listener);
  },
  off: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) => {
    ipcRenderer.off(channel, listener);
  },
});

