import { defineStore } from 'pinia';

// 类型声明
interface Chapter {
  time: string;
  title: string;
  originalTitle: string;
  startTime: number;
}

export const useAppStore = defineStore('app', {
  state: () => ({
    // 步骤状态
    currentStep: 0,
    ffmpegDownloaded: false,
    
    // 文件和章节信息
    selectedFilePath: null as string | null,
    metadataPath: null as string | null,
    chapters: [] as Chapter[],
    
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
    // 更新当前步骤
    setCurrentStep(step: number) {
      this.currentStep = step;
    },
    
    // 设置FFmpeg下载状态
    setFFmpegDownloaded(downloaded: boolean) {
      this.ffmpegDownloaded = downloaded;
    },
    
    // 设置选中的文件路径
    setSelectedFilePath(filePath: string | null) {
      this.selectedFilePath = filePath;
    },
    
    // 设置元数据路径
    setMetadataPath(path: string | null) {
      this.metadataPath = path;
    },
    
    // 设置章节列表
    setChapters(chapters: Chapter[]) {
      this.chapters = chapters;
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
    }
  }
});
