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

// 获取项目根目录下的ffmpeg目录路径
const getProjectFFmpegPath = (): string => {
  const projectRoot = path.join(__dirname, '../../../');
  const ffmpegDir = path.join(projectRoot, 'ffmpeg');
  const filename = getFFmpegFilename();
  return path.join(ffmpegDir, filename);
};

// 检查FFmpeg是否已下载
const isFFmpegDownloaded = async (): Promise<boolean> => {
  const ffmpegPath = getFFmpegLocalPath();
  return await fs.pathExists(ffmpegPath);
};

// 复制FFmpeg到项目根目录的ffmpeg文件夹
const copyFFmpegToProjectDir = async (sourcePath: string): Promise<string> => {
  const projectFFmpegPath = getProjectFFmpegPath();
  const ffmpegDir = path.dirname(projectFFmpegPath);
  
  // 确保ffmpeg目录存在
  await fs.ensureDir(ffmpegDir);
  
  // 复制FFmpeg文件
  await fs.copy(sourcePath, projectFFmpegPath, { overwrite: true });
  
  // 设置可执行权限（非Windows平台）
  if (process.platform !== 'win32') {
    await fs.chmod(projectFFmpegPath, 0o755);
  }
  
  return projectFFmpegPath;
};

// 下载FFmpeg
const downloadFFmpeg = async (window: Electron.BrowserWindow): Promise<string> => {
  try {
    // 检查FFmpeg是否已下载
    const alreadyDownloaded = await isFFmpegDownloaded();
    let ffmpegPath;
    
    if (alreadyDownloaded) {
      ffmpegPath = getFFmpegLocalPath();
    } else {
      const downloadUrl = getFFmpegDownloadUrl();
      const appDataPath = app.getPath('userData');
      
      // 确保appDataPath存在
      await fs.ensureDir(appDataPath);
      
      // 下载FFmpeg
      const downloadResult = await download(window, downloadUrl, {
        directory: appDataPath,
        filename: getFFmpegFilename(),
        onProgress: (progress) => {
          // 通过IPC将进度发送给渲染进程
          const progressPercent = Math.round(progress.percent * 100);
          console.log(`Download progress: ${progressPercent}%`);
          window.webContents.send('ffmpeg-download-progress', progressPercent);
        },
      });
      
      ffmpegPath = downloadResult.getSavePath();
      
      // 设置可执行权限（非Windows平台）
      if (process.platform !== 'win32') {
        await fs.chmod(ffmpegPath, 0o755);
      }
    }
    
    // 复制FFmpeg到项目根目录的ffmpeg文件夹
    await copyFFmpegToProjectDir(ffmpegPath);
    
    // 发送下载完成事件
    window.webContents.send('ffmpeg-download-complete');
    
    return ffmpegPath;
  } catch (error) {
    console.error('Failed to download FFmpeg:', error);
    // 发送下载失败事件
    window.webContents.send('ffmpeg-download-error', (error as Error).message);
    throw error;
  }
};

export {
  getFFmpegLocalPath,
  isFFmpegDownloaded,
  downloadFFmpeg,
  getFFmpegFilename,
  getProjectFFmpegPath
};
