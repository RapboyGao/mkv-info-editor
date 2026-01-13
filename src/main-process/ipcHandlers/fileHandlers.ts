import { BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'fs-extra';

/**
 * 注册文件操作相关的 IPC 处理程序
 * @param mainWindow 主窗口对象，用于文件对话框
 */
export const registerFileHandlers = (mainWindow: BrowserWindow) => {
  // 选择MKV文件
  ipcMain.handle('select-mkv-file', async () => {
    if (!mainWindow) return null;

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'MKV Files', extensions: ['mkv'] },
        { name: 'All Files', extensions: ['*'] },
      ],
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
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled) {
      return null;
    }

    return result.filePath;
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
};
