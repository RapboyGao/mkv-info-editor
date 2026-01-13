import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'node:path';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import started from 'electron-squirrel-startup';
import { downloadFFmpeg, getFFmpegLocalPath } from '../utils/ffmpegDownloader';
import { Chapter } from '../shared/types';

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
// 获取MKV文件时长
ipcMain.handle('get-mkv-duration', async (_, filePath: string) => {
  try {
    // 使用ffprobe获取MKV文件时长
    const output = await executeFFCommand([
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-i', filePath
    ]);
    
    // 解析JSON输出获取时长
    const formatInfo = JSON.parse(output).format;
    const duration = parseFloat(formatInfo.duration);
    return duration;
  } catch (error) {
    console.error('Failed to get MKV duration:', error);
    throw error;
  }
});

// 解析元数据文件
ipcMain.handle('parse-metadata', async (_, metadataPath: string, totalDuration?: number) => {
  try {
    const content = await fs.readFile(metadataPath, 'utf-8');
    const lines = content.split('\n');
    
    const chaptersList: Chapter[] = [];
    let currentChapter: Partial<Chapter> = {};
    let timebase = 1000; // 默认时间基准为毫秒
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('[CHAPTER]')) {
        // 新章节开始，保存之前的章节（如果有）
        if (currentChapter.startTime !== undefined) {
          // 计算时间字符串（在保存章节时计算，确保使用正确的TIMEBASE）
          const seconds = currentChapter.startTime / timebase;
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          const secs = Math.floor(seconds % 60);
          const ms = Math.floor((seconds % 1) * 1000);
          const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
          
          chaptersList.push({
            time: timeString,
            title: currentChapter.title || '',
            originalTitle: currentChapter.title || '',
            startTime: currentChapter.startTime,
            startTimeSeconds: seconds
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
        // 解析开始时间，只存储原始值，不计算时间字符串（等待TIMEBASE解析后再计算）
        const startTime = parseInt(trimmedLine.split('=')[1]);
        currentChapter.startTime = startTime;
      } else if (trimmedLine.startsWith('title=')) {
        // 解析章节标题
        currentChapter.title = trimmedLine.split('=')[1];
      }
    }
    
    // 保存最后一个章节
    if (currentChapter.startTime !== undefined) {
      // 计算时间字符串
      const seconds = currentChapter.startTime / timebase;
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
      
      chaptersList.push({
        time: timeString,
        title: currentChapter.title || '',
        originalTitle: currentChapter.title || '',
        startTime: currentChapter.startTime,
        startTimeSeconds: seconds
      });
    }
    
    // 为每个章节生成随机ID
    for (const chapter of chaptersList) {
      chapter.id = Math.random().toString(36).substring(2, 10);
    }
    
    // 按开始时间排序章节
    chaptersList.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
    
    // 计算每个章节的结束时间
    for (let i = 0; i < chaptersList.length; i++) {
      const chapter = chaptersList[i];
      const nextChapter = chaptersList[i + 1];
      
      if (nextChapter) {
        // 如果有下一个章节，当前章节的结束时间就是下一个章节的开始时间
        chapter.endTime = nextChapter.time;
        chapter.endTimeSeconds = nextChapter.startTimeSeconds;
      } else {
        // 最后一个章节，结束时间设置为整个MKV的总时长
        let finalEndTime = 100 * 3600; // 默认值（100小时）
        if (typeof totalDuration === 'number' && !isNaN(totalDuration)) {
          finalEndTime = totalDuration;
        }
        
        // 计算时间字符串
        const hours = Math.floor(finalEndTime / 3600);
        const minutes = Math.floor((finalEndTime % 3600) / 60);
        const secs = Math.floor(finalEndTime % 60);
        const ms = Math.floor((finalEndTime % 1) * 1000);
        chapter.endTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
        chapter.endTimeSeconds = finalEndTime;
      }
    }
    
    return chaptersList;
  } catch (error) {
    console.error('Failed to parse metadata:', error);
    throw error;
  }
});

// 更新元数据文件
ipcMain.handle('update-metadata', async (_, originalMetadataPath: string, chapters: Chapter[]) => {
  try {
    const originalContent = await fs.readFile(originalMetadataPath, 'utf-8');
    const lines = originalContent.split('\n');
    const newLines: string[] = [];
    let beforeChapters = true;
    const chaptersSection: string[] = [];
    let afterChapters = false;
    
    // 首先分离原始文件内容为：章节前内容 + 章节内容 + 章节后内容
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (beforeChapters) {
        if (trimmedLine.startsWith('[CHAPTER]')) {
          beforeChapters = false;
          afterChapters = false;
        } else if (trimmedLine.startsWith('[')) {
          // 这是一个新的section，不是章节的一部分
          newLines.push(line);
        } else if (line.trim() !== '') {
          // 保留非空行
          newLines.push(line);
        }
      }
      
      if (!beforeChapters && !afterChapters) {
        if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']') && !trimmedLine.startsWith('[CHAPTER]')) {
          // 章节结束，遇到新的section
          afterChapters = true;
          newLines.push(line);
        } else if (!trimmedLine.startsWith('[CHAPTER]') && line.trim() !== '') {
          // 保留非空行和非[CHAPTER]行
          chaptersSection.push(line);
        }
      }
      
      if (afterChapters && trimmedLine !== '') {
        newLines.push(line);
      }
    }
    
    // 生成新的章节内容
    const newChaptersContent: string[] = [];
    
    // 假设timebase为1/1000
    newChaptersContent.push(';FFMETADATA1');
    newChaptersContent.push('');
    
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      
      // 添加章节标记
      newChaptersContent.push('[CHAPTER]');
      newChaptersContent.push('TIMEBASE=1/1000');
      newChaptersContent.push(`START=${chapter.startTime}`);
      if (i < chapters.length - 1) {
        // 如果不是最后一个章节，设置END时间
        newChaptersContent.push(`END=${chapters[i + 1].startTime}`);
      }
      newChaptersContent.push(`title=${chapter.title}`);
      newChaptersContent.push('');
    }
    
    // 合并所有内容：原始非章节内容 + 新章节内容 + 原始章节后内容
    const allLines = [...newChaptersContent, ...newLines];
    const newContent = allLines.join('\n');
    
    const newMetadataPath = originalMetadataPath + '.new';
    await fs.writeFile(newMetadataPath, newContent, 'utf-8');
    
    return newMetadataPath;
  } catch (error) {
    console.error('Failed to update metadata:', error);
    throw error;
  }
});

// 执行FFmpeg/FFprobe命令，带日志输出
const executeFFCommand = (args: string[]): Promise<string> => {
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

// 执行FFmpeg命令，带日志输出
const executeFfmpegCommand = executeFFCommand;

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

