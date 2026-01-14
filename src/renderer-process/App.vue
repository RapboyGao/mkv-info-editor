<template>
  <div class="app-container">
    <header class="app-header">
      <el-menu mode="horizontal" background-color="#fff" text-color="#303133" active-text-color="#409EFF" border-bottom="0">
        <el-menu-item index="title" class="menu-title">
          <h1>{{ t("app.title") }}</h1>
        </el-menu-item>
        <el-menu-item index="language" class="menu-language">
          <el-select v-model="currentLocale" @change="switchLanguage" size="small">
            <el-option label="English" value="en" />
            <el-option label="中文" value="zh" />
          </el-select>
        </el-menu-item>
      </el-menu>
    </header>

    <main class="app-main">
      <router-view />
      <!-- 日志和进度显示 -->
      <LogsDisplay />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "./stores/appStore";
import { ElMessage } from "element-plus";
import LogsDisplay from "./components/LogsDisplay.vue";
import { useI18n } from "vue-i18n";

const appStore = useAppStore();
const router = useRouter();
const { t, locale } = useI18n();
const currentLocale = ref(locale.value);

// 切换语言
const switchLanguage = (lang: string) => {
  locale.value = lang;
};

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
const handleFFmpegDownloadProgress = (
  event: Electron.IpcRendererEvent,
  progress: number
) => {
  appStore.updateDownloadProgress(progress);
};

// 处理FFmpeg下载完成
const handleFFmpegComplete = () => {
  appStore.updateDownloadProgress(0);
  appStore.hideDownloadProgress();
  appStore.setFFmpegDownloaded(true);
  appStore.setProcessing(false);
  ElMessage({
    message: "FFmpeg下载完成，已准备就绪！",
    type: "success",
  });

  // 跳转到文件编辑器页面
  router.push("/file-editor");
};

// 处理FFmpeg下载错误
const handleFFmpegDownloadError = (
  event: Electron.IpcRendererEvent,
  errorMessage: string
) => {
  ElMessage({
    message: `FFmpeg下载失败: ${errorMessage}`,
    type: "error",
  });
  appStore.updateDownloadProgress(0);
  appStore.hideDownloadProgress();
};

// 处理FFmpeg进度更新
const handleFFmpegProgress = (event: any, progress: any) => {
  // 更新当前mkvFile的progress属性
  appStore.updateMkvFileProgress(progress);
};

// 组件挂载时注册IPC事件监听
onMounted(() => {
  window.ipcRenderer.on("ffmpeg-log", handleFFmpegLog);
  window.ipcRenderer.on(
    "ffmpeg-download-progress",
    handleFFmpegDownloadProgress
  );
  window.ipcRenderer.on("ffmpeg-download-complete", handleFFmpegComplete);
  window.ipcRenderer.on("ffmpeg-download-error", handleFFmpegDownloadError);
  window.ipcRenderer.on("ffmpeg-progress", handleFFmpegProgress);
});

// 组件卸载前移除IPC事件监听
onBeforeUnmount(() => {
  window.ipcRenderer.off("ffmpeg-log", handleFFmpegLog);
  window.ipcRenderer.off(
    "ffmpeg-download-progress",
    handleFFmpegDownloadProgress
  );
  window.ipcRenderer.off("ffmpeg-download-complete", handleFFmpegComplete);
  window.ipcRenderer.off("ffmpeg-download-error", handleFFmpegDownloadError);
  window.ipcRenderer.off("ffmpeg-progress", handleFFmpegProgress);
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
  width: 100%;
  box-sizing: border-box;
  margin: 0;
}

.app-header :deep(.el-menu) {
  border-bottom: none;
}

.menu-title {
  flex: 1;
  justify-content: center !important;
}

.menu-title h1 {
  color: #303133;
  font-size: 24px;
  margin: 0;
  padding: 0;
  text-align: center;
}

.menu-language {
  margin-left: auto;
  display: flex;
  align-items: center;
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

.router-card {
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
}

.el-card__body {
  padding: 0;
}
</style>
