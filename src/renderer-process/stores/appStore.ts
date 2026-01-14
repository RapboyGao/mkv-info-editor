import { defineStore } from 'pinia';
import { ChapterData, MkvFile, MkvFileData } from '@/shared'; // 使用index.ts导出

export const useAppStore = defineStore('app', {
  state: () => ({
    ffmpegDownloaded: false,
    
    // 文件和章节信息
    mkvFile: new MkvFile({
      id: 'fake-id',
      filePath: '',
      duration: 0,
      metadata: '',
      title: '',
      encoder: '',
      format: 'mkv',
      bitRate: 0,
      size: 0,
      chapters: []
    }),
    
    // 状态管理
    isProcessing: false,
    processingMessage: '',
    logs: '',
    downloadProgress: 0,
    showDownloadProgress: false,
    ffmpegProgress: 0,
    showFFmpegProgress: false
  }),
  
  actions: {
    // 设置FFmpeg下载状态
    setFFmpegDownloaded(downloaded: boolean) {
      this.ffmpegDownloaded = downloaded;
    },

    updateMkvFile(mkvFile: MkvFile) {
      this.mkvFile = mkvFile;
    },
    
    // 设置MKV文件信息
    setMkvFile(fileData: MkvFileData | null) {
      this.mkvFile = fileData ? new MkvFile(fileData) : new MkvFile({
        id: 'fake-id',
        filePath: '',
        duration: 0,
        metadata: '',
        title: '',
        encoder: '',
        format: 'mkv',
        bitRate: 0,
        size: 0,
        chapters: []
      });
    },
    
    // 更新处理状态
    setProcessing(isProcessing: boolean, message = '') {
      this.isProcessing = isProcessing;
      this.processingMessage = message;
    },
    
    // 更新处理消息
    setProcessingMessage(message: string) {
      this.processingMessage = message;
    },
    
    // 添加日志
    addLog(logData: string) {
      this.logs += logData;
    },
    
    // 清空日志
    clearLogs() {
      this.logs = '';
    },
    
    // 更新FFmpeg下载进度
    updateDownloadProgress(progress: number) {
      this.downloadProgress = progress;
      this.showDownloadProgress = true;
    },
    
    // 隐藏下载进度
    hideDownloadProgress() {
      this.showDownloadProgress = false;
    },
    
    // 更新FFmpeg执行进度
    updateFFmpegProgress(progress: number) {
      this.ffmpegProgress = progress;
      this.showFFmpegProgress = true;
    },
    
    // 重置FFmpeg进度
    resetFFmpegProgress() {
      this.ffmpegProgress = 0;
      this.showFFmpegProgress = false;
    },
    
    // 更新MKV文件的进度信息
    updateMkvFileProgress(progress: any) {
      this.mkvFile.progress = progress;
    }
  }
});
