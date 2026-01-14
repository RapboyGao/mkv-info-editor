import { BrowserWindow, app, ipcMain } from 'electron';
import { spawn } from 'child_process';
import path from 'node:path';
import { getFFmpegLocalPath } from '../../utils/ffmpegDownloader';
import { MkvFileData, ChapterData } from '../../shared/types';
import fs from 'fs-extra';

// 执行FFmpeg命令，带日志输出
function executeFFCommand(args: string[], mainWindow: BrowserWindow | null): Promise<string> {
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
}

/**
 * 获取MKV文件时长
 * @param filePath MKV文件路径
 * @param mainWindow 主窗口对象，用于日志输出
 * @returns 视频总时长（秒）
 */
async function handleGetMkvDuration(filePath: string, mainWindow: BrowserWindow): Promise<number> {
  console.log('handleGetMkvDuration called with filePath:', filePath);
  try {
    // 方法：直接解析ffmpeg -i命令的输出，添加null输出以避免错误
    // 构建命令，使用info级别输出以获取duration信息
    const command = [
      '-i',
      filePath,
      '-f',
      'ffmetadata', // 输出格式为ffmetadata
      '-y', // 自动覆盖输出文件
      process.platform === 'win32' ? 'NUL' : '/dev/null', // 输出到空设备
      '-v',
      'info', // 使用info级别以显示duration信息
    ];

    const output = await executeFFCommand(command, mainWindow);
    console.log('FFmpeg output:', output);

    // 从输出中提取时长信息
    // 改进的正则表达式：支持更灵活的格式，如Duration: 02:29:46.37, Duration: 02:29:46, Duration: 2:29:46.371等
    const durationMatch = output.match(/Duration:\s*(\d+):(\d+):(\d+)(?:\.(\d+))?/i);
    if (durationMatch) {
      const [, hours, minutes, seconds, milliseconds = '0'] = durationMatch;
      console.log('Duration match groups:', hours, minutes, seconds, milliseconds);
      
      // 计算总秒数：修复毫秒转换逻辑，根据实际位数计算
      const totalSeconds = 
        parseFloat(hours) * 3600 + 
        parseFloat(minutes) * 60 + 
        parseFloat(seconds) + 
        parseFloat(milliseconds) / Math.pow(10, milliseconds.length);
      
      console.log('Calculated total seconds:', totalSeconds);
      return totalSeconds;
    } else {
      console.error('No duration match found in output:', output);
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
 * 获取MKV文件的完整信息（时长、元数据、章节）
 * @param filePath MKV文件路径
 * @param mainWindow 主窗口对象，用于日志输出
 * @returns 包含完整信息的MkvFileData对象
 */
async function handleGetMkvFileInfo(filePath: string, mainWindow: BrowserWindow): Promise<MkvFileData> {
  try {
    // 1. 获取文件大小
    const fileStats = await fs.stat(filePath);
    const fileSize = fileStats.size;
    
    // 2. 导出元数据并获取详细信息，一次性获取所有需要的数据
    const tempDir = app.getPath('temp');
    const metadataPath = path.join(tempDir, `metadata_${Date.now()}.txt`);
    
    // 使用用户建议的命令：一次性获取所有信息
    const command = [
      '-i', filePath,
      '-f', 'ffmetadata', metadataPath,
      '-v', 'info'
    ];
    
    const output = await executeFFCommand(command, mainWindow);
    
    // 3. 读取并解析元数据内容
    const metadataContent = await fs.readFile(metadataPath, "utf-8");
    
    // 4. 解析输出信息
    let totalDuration = 100 * 3600; // 默认值
    let format = "MKV";
    let bitRate = 0;
    let title = "";
    let encoder = "";
    
    // 解析时长
    const durationMatch = output.match(/Duration:\s*(\d+):(\d+):(\d+)(?:\.(\d+))?/i);
    if (durationMatch) {
      const [, hours, minutes, seconds, milliseconds = '0'] = durationMatch;
      totalDuration = 
        parseFloat(hours) * 3600 + 
        parseFloat(minutes) * 60 + 
        parseFloat(seconds) + 
        parseFloat(milliseconds) / Math.pow(10, milliseconds.length);
    }
    
    // 解析格式
    const formatMatch = output.match(/Input #0,\s*([a-zA-Z0-9_]+),/i);
    if (formatMatch) {
      format = formatMatch[1].toUpperCase();
    }
    
    // 解析比特率
    const bitRateMatch = output.match(/bitrate:\s*(\d+)\s*kb\/s/i);
    if (bitRateMatch) {
      bitRate = parseInt(bitRateMatch[1]) * 1000; // 转换为bps
    }
    
    // 5. 解析元数据，提取章节信息和全局元数据
    const chaptersList: ChapterData[] = [];
    let currentChapter: Partial<ChapterData> = {};
    let timebase = "1/1000"; // 默认时间基准为毫秒
    let inChapterSection = false; // 标记是否进入了章节部分
    
    for (const line of metadataContent.split('\n')) {
      const trimmedLine = line.trim();
      
      // 检查是否进入章节部分
      if (trimmedLine.startsWith("[CHAPTER]")) {
        inChapterSection = true;
        // 新章节开始，保存之前的章节（如果有）
        if (currentChapter.start !== undefined) {
          chaptersList.push({
            id: Math.random().toString(36).substring(2, 10),
            start: currentChapter.start,
            end: 0, // 稍后计算
            title: currentChapter.title || "",
            originalTitle: currentChapter.title || "",
            timeBase: currentChapter.timeBase || (timebase as `${number}/${number}`),
          });
        }
        // 重置当前章节
        currentChapter = {};
        continue; // 跳过当前行，进入下一行处理
      }
      
      // 解析全局元数据（仅在章节部分之前）
      if (!inChapterSection) {
        if (trimmedLine.startsWith("title=")) {
          title = trimmedLine.split("=")[1];
        } else if (trimmedLine.startsWith("encoder=")) {
          encoder = trimmedLine.split("=")[1];
        }
      } else {
        // 解析章节信息（仅在章节部分内）
        if (trimmedLine.startsWith("TIMEBASE=")) {
          // 解析TIMEBASE
          const timebaseStr = trimmedLine.split("=")[1];
          if (/^\d+\/\d+$/.test(timebaseStr)) {
            timebase = timebaseStr;
            currentChapter.timeBase = timebase as `${number}/${number}`;
          }
        } else if (trimmedLine.startsWith("START=")) {
          // 解析开始时间
          const start = parseInt(trimmedLine.split("=")[1]);
          currentChapter.start = start;
          if (!currentChapter.timeBase) {
            currentChapter.timeBase = timebase as `${number}/${number}`;
          }
        } else if (trimmedLine.startsWith("title=")) {
          // 解析章节标题
          currentChapter.title = trimmedLine.split("=")[1];
        }
      }
    }
    
    // 保存最后一个章节
    if (currentChapter.start !== undefined) {
      chaptersList.push({
        id: Math.random().toString(36).substring(2, 10),
        start: currentChapter.start,
        end: 0, // 稍后计算
        title: currentChapter.title || "",
        originalTitle: currentChapter.title || "",
        timeBase: currentChapter.timeBase || (timebase as `${number}/${number}`),
      });
    }
    
    // 按开始时间排序章节
    chaptersList.sort((a, b) => a.start - b.start);
    
    // 计算每个章节的结束时间
    for (let i = 0; i < chaptersList.length; i++) {
      const chapter = chaptersList[i];
      const nextChapter = chaptersList[i + 1];
      
      if (nextChapter) {
        chapter.end = nextChapter.start;
      } else {
        // 最后一个章节，结束时间设置为整个MKV的总时长
        const denominator = parseInt(chapter.timeBase?.split("/")[1] || "1000");
        chapter.end = totalDuration * denominator;
      }
    }
    
    // 清理临时文件
    await fs.unlink(metadataPath).catch(error => {
      console.warn('Failed to delete temporary metadata file:', error);
    });
    
    // 返回完整的MKV文件信息
    return {
      filePath,
      duration: totalDuration,
      metadata: metadataContent,
      chapters: chaptersList,
      title,
      encoder,
      format,
      bitRate,
      size: fileSize
    };
  } catch (error) {
    console.error('Failed to get MKV file info:', error);
    throw error;
  }
}

/**
 * 注册 MKV 处理相关的 IPC 处理程序
 * @param mainWindow 主窗口对象，用于日志输出和进程管理
 */
export function registerMKVHandlers(mainWindow: BrowserWindow) {
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

  // 获取MKV文件完整信息
  ipcMain.handle('get-mkv-file-info', async (_, filePath: string) => {
    return handleGetMkvFileInfo(filePath, mainWindow);
  });
}
