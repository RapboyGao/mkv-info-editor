<template>
  <div class="step-content">
    <div class="download-info">
      <el-alert
        title="FFmpeg是处理视频文件的必要工具"
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 20px;"
      >
        本工具需要FFmpeg来解析和修改MKV文件的章节信息。首次使用时需要下载FFmpeg，这可能需要几分钟时间。
      </el-alert>
      
      <div class="download-action">
        <el-button 
          type="primary" 
          @click="downloadFFmpeg" 
          :loading="appStore.isProcessing" 
          size="large"
          icon="el-icon-download"
        >
          {{ appStore.ffmpegDownloaded ? '重新下载FFmpeg' : '开始下载FFmpeg' }}
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
        <span>FFmpeg下载完成！</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../stores/appStore';
import { ElMessage } from 'element-plus';
import { CircleCheck } from '@element-plus/icons-vue';

const appStore = useAppStore();

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
</script>

<style scoped>
.download-info {
  max-width: 600px;
  margin: 0 auto;
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
