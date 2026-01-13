<template>
  <!-- 处理状态提示 -->
  <el-alert
    v-if="appStore.isProcessing"
    :title="appStore.processingMessage"
    type="info"
    :closable="false"
    style="margin-bottom: 20px;"
  />
  
  <!-- FFmpeg进度条 -->
  <el-progress 
    v-if="appStore.showFFmpegProgress"
    :percentage="appStore.ffmpegProgress" 
    :stroke-width="15" 
    :show-text="true"
    style="margin-bottom: 20px;"
  >
    <template #text>
      <span>{{ appStore.ffmpegProgress.toFixed(1) }}%</span>
    </template>
  </el-progress>
  
  <!-- FFmpeg执行日志 -->
  <el-card v-if="appStore.logs" class="logs-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>FFmpeg执行日志</span>
        <el-button 
          type="text" 
          @click="appStore.clearLogs" 
          size="small"
          icon="el-icon-delete"
        >
          清空日志
        </el-button>
      </div>
    </template>
    <el-scrollbar 
      height="200px" 
      class="logs-scrollbar"
      ref="scrollbarElement"
    >
      <pre class="logs-content">{{ appStore.logs }}</pre>
    </el-scrollbar>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAppStore } from '../stores/appStore';

const appStore = useAppStore();
const scrollbarElement = ref<any>(null);

// 监听日志变化，自动滚动到底部
watch(() => appStore.logs, () => {
  setTimeout(() => {
    if (scrollbarElement.value && scrollbarElement.value.wrap) {
      const wrapElement = scrollbarElement.value.wrap;
      wrapElement.scrollTop = wrapElement.scrollHeight;
    }
  }, 100);
});
</script>

<style scoped>
.logs-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logs-scrollbar {
  background-color: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.logs-content {
  margin: 0;
  padding: 10px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
