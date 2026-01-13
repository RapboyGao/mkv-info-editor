import { app } from 'electron';
import { download } from 'electron-dl';
import fs from 'fs-extra';
import path from 'path';
import sevenZip from '7zip-min';
import { path7za } from '7zip-bin';

// 根据平台获取对应的ffmpeg可执行文件名
const getFFmpegExecutableName = (): string => {
  return process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
};

// 获取FFmpeg下载URL
const getFFmpegDownloadUrl = (): string => {
  // 根据平台返回不同的7z下载URL
  if (process.platform === 'win32') {
    // Windows平台
    return 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-git-essentials.7z';
  } else if (process.platform === 'darwin') {
    // macOS平台
    return 'https://evermeet.cx/ffmpeg/ffmpeg-8.0.1.7z';
  } else {
    // Linux平台，使用之前的直接下载
    const executableName = getFFmpegExecutableName();
    return `https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/linux-x64/${executableName}`;
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

// 查找解压后的FFmpeg可执行文件
const findFFmpegExecutable = async (extractDir: string): Promise<string> => {
  const executableName = getFFmpegExecutableName();
  
  // 递归查找可执行文件
  const findExecutable = async (dir: string): Promise<string | null> => {
    const files = await fs.readdir(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isFile() && file === executableName) {
        return filePath;
      }
      
      if (stat.isDirectory()) {
        const foundPath = await findExecutable(filePath);
        if (foundPath) {
          return foundPath;
        }
      }
    }
    
    return null;
  };
  
  const executablePath = await findExecutable(extractDir);
  if (!executablePath) {
    throw new Error(`FFmpeg executable ${executableName} not found in extracted files`);
  }
  
  return executablePath;
};

// 配置7zip-min使用正确的7za路径
const configure7Zip = () => {
  // 获取当前工作目录
  const cwd = process.cwd();
  
  // 获取系统架构和平台
  const arch = process.arch;
  let platform = process.platform;
  let executableName = '7za';
  
  // 映射平台名称，因为process.platform返回'win32'但7zip-bin文件夹名为'win'
  if (platform === 'win32') {
    platform = 'win32';
    executableName += '.exe';
  }
  
  // 构建正确的7za路径
  const correctPath = path.join(cwd, 'node_modules', '7zip-bin', platform, arch, executableName);
  
  console.log(`Configuring 7zip-min with 7za path: ${correctPath}`);
  console.log(`Checking if file exists: ${fs.existsSync(correctPath)}`);
  
  // 配置7zip-min使用正确的路径
  sevenZip.config({ binaryPath: correctPath });
};

// 解压7z文件
const extract7zFile = async (archivePath: string, extractDir: string): Promise<void> => {
  try {
    console.log(`Starting 7z extraction: ${archivePath} -> ${extractDir}`);
    
    // 确保7zip-min已配置
    configure7Zip();
    
    // 使用7zip-min解压
    await sevenZip.unpack(archivePath, extractDir);
    
    console.log('7z extraction complete');
  } catch (error) {
    console.error('7z extraction error:', error);
    throw error;
  }
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
      
      // 下载FFmpeg文件
      const downloadResult = await download(window, downloadUrl, {
        directory: appDataPath,
        filename: 'ffmpeg-archive.7z',
        onProgress: (progress) => {
          // 通过IPC将进度发送给渲染进程
          const progressPercent = Math.round(progress.percent * 100);
          console.log(`Download progress: ${progressPercent}%`);
          window.webContents.send('ffmpeg-download-progress', progressPercent);
        },
      });
      
      const downloadedFilePath = downloadResult.getSavePath();
      
      if (downloadUrl.endsWith('.7z')) {
        // 处理7z文件
        const extractTempDir = path.join(appDataPath, 'ffmpeg-extract');
        await fs.ensureDir(extractTempDir);
        
        // 解压7z文件
        await extract7zFile(downloadedFilePath, extractTempDir);
        
        // 查找FFmpeg可执行文件
        const extractedExecutablePath = await findFFmpegExecutable(extractTempDir);
        
        // 移动到最终位置
        ffmpegPath = getFFmpegLocalPath();
        await fs.move(extractedExecutablePath, ffmpegPath, { overwrite: true });
        
        // 清理临时文件
        await fs.remove(downloadedFilePath);
        await fs.remove(extractTempDir);
      } else {
        // 直接下载的可执行文件
        ffmpegPath = path.join(appDataPath, executableName);
        await fs.move(downloadedFilePath, ffmpegPath, { overwrite: true });
      }
      
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
