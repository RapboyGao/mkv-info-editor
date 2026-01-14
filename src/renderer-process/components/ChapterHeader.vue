<template>
  <div class="editor-header">
    <h3>章节列表</h3>
    <div style="display: flex; gap: 10px">
      <el-button type="primary" @click="addChapter">
        <el-icon><Plus /></el-icon>
        添加章节
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';

// 定义事件
const emit = defineEmits<{
  (e: 'add'): void;
}>();

// 添加章节
const addChapter = () => {
  emit('add');
};
</script>

<style scoped>
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>