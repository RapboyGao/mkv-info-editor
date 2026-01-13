<template>
  <el-container class="app-container">
    <el-header>
      <h1>MKV章节名称编辑器</h1>
    </el-header>
    
    <el-main>
      <!-- 步骤指示器 -->
      <el-steps :active="currentStep" finish-status="success" align-center style="margin-bottom: 30px;">
        <el-step title="FFmpeg下载" description="下载FFmpeg工具" />
        <el-step title="选择文件" description="选择要编辑的MKV文件" />
        <el-step title="编辑章节" description="编辑章节信息" />
      </el-steps>
      
      <!-- 步骤内容区域 -->
      <el-card class="content-card" shadow="hover">
        <!-- 动态头部 -->
        <template #header>
          <div class="card-header">
            <span v-if="currentStep === 0">FFmpeg下载</span>
            <span v-else-if="currentStep === 1">选择MKV文件</span>
            <span v-else-if="currentStep === 2">章节编辑</span>
            <el-badge 
              v-if="currentStep === 2" 
              :value="chapters.length" 
              type="primary" 
              class="chapter-count-badge" 
            />
          </div>
        </template>
        
        <!-- 步骤1：FFmpeg下载 -->
        <div v-if="currentStep === 0" class="step-content">
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
                :loading="isProcessing" 
                size="large"
                icon="el-icon-download"
              >
                {{ ffmpegDownloaded ? '重新下载FFmpeg' : '开始下载FFmpeg' }}
              </el-button>
            </div>
            
            <el-progress 
              v-if="showDownloadProgress" 
              :percentage="downloadProgress" 
              :stroke-width="20" 
              :show-text="true"
              status="active"
              style="margin: 20px 0;"
            >
              <template #text>
                <span>{{ downloadProgress }}%</span>
              </template>
            </el-progress>
            
            <div v-if="ffmpegDownloaded" class="download-success">
              <el-icon class="success-icon"><CircleCheck /></el-icon>
              <span>FFmpeg下载完成！</span>
            </div>
          </div>
        </div>
        
        <!-- 步骤2：选择文件 -->
        <div v-else-if="currentStep === 1" class="step-content">
          <div class="file-selection">
            <el-empty 
              v-if="!selectedFilePath" 
              description="请选择要编辑的MKV文件"
              image-size="120"
            >
              <el-button 
                type="primary" 
                @click="selectFile" 
                :loading="isProcessing"
                icon="el-icon-folder-opened"
              >
                选择MKV文件
              </el-button>
            </el-empty>
            
            <div v-else class="file-info">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="文件名">
                  <el-tag type="info">{{ getFileName(selectedFilePath) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="文件路径">
                  <div class="file-path">{{ selectedFilePath }}</div>
                </el-descriptions-item>
                <el-descriptions-item label="操作">
                  <div class="file-actions">
                    <el-button 
                      type="primary" 
                      @click="parseChapters" 
                      :loading="isProcessing"
                      icon="el-icon-data-analysis"
                    >
                      解析章节信息
                    </el-button>
                    <el-button 
                      type="default" 
                      @click="selectedFilePath = null"
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
        
        <!-- 步骤3：编辑章节 -->
        <div v-else-if="currentStep === 2" class="step-content">
          <div class="chapter-editor">
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
                type="default" 
                @click="backToFileSelection"
                icon="el-icon-back"
              >
                返回文件选择
              </el-button>
              <el-button 
                type="success" 
                @click="saveChanges" 
                :loading="isProcessing" 
                icon="el-icon-check"
                size="large"
              >
                保存更改
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
      
      <!-- 处理状态提示 -->
      <el-alert
        v-if="isProcessing"
        :title="processingMessage"
        type="info"
        :closable="false"
        style="margin-bottom: 20px;"
      />
      
      <!-- FFmpeg进度条 -->
      <el-progress 
        v-if="showFFmpegProgress"
        :percentage="ffmpegProgress" 
        :stroke-width="15" 
        :show-text="true"
        style="margin-bottom: 20px;"
      >
        <template #text>
          <span>{{ ffmpegProgress.toFixed(1) }}%</span>
        </template>
      </el-progress>
      
      <!-- FFmpeg执行日志 -->
      <el-card v-if="logs" class="logs-card" shadow="hover">
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
        <el-scrollbar 
          height="200px" 
          class="logs-scrollbar"
          ref="scrollbarElement"
        >
          <pre class="logs-content">{{ logs }}</pre>
        </el-scrollbar>
      </el-card>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading, CircleCheck } from '@element-plus/icons-vue';

// 类型声明
interface Chapter {
  time: string;
  title: string;
  originalTitle: string;
  startTime: number;
}

// 步骤状态
const currentStep = ref<number>(0);
const ffmpegDownloaded = ref<boolean>(false);

// 文件和章节信息
const selectedFilePath = ref<string | null>(null);
const metadataPath = ref<string | null>(null);
const chapters = ref<Chapter[]>([]);

// 状态管理
const isProcessing = ref(false);
const processingMessage = ref('');
const logs = ref<string>('');
const downloadProgress = ref<number>(0);
const showDownloadProgress = ref<boolean>(false);
const ffmpegProgress = ref<number>(0);
const showFFmpegProgress = ref<boolean>(false);
let scrollbarElement: any = null;

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
  
  // 自动滚动到底部
  setTimeout(() => {
    if (scrollbarElement && scrollbarElement.wrap) {
      const wrapElement = scrollbarElement.wrap;
      wrapElement.scrollTop = wrapElement.scrollHeight;
    }
  }, 100);
  
  // 解析FFmpeg进度信息
  const progressMatch = logData.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
  if (progressMatch) {
    // 简单的进度计算，实际应该根据总时长
    ffmpegProgress.value = (ffmpegProgress.value + 0.5) % 100;
    showFFmpegProgress.value = true;
  }
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
  ffmpegDownloaded.value = true;
  currentStep.value = 1;
  isProcessing.value = false; // 隐藏加载动画
  ElMessage({
    message: 'FFmpeg下载完成，已准备就绪！',
    type: 'success'
  });
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

// 下载FFmpeg
const downloadFFmpeg = async () => {
  try {
    isProcessing.value = true;
    processingMessage.value = '正在下载FFmpeg...';
    clearLogs();
    
    // 显示下载进度条
    showDownloadProgress.value = true;
    downloadProgress.value = 0;
    
    // 下载FFmpeg
    await window.electronAPI.downloadFFmpeg();
    
    // 下载完成后会触发ffmpeg-download-complete事件，更新步骤
  } catch (error) {
    console.error('Error downloading FFmpeg:', error);
    ElMessage({
      message: `FFmpeg下载失败: ${error instanceof Error ? error.message : String(error)}`,
      type: 'error'
    });
    showDownloadProgress.value = false;
    isProcessing.value = false;
  }
};

// 选择MKV文件
const selectFile = async () => {
  try {
    isProcessing.value = true;
    processingMessage.value = '正在选择文件...';
    
    // 选择MKV文件
    const filePath = await window.electronAPI.selectMkvFile();
    if (!filePath) {
      isProcessing.value = false;
      return;
    }
    
    selectedFilePath.value = filePath;
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
    isProcessing.value = false;
  }
};

// 解析章节信息
const parseChapters = async () => {
  if (!selectedFilePath.value) return;
  
  try {
    isProcessing.value = true;
    showFFmpegProgress.value = true;
    ffmpegProgress.value = 0;
    processingMessage.value = '正在解析章节信息...';
    
    // 导出元数据
    const metadata = await window.electronAPI.exportMetadata(selectedFilePath.value);
    metadataPath.value = metadata;
    
    // 解析元数据，提取章节信息
    const chaptersList = await window.electronAPI.parseMetadata(metadata);
    chapters.value = chaptersList;
    
    // 进入下一步
    currentStep.value = 2;
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
    isProcessing.value = false;
    showFFmpegProgress.value = false;
    ffmpegProgress.value = 0;
  }
};

// 返回文件选择
const backToFileSelection = () => {
  currentStep.value = 1;
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
    showFFmpegProgress.value = false;
    ffmpegProgress.value = 0;
    processingMessage.value = '正在生成新的元数据文件...';
    
    // 更新元数据文件 - 将响应式对象转换为普通对象，避免IPC序列化错误
    const plainChapters = chapters.value.map(chapter => ({
      time: chapter.time,
      title: chapter.title,
      originalTitle: chapter.originalTitle,
      startTime: chapter.startTime
    }));
    const newMetadataPath = await window.electronAPI.updateMetadata(metadataPath.value, plainChapters);
    
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
    showFFmpegProgress.value = true;
    ffmpegProgress.value = 0;
    await window.electronAPI.importMetadata(selectedFilePath.value, newMetadataPath, outputFilePath);
    
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
    isProcessing.value = false;
    showFFmpegProgress.value = false;
    ffmpegProgress.value = 0;
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

.content-card, .logs-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-content {
  padding: 20px 0;
}

/* 步骤1：FFmpeg下载 */
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

/* 步骤2：选择文件 */
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

/* 步骤3：编辑章节 */
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

/* 日志区域 */
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
