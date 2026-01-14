<template>
  <div class="app-container">
    <header class="app-header">
      <h1>MKV章节名称编辑器</h1>
    </header>
    
    <main class="app-main">
      <!-- 路由视图 -->
      <div class="router-container">
        <router-view />
      </div>
      
      <!-- 日志和进度显示 -->
      <div class="logs-container">
        <LogsDisplay />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from './stores/appStore';
import { ElMessage } from 'element-plus';
import LogsDisplay from './components/LogsDisplay.vue';

const appStore = useAppStore();
const router = useRouter();

// 处理FFmpeg日志
const handleFFmpegLog = (event: Electron.IpcRendererEvent, logData: string) => {
  appStore.addLog(logData);
  
  // 解析FFmpeg进度信息
  const progressMatch = logData.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
  if (progressMatch) {
    // 简单的进度计算，实际应该根据总时长
    appStore.updateFFmpegProgress((appStore.ffmpegProgress + 0.5) % 100);
  }
};

// 处理FFmpeg下载进度
const handleFFmpegDownloadProgress = (event: Electron.IpcRendererEvent, progress: number) => {
  appStore.updateDownloadProgress(progress);
};

// 处理FFmpeg下载完成
const handleFFmpegComplete = () => {
  appStore.updateDownloadProgress(0);
  appStore.hideDownloadProgress();
  appStore.setFFmpegDownloaded(true);
  appStore.setProcessing(false);
  ElMessage({
    message: 'FFmpeg下载完成，已准备就绪！',
    type: 'success'
  });
  
  // 跳转到选择文件页面
  router.push('/file-select');
};

// 处理FFmpeg下载错误
const handleFFmpegDownloadError = (event: Electron.IpcRendererEvent, errorMessage: string) => {
  ElMessage({
    message: `FFmpeg下载失败: ${errorMessage}`,
    type: 'error'
  });
  appStore.updateDownloadProgress(0);
  appStore.hideDownloadProgress();
};

// 组件挂载时注册IPC事件监听
onMounted(() => {
  window.ipcRenderer.on('ffmpeg-log', handleFFmpegLog);
  window.ipcRenderer.on('ffmpeg-download-progress', handleFFmpegDownloadProgress);
  window.ipcRenderer.on('ffmpeg-download-complete', handleFFmpegComplete);
  window.ipcRenderer.on('ffmpeg-download-error', handleFFmpegDownloadError);
});

// 组件卸载前移除IPC事件监听
onBeforeUnmount(() => {
  window.ipcRenderer.off('ffmpeg-log', handleFFmpegLog);
  window.ipcRenderer.off('ffmpeg-download-progress', handleFFmpegDownloadProgress);
  window.ipcRenderer.off('ffmpeg-download-complete', handleFFmpegComplete);
  window.ipcRenderer.off('ffmpeg-download-error', handleFFmpegDownloadError);
});
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.app-header {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  margin: 0;
}

.app-header h1 {
  color: #303133;
  font-size: 24px;
  margin: 0;
  padding: 20px 0;
  width: 100%;
  text-align: center;
}

.app-main {
  flex: 1;
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  overflow-y: auto;
  max-width: 100%;
  overflow-x: hidden;
}

.router-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.logs-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  width: 100%;
  box-sizing: border-box;
}
</style>