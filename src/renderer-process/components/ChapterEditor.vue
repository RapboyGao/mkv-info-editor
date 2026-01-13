<template>
  <div class="step-content">
    <div class="chapter-editor">
      <el-table :data="appStore.chapters" style="width: 100%" border>
        <el-table-column prop="time" label="开始时间" width="180" />
        <el-table-column prop="originalTitle" label="原始标题" min-width="200">
          <template #default="scope">
            <div class="original-title">{{ scope.row.originalTitle }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="修改后标题" min-width="200">
          <template #default="scope">
            <el-input 
              v-model="scope.row.title" 
              placeholder="请输入章节标题"
              size="small"
            />
            <el-divider style="margin: 5px 0" />
            <div 
              class="title-diff" 
              v-if="scope.row.title !== scope.row.originalTitle"
            >
              <el-tag type="warning" size="small">已修改</el-tag>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="action-buttons" style="margin-top: 20px; text-align: center;">
        <el-button 
          type="default" 
          @click="backToFileSelection"
          icon="el-icon-back"
        >
          返回文件选择
        </el-button>
        <el-button 
          type="success" 
          @click="saveChanges" 
          :loading="appStore.isProcessing" 
          icon="el-icon-check"
          size="large"
        >
          保存更改
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../stores/appStore';
import { ElMessage } from 'element-plus';

const appStore = useAppStore();

// 返回文件选择
const backToFileSelection = () => {
  appStore.setCurrentStep(1);
};

// 获取文件名
const getFileName = (path: string): string => {
  return path.split('/').pop() || path;
};

// 保存更改
const saveChanges = async () => {
  if (!appStore.selectedFilePath || !appStore.metadataPath) {
    ElMessage({
      message: '请先选择MKV文件',
      type: 'error'
    });
    return;
  }
  
  try {
    appStore.setProcessing(true, '正在生成新的元数据文件...');
    appStore.resetFFmpegProgress();
    
    // 更新元数据文件 - 将响应式对象转换为普通对象，避免IPC序列化错误
    const plainChapters = appStore.chapters.map(chapter => ({
      time: chapter.time,
      title: chapter.title,
      originalTitle: chapter.originalTitle,
      startTime: chapter.startTime
    }));
    const newMetadataPath = await window.electronAPI.updateMetadata(appStore.metadataPath, plainChapters);
    
    // 选择输出文件路径
    appStore.setProcessingMessage('正在选择输出文件...');
    const outputFileName = getFileName(appStore.selectedFilePath).replace('.mkv', '_edited.mkv');
    const outputFilePath = await window.electronAPI.saveMkvFile(outputFileName);
    
    if (!outputFilePath) {
      appStore.setProcessing(false);
      // 删除临时文件
      await window.electronAPI.deleteFile(newMetadataPath);
      return;
    }
    
    // 导入元数据
    appStore.setProcessingMessage('正在导入元数据到MKV文件...');
    appStore.updateFFmpegProgress(0);
    await window.electronAPI.importMetadata(appStore.selectedFilePath, newMetadataPath, outputFilePath);
    
    ElMessage({
      message: '章节信息已成功保存到新的MKV文件！',
      type: 'success'
    });
    
    // 清理临时文件
    await window.electronAPI.deleteFile(newMetadataPath);
  } catch (error) {
    console.error('Error saving changes:', error);
    ElMessage({
      message: `保存失败: ${error instanceof Error ? error.message : String(error)}`,
      type: 'error'
    });
  } finally {
    appStore.setProcessing(false);
    appStore.resetFFmpegProgress();
  }
};
</script>

<style scoped>
.chapter-count-badge {
  margin-left: 10px;
}

.original-title {
  font-style: italic;
  color: #909399;
  word-break: break-all;
}

.title-diff {
  margin-top: 5px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}
</style>
