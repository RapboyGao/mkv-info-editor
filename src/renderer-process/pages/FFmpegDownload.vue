<template>
  <div class="step-content">
    <div class="download-info">
      <el-alert
        :title="t('ffmpeg.required')"
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 20px;"
      >
        {{ t('ffmpeg.required') }}
      </el-alert>
      
      <div class="download-action">
        <el-button 
          type="primary" 
          @click="downloadFFmpeg" 
          :loading="appStore.isProcessing" 
          size="large"
        >
          <el-icon><Download /></el-icon>
          {{ appStore.ffmpegDownloaded ? '重新下载FFmpeg' : '开始下载FFmpeg' }}
        </el-button>
        
        <!-- 只有FFmpeg已下载时才显示继续按钮 -->
        <el-button 
          type="success" 
          @click="goToFileSelection" 
          :disabled="!appStore.ffmpegDownloaded" 
          size="large"
          style="margin-left: 10px;"
        >
          <el-icon><Right /></el-icon>
          {{ t('actions.continue') }}
        </el-button>
      </div>
      
      <el-progress 
        v-if="appStore.showDownloadProgress" 
        :percentage="appStore.downloadProgress" 
        :stroke-width="20" 
        :show-text="true"
        style="margin: 20px 0;"
      >
        <template #text>
          <span>{{ appStore.downloadProgress }}%</span>
        </template>
      </el-progress>
      
      <div v-if="appStore.ffmpegDownloaded" class="download-success">
        <el-icon class="success-icon"><CircleCheck /></el-icon>
        <span>{{ t('ffmpeg.completed') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../stores/appStore';
import { ElMessage } from 'element-plus';
import { CircleCheck, Download, Right } from '@element-plus/icons-vue';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const appStore = useAppStore();
const router = useRouter();

// 下载FFmpeg
const downloadFFmpeg = async () => {
  try {
    appStore.setProcessing(true, '正在下载FFmpeg...');
    appStore.clearLogs();
    
    // 显示下载进度条
    appStore.updateDownloadProgress(0);
    
    // 下载FFmpeg
    await window.electronAPI.downloadFFmpeg();
    
    // 下载完成后会触发ffmpeg-download-complete事件，更新步骤
  } catch (error) {
    console.error('Error downloading FFmpeg:', error);
    ElMessage({
      message: `FFmpeg下载失败: ${error instanceof Error ? error.message : String(error)}`,
      type: 'error'
    });
    appStore.hideDownloadProgress();
    appStore.setProcessing(false);
  }
};

// 跳转到文件编辑器页面
const goToFileSelection = () => {
  router.push('/file-editor');
};

// 组件挂载时自动下载FFmpeg
onMounted(() => {
  if (!appStore.ffmpegDownloaded) {
    downloadFFmpeg();
  }
});
</script>

<style scoped>
.download-info {
  width: 100%;
  margin: 0;
}

.download-action {
  text-align: center;
  margin: 30px 0;
}

.download-success {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  color: #67c23a;
  font-size: 18px;
}

.success-icon {
  margin-right: 10px;
  font-size: 24px;
}
</style>
