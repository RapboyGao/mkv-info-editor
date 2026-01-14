import { defineStore } from 'pinia';
import { ChapterData, MkvFile, MkvFileData } from '../../shared/types';

export const useAppStore = defineStore('app', {
  state: () => ({
    // 步骤状态
    currentStep: 0,
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
    // 更新当前步骤
    setCurrentStep(step: number) {
      this.currentStep = step;
    },
    
    // 设置FFmpeg下载状态
    setFFmpegDownloaded(downloaded: boolean) {
      this.ffmpegDownloaded = downloaded;
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
    
    // 设置章节列表
    setChapters(chapters: ChapterData[]) {
      this.mkvFile.setChapters(chapters);
    },
    
    // 设置总时长
    setTotalDuration(duration: number) {
      this.mkvFile.setDuration(duration);
    },
    
    // 添加章节
    addChapter(chapter: ChapterData) {
      this.mkvFile.addChapter(chapter);
    },
    
    // 删除章节
    deleteChapter(chapterId: string) {
      return this.mkvFile.deleteChapter(chapterId);
    },
    
    // 更新章节标题
    updateChapterTitle(chapterId: string, title: string) {
      return this.mkvFile.updateChapterTitle(chapterId, title);
    },
    
    // 更新章节时间
    updateChapterTime(chapterId: string, start: number, end: number) {
      const result = this.mkvFile.updateChapterTime(chapterId, start, end);
      // 更新章节结束时间
      this.mkvFile.updateChapterEndTimes();
      return result;
    },
    
    // 更新章节结束时间
    updateChapterEndTimes() {
      this.mkvFile.updateChapterEndTimes();
    },
    
    // 获取所有章节的metadata字符串
    getChaptersMetadata() {
      return this.mkvFile.getChaptersMetadata();
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
