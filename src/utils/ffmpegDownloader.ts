import { app } from 'electron';
import { download } from 'electron-dl';
import fs from 'fs-extra';
import path from 'path';

// FFmpeg下载镜像地址
export const FFMPEG_MIRROR_BASE_URL = 'https://registry.npmmirror.com/binary.html?path=ffmpeg-static/b6.1.1/';

// 根据平台获取对应的ffmpeg文件名
const getFFmpegFilename = (): string => {
  const platform = process.platform;
  const arch = process.arch;
  
  let filename = 'ffmpeg-';
  
  switch (platform) {
    case 'darwin':
      filename += arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64';
      break;
    case 'win32':
      filename += 'win32-x64.exe';
      break;
    case 'linux':
      if (arch === 'arm') {
        filename += 'linux-arm';
      } else if (arch === 'arm64') {
        filename += 'linux-arm64';
      } else if (arch === 'ia32') {
        filename += 'linux-ia32';
      } else {
        filename += 'linux-x64';
      }
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
  
  return filename;
};

// 获取FFmpeg下载URL
const getFFmpegDownloadUrl = (): string => {
  const filename = getFFmpegFilename();
  // 注意：这里需要将URL中的binary.html?path=替换为直接的文件路径
  return `https://registry.npmmirror.com/-/binary/ffmpeg-static/b6.1.1/${filename}`;
};

// 获取FFmpeg本地存储路径
const getFFmpegLocalPath = (): string => {
  const appDataPath = app.getPath('userData');
  const filename = getFFmpegFilename();
  return path.join(appDataPath, filename);
};

// 检查FFmpeg是否已下载
const isFFmpegDownloaded = async (): Promise<boolean> => {
  const ffmpegPath = getFFmpegLocalPath();
  return await fs.pathExists(ffmpegPath);
};

// 下载FFmpeg
const downloadFFmpeg = async (window: Electron.BrowserWindow): Promise<string> => {
  try {
    // 检查FFmpeg是否已下载
    const alreadyDownloaded = await isFFmpegDownloaded();
    if (alreadyDownloaded) {
      return getFFmpegLocalPath();
    }
    
    const downloadUrl = getFFmpegDownloadUrl();
    const appDataPath = app.getPath('userData');
    
    // 确保appDataPath存在
    await fs.ensureDir(appDataPath);
    
    // 下载FFmpeg
    const downloadResult = await download(window, downloadUrl, {
      directory: appDataPath,
      filename: getFFmpegFilename(),
      onProgress: (progress) => {
        // 可以通过IPC将进度发送给渲染进程
        console.log(`Download progress: ${Math.round(progress.percent * 100)}%`);
      },
    });
    
    // 设置可执行权限（非Windows平台）
    if (process.platform !== 'win32') {
      await fs.chmod(downloadResult.getSavePath(), 0o755);
    }
    
    return downloadResult.getSavePath();
  } catch (error) {
    console.error('Failed to download FFmpeg:', error);
    throw error;
  }
};

export {
  getFFmpegLocalPath,
  isFFmpegDownloaded,
  downloadFFmpeg,
  getFFmpegFilename,
};
