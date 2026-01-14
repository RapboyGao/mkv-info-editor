import { BrowserWindow, ipcMain } from 'electron';
import { downloadFFmpeg } from '../utils/ffmpegDownloader';

/**
 * 注册 FFmpeg 下载相关的 IPC 处理程序
 * @param mainWindow 主窗口对象，用于下载进度通知
 */
export function registerFFmpegDownloadHandlers(mainWindow: BrowserWindow) {
  // 下载FFmpeg
  ipcMain.handle('download-ffmpeg', async () => {
    if (!mainWindow) throw new Error('Main window not available');

    const ffmpegPath = await downloadFFmpeg(mainWindow);
    return ffmpegPath;
  });
}
