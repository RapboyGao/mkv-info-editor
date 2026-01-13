<template>
  <div class="app-container">
    <h1>MKV章节名称编辑器</h1>
    <div class="main-content">
      <div class="file-selection">
        <button @click="selectFile" class="btn-primary" :disabled="isProcessing">选择MKV文件</button>
        <p v-if="selectedFilePath">已选择: {{ getFileName(selectedFilePath) }}</p>
      </div>
      
      <div v-if="chapters.length > 0" class="chapter-editor">
        <h2>章节列表</h2>
        <div class="chapter-list">
          <div 
            v-for="(chapter, index) in chapters" 
            :key="index" 
            class="chapter-item"
          >
            <div class="chapter-time">{{ chapter.time }}</div>
            <input 
              type="text" 
              v-model="chapter.title" 
              class="chapter-title-input"
              placeholder="章节标题"
            />
          </div>
        </div>
        
        <div class="action-buttons">
          <button @click="saveChanges" class="btn-primary" :disabled="isProcessing">保存更改</button>
        </div>
      </div>
      
      <div v-if="message" class="message {{ message.type }}">
        {{ message.text }}
      </div>
      
      <div v-if="isProcessing" class="processing-indicator">
        <div class="spinner"></div>
        <p>{{ processingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import fs from 'fs-extra';

interface Chapter {
  time: string;
  title: string;
  startTime: number;
}

const selectedFilePath = ref<string | null>(null);
const metadataPath = ref<string | null>(null);
const chapters = ref<Chapter[]>([]);
const message = ref<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
const isProcessing = ref(false);
const processingMessage = ref('');

// 类型声明，扩展window对象
declare global {
  interface Window {
    electronAPI: {
      selectMkvFile: () => Promise<string | null>;
      saveMkvFile: (defaultPath: string) => Promise<string | null>;
      downloadFFmpeg: () => Promise<string>;
      exportMetadata: (inputPath: string) => Promise<string>;
      importMetadata: (inputPath: string, metadataPath: string, outputPath: string) => Promise<boolean>;
    };
  }
}

// 获取文件名
const getFileName = (path: string): string => {
  return path.split('/').pop() || path;
};

// 选择MKV文件
const selectFile = async () => {
  try {
    isProcessing.value = true;
    processingMessage.value = '正在选择文件...';
    
    // 下载FFmpeg（如果尚未下载）
    await window.electronAPI.downloadFFmpeg();
    
    // 选择MKV文件
    const filePath = await window.electronAPI.selectMkvFile();
    if (!filePath) {
      isProcessing.value = false;
      return;
    }
    
    selectedFilePath.value = filePath;
    
    // 导出元数据
    processingMessage.value = '正在导出元数据...';
    const metadata = await window.electronAPI.exportMetadata(filePath);
    metadataPath.value = metadata;
    
    // 解析元数据，提取章节信息
    await parseMetadata(metadata);
    
    message.value = { type: 'success', text: '元数据导出成功，章节信息已加载' };
  } catch (error) {
    console.error('Error selecting file:', error);
    message.value = { type: 'error', text: `操作失败: ${error instanceof Error ? error.message : String(error)}` };
  } finally {
    isProcessing.value = false;
  }
};

// 解析元数据文件，提取章节信息
const parseMetadata = async (metadataPath: string) => {
  const content = await fs.readFile(metadataPath, 'utf-8');
  const lines = content.split('\n');
  
  const chaptersList: Chapter[] = [];
  let currentChapter: Partial<Chapter> = {};
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('[CHAPTER]')) {
      // 新章节开始，保存之前的章节（如果有）
      if (currentChapter.time && currentChapter.startTime !== undefined) {
        chaptersList.push({
          time: currentChapter.time,
          title: currentChapter.title || '',
          startTime: currentChapter.startTime
        });
      }
      // 重置当前章节
      currentChapter = {};
    } else if (trimmedLine.startsWith('TIMEBASE=')) {
      // 跳过TIMEBASE行
      continue;
    } else if (trimmedLine.startsWith('START=')) {
      // 解析开始时间
      const startTime = parseInt(trimmedLine.split('=')[1]);
      currentChapter.startTime = startTime;
      // 转换为HH:MM:SS.ms格式
      const seconds = startTime / 1000;
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      currentChapter.time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    } else if (trimmedLine.startsWith('title=')) {
      // 解析章节标题
      currentChapter.title = trimmedLine.split('=')[1];
    }
  }
  
  // 保存最后一个章节
  if (currentChapter.time && currentChapter.startTime !== undefined) {
    chaptersList.push({
      time: currentChapter.time,
      title: currentChapter.title || '',
      startTime: currentChapter.startTime
    });
  }
  
  chapters.value = chaptersList;
};

