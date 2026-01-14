import { BrowserWindow } from 'electron';
import { registerFileHandlers } from './fileHandlers';
import { registerFFmpegDownloadHandlers } from './ffmpegDownloadHandlers';
import { registerMKVHandlers } from './mkvHandlers';
import { registerMetadataHandlers } from './metadataHandlers';

/**
 * 注册所有 IPC 处理程序
 * @param mainWindow 主窗口对象，用于文件对话框、进度通知等
 */
export function registerAllIpcHandlers(mainWindow: BrowserWindow) {
  // 注册文件操作相关的 IPC 处理程序
  registerFileHandlers(mainWindow);
  
  // 注册 FFmpeg 下载相关的 IPC 处理程序
  registerFFmpegDownloadHandlers(mainWindow);
  
  // 注册 MKV 处理相关的 IPC 处理程序
  registerMKVHandlers(mainWindow);
  
  // 注册元数据处理相关的 IPC 处理程序
  registerMetadataHandlers();
}
