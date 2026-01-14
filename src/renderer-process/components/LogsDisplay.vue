<template>
  <el-card class="logs-card" shadow="hover">    
    <!-- FFmpeg执行日志 -->
    <template #header>
      <div class="card-header">
        <span>{{ t('logs.title') }}</span>
        <el-button 
          type="text" 
          @click="appStore.clearLogs" 
          size="small"
        >
          <el-icon><Delete /></el-icon>
          {{ t('logs.clearLogs') }}
        </el-button>
      </div>
    </template>
    
    <el-scrollbar 
      v-if="appStore.logs"
      height="30vh" 
      class="logs-scrollbar"
      ref="scrollbarElement"
    >
      <pre class="logs-content">{{ appStore.logs }}</pre>
    </el-scrollbar>
    
    <div v-else class="no-logs">
      <el-empty description="暂无日志" :image-size="80" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAppStore } from '../stores/appStore';
import { Delete } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

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

.no-logs {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 30vh;
  color: #909399;
}
</style>
