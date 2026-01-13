import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'node:path';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import started from 'electron-squirrel-startup';
import { downloadFFmpeg, getFFmpegLocalPath } from '../utils/ffmpegDownloader';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// 选择MKV文件
ipcMain.handle('select-mkv-file', async () => {
  if (!mainWindow) return null;
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'MKV Files', extensions: ['mkv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (result.canceled) {
    return null;
  }
  
  return result.filePaths[0];
});

// 保存MKV文件
ipcMain.handle('save-mkv-file', async (_, defaultPath: string) => {
  if (!mainWindow) return null;
  
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
    filters: [
      { name: 'MKV Files', extensions: ['mkv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (result.canceled) {
    return null;
  }
  
  return result.filePath;
});

// 下载FFmpeg
ipcMain.handle('download-ffmpeg', async () => {
  if (!mainWindow) throw new Error('Main window not available');
  
  const ffmpegPath = await downloadFFmpeg(mainWindow);
  return ffmpegPath;
});

// 读取文件
ipcMain.handle('read-file', async (_, filePath: string) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Failed to read file:', error);
    throw error;
  }
});

// 写入文件
ipcMain.handle('write-file', async (_, filePath: string, content: string) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error('Failed to write file:', error);
    throw error;
  }
});

// 删除文件
ipcMain.handle('delete-file', async (_, filePath: string) => {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    throw error;
  }
});

// 解析元数据文件
ipcMain.handle('parse-metadata', async (_, metadataPath: string) => {
  try {
    const content = await fs.readFile(metadataPath, 'utf-8');
    const lines = content.split('\n');
    
    const chaptersList: any[] = [];
    let currentChapter: any = {};
    let timebase = 1000; // 默认时间基准为毫秒
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('[CHAPTER]')) {
        // 新章节开始，保存之前的章节（如果有）
        if (currentChapter.time && currentChapter.startTime !== undefined) {
          chaptersList.push({
            time: currentChapter.time,
            title: currentChapter.title || '',
            originalTitle: currentChapter.title || '',
            startTime: currentChapter.startTime
          });
        }
        // 重置当前章节
        currentChapter = {};
      } else if (trimmedLine.startsWith('TIMEBASE=')) {
        // 解析TIMEBASE，格式为 "num/den"，例如 "1/1000" 表示毫秒
        const timebaseStr = trimmedLine.split('=')[1];
        const [num, den] = timebaseStr.split('/').map(Number);
        // 计算实际时间基数：例如 1/1000 = 0.001秒 = 1毫秒
        // 我们需要转换为每秒的单位数，所以用分母除以分子
        timebase = den / num;
      } else if (trimmedLine.startsWith('START=')) {
        // 解析开始时间
        const startTime = parseInt(trimmedLine.split('=')[1]);
        currentChapter.startTime = startTime;
        // 根据TIMEBASE转换为秒
        const seconds = startTime / timebase;
        // 转换为HH:MM:SS.ms格式
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        currentChapter.time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
      } else if (trimmedLine.startsWith('title=')) {
        // 解析章节标题
        currentChapter.title = trimmedLine.split('=')[1];
      }
    }
    
    // 保存最后一个章节
    if (currentChapter.time && currentChapter.startTime !== undefined) {
      chaptersList.push({
        time: currentChapter.time,
        title: currentChapter.title || '',
        originalTitle: currentChapter.title || '',
        startTime: currentChapter.startTime
      });
    }
    
    return chaptersList;
  } catch (error) {
    console.error('Failed to parse metadata:', error);
    throw error;
  }
});

// 更新元数据文件
ipcMain.handle('update-metadata', async (_, originalMetadataPath: string, chapters: any[]) => {
  try {
    const originalContent = await fs.readFile(originalMetadataPath, 'utf-8');
    const lines = originalContent.split('\n');
    const newLines: string[] = [];
    let chapterIndex = 0;
    let inChapter = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('[CHAPTER]')) {
        inChapter = true;
        newLines.push(line);
      } else if (inChapter && trimmedLine.startsWith('title=')) {
        // 更新章节标题
        if (chapterIndex < chapters.length) {
          newLines.push(`title=${chapters[chapterIndex].title}`);
          chapterIndex++;
        } else {
          newLines.push(line);
        }
      } else if (inChapter && trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        // 章节结束，遇到新的section
        inChapter = false;
        newLines.push(line);
      } else {
        newLines.push(line);
      }
    }
    
    const newContent = newLines.join('\n');
    const newMetadataPath = originalMetadataPath + '.new';
    await fs.writeFile(newMetadataPath, newContent, 'utf-8');
    
    return newMetadataPath;
  } catch (error) {
    console.error('Failed to update metadata:', error);
    throw error;
  }
});

// 执行FFmpeg命令，带日志输出
const executeFfmpegCommand = (args: string[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    const ffmpegPath = getFFmpegLocalPath();
    const process = spawn(ffmpegPath, args);
    
    let output = '';
    let error = '';
    
    process.stdout.on('data', (data) => {
      const dataStr = data.toString();
      output += dataStr;
      // 发送日志到渲染进程
      if (mainWindow) {
        mainWindow.webContents.send('ffmpeg-log', dataStr);
      }
    });
    
    process.stderr.on('data', (data) => {
      const dataStr = data.toString();
      error += dataStr;
      // 发送日志到渲染进程
      if (mainWindow) {
        mainWindow.webContents.send('ffmpeg-log', dataStr);
      }
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`FFmpeg command failed with code ${code}: ${error}`));
      }
    });
    
    process.on('error', (err) => {
      reject(err);
    });
  });
};

// 导出元数据
ipcMain.handle('export-metadata', async (_, inputPath: string) => {
  const tempDir = app.getPath('temp');
  const metadataPath = path.join(tempDir, `metadata_${Date.now()}.txt`);
  
  try {
    await executeFfmpegCommand(['-i', inputPath, '-f', 'ffmetadata', metadataPath]);
    return metadataPath;
  } catch (error) {
    console.error('Failed to export metadata:', error);
    throw error;
  }
});

// 导入元数据
ipcMain.handle('import-metadata', async (_, inputPath: string, metadataPath: string, outputPath: string) => {
  try {
    await executeFfmpegCommand(['-i', inputPath, '-i', metadataPath, '-map', '0', '-map_metadata', '1', '-map_chapters', '1', '-c', 'copy', outputPath]);
    return true;
  } catch (error) {
    console.error('Failed to import metadata:', error);
    throw error;
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

