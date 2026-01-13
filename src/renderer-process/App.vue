<template>
  <el-container class="app-container">
    <el-header>
      <h1>MKV章节名称编辑器</h1>
    </el-header>
    
    <el-main>
      <!-- 文件选择区域 -->
      <el-card class="file-selection-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>文件操作</span>
          </div>
        </template>
        <div class="file-selection-content">
          <el-button 
            type="primary" 
            @click="selectFile" 
            :loading="isProcessing" 
            :disabled="isProcessing"
            icon="el-icon-document"
          >
            选择MKV文件
          </el-button>
          <el-tag v-if="selectedFilePath" type="info" class="selected-file-tag">
            {{ getFileName(selectedFilePath) }}
          </el-tag>
        </div>
      </el-card>
      
      <!-- FFmpeg下载进度区域 -->
      <el-card v-if="showDownloadProgress" class="download-progress-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>FFmpeg下载进度</span>
          </div>
        </template>
        <div class="download-progress-content">
          <el-progress 
            :percentage="downloadProgress" 
            :stroke-width="20" 
            :show-text="true"
            status="active"
          >
            <template #text>
              <span>{{ downloadProgress }}%</span>
            </template>
          </el-progress>
          <p class="download-description">正在下载FFmpeg，这可能需要几分钟时间...</p>
        </div>
      </el-card>
      
      <!-- 章节编辑区域 -->
      <el-card v-if="chapters.length > 0" class="chapter-editor-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>章节列表</span>
            <el-badge :value="chapters.length" type="primary" class="chapter-count-badge" />
          </div>
        </template>
        
        <el-table :data="chapters" style="width: 100%" border>
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
            type="success" 
            @click="saveChanges" 
            :loading="isProcessing" 
            :disabled="isProcessing"
            icon="el-icon-check"
          >
            保存更改
          </el-button>
        </div>
      </el-card>
      
      <!-- 日志显示区域 -->
      <el-card class="logs-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>FFmpeg执行日志</span>
            <el-button 
              type="text" 
              @click="clearLogs" 
              size="small"
              icon="el-icon-delete"
            >
              清空日志
            </el-button>
          </div>
        </template>
        <el-scrollbar height="200px" class="logs-scrollbar">
          <pre class="logs-content">{{ logs }}</pre>
        </el-scrollbar>
      </el-card>
      
      <!-- 加载动画 -->
      <div v-if="isProcessing" class="processing-overlay">
        <div class="processing-indicator">
          <el-icon class="spinner-icon" size="60px"><Loading /></el-icon>
          <div style="margin-top: 20px;">{{ processingMessage }}</div>
        </div>
      </div>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';

// 类型声明
interface Chapter {
  time: string;
  title: string;
  originalTitle: string;
  startTime: number;
}

const selectedFilePath = ref<string | null>(null);
const metadataPath = ref<string | null>(null);
const chapters = ref<Chapter[]>([]);
const message = ref<{ type: 'success' | 'error' | 'info' | 'warning'; text: string } | null>(null);
const isProcessing = ref(false);
const processingMessage = ref('');
const logs = ref<string>('');
const downloadProgress = ref<number>(0);
const showDownloadProgress = ref<boolean>(false);

// 类型声明，扩展window对象
declare global {
  interface Window {
    electronAPI: {
      selectMkvFile: () => Promise<string | null>;
      saveMkvFile: (defaultPath: string) => Promise<string | null>;
      downloadFFmpeg: () => Promise<string>;
      exportMetadata: (inputPath: string) => Promise<string>;
      importMetadata: (inputPath: string, metadataPath: string, outputPath: string) => Promise<boolean>;
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<boolean>;
      deleteFile: (filePath: string) => Promise<boolean>;
      parseMetadata: (metadataPath: string) => Promise<any[]>;
      updateMetadata: (originalMetadataPath: string, chapters: any[]) => Promise<string>;
    };
    ipcRenderer: {
      on: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void;
      off: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void;
    };
  }
}

// 处理FFmpeg日志
const handleFFmpegLog = (event: Electron.IpcRendererEvent, logData: string) => {
  logs.value += logData;
};

// 处理FFmpeg下载进度
const handleFFmpegDownloadProgress = (event: Electron.IpcRendererEvent, progress: number) => {
  downloadProgress.value = progress;
  showDownloadProgress.value = true;
};

// 处理FFmpeg下载完成
const handleFFmpegDownloadComplete = () => {
  downloadProgress.value = 0;
  showDownloadProgress.value = false;
};

