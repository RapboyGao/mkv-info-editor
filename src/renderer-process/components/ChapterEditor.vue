<template>
  <div class="step-content">
    <div class="chapter-editor">
      <div class="editor-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3>章节列表</h3>
        <el-button 
          type="primary" 
          @click="addChapter"
        >
          <el-icon><Plus /></el-icon>
          添加章节
        </el-button>
      </div>
      
      <el-table :data="appStore.chapters" style="width: 100%" border :row-key="'id'" fit>
        <el-table-column label="序号" width="60" align="center" type="index" :index="index => index + 1" />
        <el-table-column prop="time" label="开始时间" width="180" align="center" />
        <el-table-column prop="endTime" label="结束时间" width="180" align="center" />
        <el-table-column prop="originalTitle" label="原始标题" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <div class="original-title">{{ scope.row.originalTitle }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="修改后标题" min-width="200" show-overflow-tooltip flex-grow="1">
          <template #default="scope">
            <el-input 
              v-model="scope.row.title" 
              placeholder="请输入章节标题"
              size="small"
              style="width: 100%"
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
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="scope">
            <el-button 
              type="danger" 
              size="small" 
              @click="deleteChapter(scope.$index)"
              :disabled="appStore.chapters.length <= 1"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="action-buttons" style="margin-top: 20px; text-align: center;">
        <el-button 
          type="default" 
          @click="backToFileSelection"
        >
          <el-icon><Back /></el-icon>
          返回文件选择
        </el-button>
        <el-button 
          type="success" 
          @click="saveChanges" 
          :loading="appStore.isProcessing" 
          size="large"
        >
          <el-icon><Check /></el-icon>
          保存更改
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../stores/appStore';
import { ElMessage } from 'element-plus';
import { Plus, Delete, Back, Check } from '@element-plus/icons-vue';

const appStore = useAppStore();

// 返回文件选择
const backToFileSelection = () => {
  appStore.setCurrentStep(1);
};

// 获取文件名
const getFileName = (path: string): string => {
  return path.split('/').pop() || path;
};

// 添加章节
const addChapter = () => {
  // 生成随机ID
  const generateId = () => Math.random().toString(36).substring(2, 10);
  
  // 格式化时长为时间字符串
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };
  
  if (appStore.chapters.length === 0) {
    // 如果没有章节，添加第一个章节
    appStore.chapters.push({
      id: generateId(),
      time: '00:00:00.000',
      endTime: formatDuration(appStore.totalDuration),
      title: '新章节',
      originalTitle: '新章节',
      startTime: 0,
      startTimeSeconds: 0,
      endTimeSeconds: appStore.totalDuration
    });
  } else {
    // 获取最后一个章节
    const lastChapter = appStore.chapters[appStore.chapters.length - 1];
    
    // 添加新章节，开始时间为上一个章节的结束时间
    appStore.chapters.push({
      id: generateId(),
      time: lastChapter.endTime,
      endTime: formatDuration(appStore.totalDuration),
      title: '新章节',
      originalTitle: '新章节',
      startTime: lastChapter.endTimeSeconds * 1000, // 假设timebase为1000
      startTimeSeconds: lastChapter.endTimeSeconds,
      endTimeSeconds: appStore.totalDuration
    });
    
    // 更新上一个章节的结束时间
    appStore.chapters[appStore.chapters.length - 2].endTime = lastChapter.endTime;
  }
  
  // 按开始时间排序章节
  appStore.chapters.sort((a, b) => a.startTime - b.startTime);
};

// 删除章节
const deleteChapter = (index: number) => {
  if (appStore.chapters.length <= 1) {
    ElMessage({
      message: '至少需要保留一个章节',
      type: 'warning'
    });
    return;
  }
  
  // 删除章节
  appStore.chapters.splice(index, 1);
  
  // 按开始时间重新排序
  appStore.chapters.sort((a, b) => a.startTime - b.startTime);
  
  // 更新相邻章节的时间
  for (let i = 0; i < appStore.chapters.length; i++) {
    const currentChapter = appStore.chapters[i];
    const nextChapter = appStore.chapters[i + 1];
    
    if (nextChapter) {
      // 如果有下一个章节，当前章节的结束时间就是下一个章节的开始时间
      currentChapter.endTime = nextChapter.time;
      currentChapter.endTimeSeconds = nextChapter.startTimeSeconds;
    } else {
      // 最后一个章节，结束时间设置为MKV文件的总时长
      const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
      };
      
      currentChapter.endTime = formatDuration(appStore.totalDuration);
      currentChapter.endTimeSeconds = appStore.totalDuration;
    }
  }
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
      id: chapter.id,
      time: chapter.time,
      endTime: chapter.endTime,
      title: chapter.title,
      originalTitle: chapter.originalTitle,
      startTime: chapter.startTime,
      endTimeSeconds: chapter.endTimeSeconds
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
