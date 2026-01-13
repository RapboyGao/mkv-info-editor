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

// 执行FFmpeg命令
const executeFfmpegCommand = (args: string[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    const ffmpegPath = getFFmpegLocalPath();
    const process = spawn(ffmpegPath, args);
    
    let output = '';
    let error = '';
    
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      error += data.toString();
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
    await executeFfmpegCommand(['-i', inputPath, '-i', metadataPath, '-map_metadata', '1', '-c', 'copy', outputPath]);
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

