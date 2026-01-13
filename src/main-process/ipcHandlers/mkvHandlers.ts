import { BrowserWindow, app, ipcMain } from 'electron';
import { spawn } from 'child_process';
import path from 'node:path';
import { getFFmpegLocalPath } from '../../utils/ffmpegDownloader';

// 执行FFmpeg命令，带日志输出
const executeFFCommand = (args: string[], mainWindow: BrowserWindow | null): Promise<string> => {
  return new Promise((resolve, reject) => {
    const ffmpegPath = getFFmpegLocalPath();
    const process = spawn(ffmpegPath, args);

    let output = '';
    let error = '';

    // 关闭stdin，避免进程等待输入
    process.stdin.end();

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

    process.on('exit', (code, signal) => {
      const allOutput = output + error;

      // 检查退出信号
      if (signal) {
        reject(new Error(`FFmpeg command was killed with signal: ${signal}`));
        return;
      }

      // 对于某些命令（如ffmpeg -i），即使返回非0退出码，stderr也包含有用信息
      // 因此我们总是返回组合的输出和错误信息，仅在进程被信号终止时才reject
      resolve(allOutput);
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
};

/**
 * 获取MKV文件时长
 * @param filePath MKV文件路径
 * @param mainWindow 主窗口对象，用于日志输出
 * @returns 视频总时长（秒）
 */
async function handleGetMkvDuration(filePath: string, mainWindow: BrowserWindow): Promise<number> {
  try {
    // 方法：直接解析ffmpeg -i命令的输出，添加null输出以避免错误
    // 构建命令，使用info级别输出以获取duration信息
    const command = [
      '-i',
      filePath,
      '-f',
      'null', // 输出格式为null
      '-y', // 自动覆盖输出文件
      process.platform === 'win32' ? 'NUL' : '/dev/null', // 输出到空设备
      '-v',
      'info', // 使用info级别以显示duration信息
    ];

    const output = await executeFFCommand(command, mainWindow);
    console.log('FFmpeg output:', output);

    // 从输出中提取时长信息
    // 匹配格式：Duration: 02:29:46.37, start: 0.000000, bitrate: 32385 kb/s
    // 使用更灵活的正则模式，支持不同位数的时长值
    const durationMatch = output.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/i);
    if (durationMatch) {
      const [, hours, minutes, seconds, milliseconds] = durationMatch;
      // 计算总秒数
      const totalSeconds = parseFloat(hours) * 3600 + parseFloat(minutes) * 60 + parseFloat(seconds) + parseFloat(milliseconds) / 100;
      return totalSeconds;
    }

    console.error('Failed to extract duration from FFmpeg output:', output);
    // 捕获错误，使用默认值100小时
    return 100 * 3600;
  } catch (error) {
    console.error('Failed to get MKV duration:', error);
    // 捕获错误，使用默认值100小时
    return 100 * 3600;
  }
}

/**
 * 导出MKV文件的元数据
 * @param inputPath MKV文件路径
 * @param mainWindow 主窗口对象，用于日志输出
 * @returns 生成的元数据文件路径
 */
async function handleExportMetadata(inputPath: string, mainWindow: BrowserWindow): Promise<string> {
  const tempDir = app.getPath('temp');
  const metadataPath = path.join(tempDir, `metadata_${Date.now()}.txt`);

  try {
    await executeFFCommand(
      ['-i', inputPath, '-f', 'ffmetadata', metadataPath],
      mainWindow
    );
    return metadataPath;
  } catch (error) {
    console.error('Failed to export metadata:', error);
    throw error;
  }
}

/**
 * 导入元数据到MKV文件
 * @param inputPath 原始MKV文件路径
 * @param metadataPath 元数据文件路径
 * @param outputPath 输出MKV文件路径
 * @param mainWindow 主窗口对象，用于日志输出
 * @returns 是否导入成功
 */
async function handleImportMetadata(
  inputPath: string, 
  metadataPath: string, 
  outputPath: string, 
  mainWindow: BrowserWindow
): Promise<boolean> {
  try {
    await executeFFCommand(
      [
        '-i',
        inputPath,
        '-i',
        metadataPath,
        '-map',
        '0',
        '-map_metadata',
        '1',
        '-map_chapters',
        '1',
        '-c',
        'copy',
        outputPath,
      ],
      mainWindow
    );
    return true;
  } catch (error) {
    console.error('Failed to import metadata:', error);
    throw error;
  }
}

/**
 * 注册 MKV 处理相关的 IPC 处理程序
 * @param mainWindow 主窗口对象，用于日志输出和进程管理
 */
export const registerMKVHandlers = (mainWindow: BrowserWindow) => {
  // 获取MKV文件时长
  ipcMain.handle('get-mkv-duration', async (_, filePath: string) => {
    return handleGetMkvDuration(filePath, mainWindow);
  });

  // 导出元数据
  ipcMain.handle('export-metadata', async (_, inputPath: string) => {
    return handleExportMetadata(inputPath, mainWindow);
  });

  // 导入元数据
  ipcMain.handle(
    'import-metadata',
    async (_, inputPath: string, metadataPath: string, outputPath: string) => {
      return handleImportMetadata(inputPath, metadataPath, outputPath, mainWindow);
    }
  );
};
