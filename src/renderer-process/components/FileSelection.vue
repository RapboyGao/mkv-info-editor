<template>
  <div class="step-content">
    <div class="file-selection">
      <el-empty 
        v-if="!appStore.selectedFilePath" 
        description="请选择要编辑的MKV文件"
        :image-size="120"
      >
        <el-button 
          type="primary" 
          @click="selectFile" 
          :loading="appStore.isProcessing"
          icon="el-icon-folder-opened"
        >
          选择MKV文件
        </el-button>
      </el-empty>
      
      <div v-else class="file-info">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="文件名">
            <el-tag type="info">{{ getFileName(appStore.selectedFilePath) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="文件路径">
            <div class="file-path">{{ appStore.selectedFilePath }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="操作">
            <div class="file-actions">
              <el-button 
                type="primary" 
                @click="parseChapters" 
                :loading="appStore.isProcessing"
                icon="el-icon-data-analysis"
              >
                解析章节信息
              </el-button>
              <el-button 
                type="default" 
                @click="appStore.setSelectedFilePath(null)"
                icon="el-icon-refresh"
              >
                重新选择
              </el-button>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../stores/appStore';
import { ElMessage } from 'element-plus';

const appStore = useAppStore();

// 获取文件名
const getFileName = (path: string): string => {
  return path.split('/').pop() || path;
};

// 选择MKV文件
const selectFile = async () => {
  try {
    appStore.setProcessing(true, '正在选择文件...');
    
    // 选择MKV文件
    const filePath = await window.electronAPI.selectMkvFile();
    if (!filePath) {
      appStore.setProcessing(false);
      return;
    }
    
    appStore.setSelectedFilePath(filePath);
    ElMessage({
      message: '文件选择成功！',
      type: 'success'
    });
  } catch (error) {
    console.error('Error selecting file:', error);
    ElMessage({
      message: `文件选择失败: ${error instanceof Error ? error.message : String(error)}`,
      type: 'error'
    });
  } finally {
    appStore.setProcessing(false);
  }
};

// 解析章节信息
const parseChapters = async () => {
  if (!appStore.selectedFilePath) return;
  
  try {
    appStore.setProcessing(true, '正在解析章节信息...');
    appStore.updateFFmpegProgress(0);
    
    // 导出元数据
    const metadata = await window.electronAPI.exportMetadata(appStore.selectedFilePath);
    appStore.setMetadataPath(metadata);
    
    // 解析元数据，提取章节信息
    const chaptersList = await window.electronAPI.parseMetadata(metadata);
    appStore.setChapters(chaptersList);
    
    // 进入下一步
    appStore.setCurrentStep(2);
    ElMessage({
      message: `成功解析 ${chaptersList.length} 个章节！`,
      type: 'success'
    });
  } catch (error) {
    console.error('Error parsing chapters:', error);
    ElMessage({
      message: `章节解析失败: ${error instanceof Error ? error.message : String(error)}`,
      type: 'error'
    });
  } finally {
    appStore.setProcessing(false);
    appStore.resetFFmpegProgress();
  }
};
</script>

<style scoped>
.file-selection {
  max-width: 700px;
  margin: 0 auto;
}

.file-info {
  margin-top: 20px;
}

.file-path {
  word-break: break-all;
  color: #606266;
}

.file-actions {
  display: flex;
  gap: 10px;
}
</style>
