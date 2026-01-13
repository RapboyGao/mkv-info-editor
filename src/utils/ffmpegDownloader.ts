import { app } from 'electron';
import { download } from 'electron-dl';
import fs from 'fs-extra';
import path from 'path';

// 根据平台获取对应的ffmpeg可执行文件名
const getFFmpegExecutableName = (): string => {
  return process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
};

// 获取FFmpeg下载URL - 使用static build直接下载
const getFFmpegDownloadUrl = (): string => {
  const executableName = getFFmpegExecutableName();
  
  // 根据平台返回不同的直接下载URL
  if (process.platform === 'win32') {
    // Windows平台，使用直接的静态构建
    return `https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/win32-x64/${executableName}`;
  } else if (process.platform === 'darwin') {
    // macOS平台
    return `https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/darwin-x64/${executableName}`;
  } else if (process.platform === 'linux') {
    // Linux平台
    return `https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/linux-x64/${executableName}`;
  } else {
    throw new Error(`Unsupported platform: ${process.platform}`);
  }
};

// 获取FFmpeg本地存储路径
const getFFmpegLocalPath = (): string => {
  const appDataPath = app.getPath('userData');
  const executableName = getFFmpegExecutableName();
  return path.join(appDataPath, executableName);
};

// 获取项目根目录下的ffmpeg目录路径
const getProjectFFmpegPath = (): string => {
  const projectRoot = path.join(__dirname, '../../../');
  const ffmpegDir = path.join(projectRoot, 'ffmpeg');
  const executableName = getFFmpegExecutableName();
  return path.join(ffmpegDir, executableName);
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
      const executableName = getFFmpegExecutableName();
      
      // 确保appDataPath存在
      await fs.ensureDir(appDataPath);
      
      // 直接下载FFmpeg可执行文件
      const downloadResult = await download(window, downloadUrl, {
        directory: appDataPath,
        filename: executableName,
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
  getProjectFFmpegPath
};
