<template>
  <div class="mkv-metadata-preview">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>Metadata预览</h3>
          <el-button 
            type="primary" 
            @click="copyMetadata" 
            size="small"
            :disabled="!mkvFile.isValid"
          >
            <el-icon><DocumentCopy /></el-icon>
            复制Metadata
          </el-button>
        </div>
      </template>
      
      <div class="preview-content">
        <div v-if="!mkvFile.isValid" class="empty-state">
          <el-empty 
            description="请先选择MKV文件"
            :image-size="80"
          />
        </div>
        <code v-else :language="'ini'" class="metadata-code" :wrap="true">
          {{ mkvFile.fullMetadata || '无Metadata数据' }}
        </code>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '../stores/appStore';
import { ElMessage } from 'element-plus';
import { DocumentCopy } from '@element-plus/icons-vue';

const appStore = useAppStore();

// 获取mkvFile对象
const mkvFile = computed(() => appStore.mkvFile);

// 复制Metadata到剪贴板
const copyMetadata = async () => {
  if (!mkvFile.value.fullMetadata) {
    ElMessage.warning('没有可复制的Metadata数据');
    return;
  }
  
  try {
    await navigator.clipboard.writeText(mkvFile.value.fullMetadata);
    ElMessage.success('Metadata已复制到剪贴板');
  } catch (error) {
    console.error('Failed to copy metadata:', error);
    ElMessage.error('复制失败，请手动复制');
  }
};
</script>

<style scoped>
.mkv-metadata-preview {
  margin: 20px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-content {
  margin-top: 10px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.metadata-code {
  max-height: 500px;
  overflow-y: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
}
</style>