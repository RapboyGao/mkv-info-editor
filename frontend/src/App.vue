<template>
  <div>
    <h1>MKV章节编辑器</h1>
    
    <div>
      <label for="mkvFile">选择MKV文件：</label>
      <input type="file" id="mkvFile" accept=".mkv" @change="onFileSelect" />
      <button @click="loadMetadata">加载元数据</button>
    </div>
    
    <div v-if="chapters.length > 0" class="chapter-list">
      <h2>章节列表</h2>
      <div v-for="(chapter, index) in chapters" :key="index" class="chapter-item">
        <span class="chapter-time">{{ chapter.time }}</span>
        <input v-model="chapter.title" placeholder="章节标题" />
      </div>
      
      <div>
        <button @click="saveMetadata">保存元数据</button>
        <button @click="exportMKV">导出MKV</button>
      </div>
    </div>
    
    <div v-if="message" class="message">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const mkvFile = ref(null);
const chapters = ref([]);
const message = ref('');

const onFileSelect = (event) => {
  mkvFile.value = event.target.files[0];
  message.value = `已选择文件：${mkvFile.value.name}`;
};

const loadMetadata = async () => {
  if (!mkvFile.value) {
    message.value = '请先选择MKV文件';
    return;
  }
  
  message.value = '正在加载元数据...';
  
  try {
    // 调用后端API加载元数据
    const result = await window.go.main.LoadMetadata(mkvFile.value.path);
    chapters.value = result.chapters;
    message.value = '元数据加载成功';
  } catch (error) {
    message.value = `加载失败：${error.message}`;
  }
};

const saveMetadata = async () => {
  if (chapters.value.length === 0) {
    message.value = '请先加载元数据';
    return;
  }
  
  message.value = '正在保存元数据...';
  
  try {
    const result = await window.go.main.SaveMetadata(chapters.value);
    message.value = result.message;
  } catch (error) {
    message.value = `保存失败：${error.message}`;
  }
};

const exportMKV = async () => {
  if (!mkvFile.value || chapters.value.length === 0) {
    message.value = '请先选择文件并加载元数据';
    return;
  }
  
  message.value = '正在导出MKV...';
  
  try {
    const result = await window.go.main.ExportMKV(mkvFile.value.path, chapters.value);
    message.value = `导出成功：${result.outputPath}`;
  } catch (error) {
    message.value = `导出失败：${error.message}`;
  }
};
</script>

<style scoped>
.message {
  margin-top: 20px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-size: 14px;
}
</style>