// 保存更改
const saveChanges = async () => {
  if (!selectedFilePath.value || !metadataPath.value) {
    message.value = { type: 'error', text: '请先选择MKV文件' };
    return;
  }
  
  try {
    isProcessing.value = true;
    processingMessage.value = '正在生成新的元数据文件...';
    
    // 生成新的元数据内容
    const originalContent = await fs.readFile(metadataPath.value, 'utf-8');
    const newContent = updateMetadataWithChapters(originalContent, chapters.value);
    
    // 保存新的元数据文件
    const newMetadataPath = metadataPath.value + '.new';
    await fs.writeFile(newMetadataPath, newContent, 'utf-8');
    
    // 选择输出文件路径
    processingMessage.value = '正在选择输出文件...';
    const outputFileName = getFileName(selectedFilePath.value).replace('.mkv', '_edited.mkv');
    const outputFilePath = await window.electronAPI.saveMkvFile(outputFileName);
    
    if (!outputFilePath) {
      isProcessing.value = false;
      return;
    }
    
    // 导入元数据
    processingMessage.value = '正在导入元数据到MKV文件...';
    await window.electronAPI.importMetadata(selectedFilePath.value, newMetadataPath, outputFilePath);
    
    message.value = { type: 'success', text: '章节信息已成功保存到新的MKV文件' };
    
    // 清理临时文件
    await fs.unlink(newMetadataPath);
  } catch (error) {
    console.error('Error saving changes:', error);
    message.value = { type: 'error', text: `保存失败: ${error instanceof Error ? error.message : String(error)}` };
  } finally {
    isProcessing.value = false;
  }
};

// 更新元数据内容，替换章节标题
const updateMetadataWithChapters = (originalContent: string, chapters: Chapter[]): string => {
  const lines = originalContent.split('\n');
  const newLines: string[] = [];
  let chapterIndex = 0;
  let inChapter = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('[CHAPTER]')) {
      inChapter = true;
      newLines.push(line);
    } else if (inChapter && trimmedLine.startsWith('title=')) {
      // 更新章节标题
      if (chapterIndex < chapters.length) {
        newLines.push(`title=${chapters[chapterIndex].title}`);
        chapterIndex++;
      } else {
        newLines.push(line);
      }
    } else if (inChapter && trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
      // 章节结束，遇到新的section
      inChapter = false;
      newLines.push(line);
    } else {
      newLines.push(line);
    }
  }
  
  return newLines.join('\n');
};
</script>

<style scoped>
.app-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #333;
  text-align: center;
}

.main-content {
  margin-top: 30px;
}

.file-selection {
  margin-bottom: 30px;
  text-align: center;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: #45a049;
}

.chapter-editor {
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
}

.chapter-list {
  margin-top: 20px;
}

.chapter-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chapter-time {
  width: 120px;
  font-weight: bold;
  color: #666;
}

.chapter-title-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.action-buttons {
  margin-top: 20px;
  text-align: center;
}

.message {
  margin-top: 20px;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
}

.message.info {
  background-color: #d1ecf1;
  color: #0c5460;
}
</style>
