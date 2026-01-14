<template>
  <div class="step-content">
    <div class="file-selection">
      <el-empty 
        v-if="!appStore.mkvFile.isValid" 
        description="请选择要编辑的MKV文件"
        :image-size="120"
      >
        <el-button 
          type="primary" 
          @click="selectFile" 
          :loading="appStore.isProcessing"
        >
          <el-icon><FolderOpened /></el-icon>
          选择MKV文件
        </el-button>
      </el-empty>
      
      <div v-else class="file-info">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="文件名">
            <el-tag type="info">{{ getFileName(appStore.mkvFile?.filePath || "") }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="文件路径">
            <div class="file-path">{{ appStore.mkvFile?.filePath }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="操作">
            <div class="file-actions">
              <el-button 
                type="default" 
                @click="reselectFile"
              >
                <el-icon><Refresh /></el-icon>
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
import { useRouter } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import { ElMessage } from 'element-plus';
import { FolderOpened, Refresh } from '@element-plus/icons-vue';

const appStore = useAppStore();
const router = useRouter();

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
    
    appStore.setProcessingMessage('正在获取文件信息...');
    appStore.updateFFmpegProgress(0);
    
    // 一次性获取MKV文件的所有信息
    const mkvFileData = await window.electronAPI.getMkvFileInfo(filePath);
    
    // 更新MKV文件信息
    appStore.setMkvFile(mkvFileData);
    
    // 导航到章节编辑器页面
    router.push('/chapter-editor');
    ElMessage({
      message: `成功解析 ${mkvFileData.chapters.length} 个章节！`,
      type: 'success'
    });
  } catch (error) {
    console.error('Error selecting file:', error);
    ElMessage({
      message: `文件处理失败: ${error instanceof Error ? error.message : String(error)}`,
      type: 'error'
    });
  } finally {
    appStore.setProcessing(false);
    appStore.resetFFmpegProgress();
  }
};

// 重新选择文件
const reselectFile = () => {
  appStore.setMkvFile(null);
};
</script>

<style scoped>
.file-selection {
  width: 100%;
  margin: 0;
}

.file-info {
  margin-top: 20px;
  width: 100%;
}

.file-path {
  word-break: break-all;
  color: #606266;
  width: 100%;
}

.file-actions {
  display: flex;
  gap: 10px;
}
</style>