// 处理FFmpeg下载错误
const handleFFmpegDownloadError = (event: Electron.IpcRendererEvent, errorMessage: string) => {
  ElMessage({
    message: `FFmpeg下载失败: ${errorMessage}`,
    type: 'error'
  });
  downloadProgress.value = 0;
  showDownloadProgress.value = false;
};

// 清空日志
const clearLogs = () => {
  logs.value = '';
};

// 组件挂载时注册IPC事件监听
onMounted(() => {
  window.ipcRenderer.on('ffmpeg-log', handleFFmpegLog);
  window.ipcRenderer.on('ffmpeg-download-progress', handleFFmpegDownloadProgress);
  window.ipcRenderer.on('ffmpeg-download-complete', handleFFmpegDownloadComplete);
  window.ipcRenderer.on('ffmpeg-download-error', handleFFmpegDownloadError);
});

// 组件卸载前移除IPC事件监听
onBeforeUnmount(() => {
  window.ipcRenderer.off('ffmpeg-log', handleFFmpegLog);
  window.ipcRenderer.off('ffmpeg-download-progress', handleFFmpegDownloadProgress);
  window.ipcRenderer.off('ffmpeg-download-complete', handleFFmpegDownloadComplete);
  window.ipcRenderer.off('ffmpeg-download-error', handleFFmpegDownloadError);
});

// 获取文件名
const getFileName = (path: string): string => {
  return path.split('/').pop() || path;
};

// 选择MKV文件
const selectFile = async () => {
  try {
    isProcessing.value = true;
    processingMessage.value = '正在选择文件...';
    clearLogs();
    
    // 显示下载进度条
    showDownloadProgress.value = true;
    downloadProgress.value = 0;
    
    // 下载FFmpeg（如果尚未下载）
    await window.electronAPI.downloadFFmpeg();
    
    // 选择MKV文件
    const filePath = await window.electronAPI.selectMkvFile();
    if (!filePath) {
      isProcessing.value = false;
      showDownloadProgress.value = false;
      return;
    }
    
    selectedFilePath.value = filePath;
    
    // 导出元数据
    processingMessage.value = '正在导出元数据...';
    const metadata = await window.electronAPI.exportMetadata(filePath);
    metadataPath.value = metadata;
    
    // 解析元数据，提取章节信息
    processingMessage.value = '正在解析章节信息...';
    const chaptersList = await window.electronAPI.parseMetadata(metadata);
    chapters.value = chaptersList;
    
    ElMessage({
      message: '元数据导出成功，章节信息已加载',
      type: 'success'
    });
    showDownloadProgress.value = false;
  } catch (error) {
    console.error('Error selecting file:', error);
    ElMessage({
      message: `操作失败: ${error instanceof Error ? error.message : String(error)}`,
      type: 'error'
    });
    showDownloadProgress.value = false;
  } finally {
    isProcessing.value = false;
  }
};

// 保存更改
const saveChanges = async () => {
  if (!selectedFilePath.value || !metadataPath.value) {
    ElMessage({
      message: '请先选择MKV文件',
      type: 'error'
    });
    return;
  }
  
  try {
    isProcessing.value = true;
    processingMessage.value = '正在生成新的元数据文件...';
    
    // 更新元数据文件
    const newMetadataPath = await window.electronAPI.updateMetadata(metadataPath.value, chapters.value);
    
    // 选择输出文件路径
    processingMessage.value = '正在选择输出文件...';
    const outputFileName = getFileName(selectedFilePath.value).replace('.mkv', '_edited.mkv');
    const outputFilePath = await window.electronAPI.saveMkvFile(outputFileName);
    
    if (!outputFilePath) {
      isProcessing.value = false;
      // 删除临时文件
      await window.electronAPI.deleteFile(newMetadataPath);
      return;
    }
    
    // 导入元数据
    processingMessage.value = '正在导入元数据到MKV文件...';
    await window.electronAPI.importMetadata(selectedFilePath.value, newMetadataPath, outputFilePath);
    
    ElMessage({
      message: '章节信息已成功保存到新的MKV文件',
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
    isProcessing.value = false;
  }
};
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.el-header {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.el-header h1 {
  color: #303133;
  font-size: 24px;
  margin: 0;
  padding: 20px 0;
}

.el-main {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  position: relative;
}

.file-selection-card,
.chapter-editor-card,
.logs-card,
.download-progress-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-selection-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.selected-file-tag {
  flex: 1;
  min-width: 200px;
  max-width: 600px;
}

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
  gap: 10px;
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

.processing-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.processing-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.spinner-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.download-progress-content {
  padding: 10px 0;
}

.download-description {
  margin-top: 10px;
  text-align: center;
  color: #606266;
  font-size: 14px;
}
</style>
