<template>
  <div class="action-buttons">
    <el-button type="default" @click="backToFileSelection">
      <el-icon><Back /></el-icon>
      返回文件选择
    </el-button>
    <el-button
      type="success"
      @click="saveChanges"
      :loading="isProcessing"
      size="large"
    >
      <el-icon><Check /></el-icon>
      保存更改
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '../stores/appStore';
import { Back, Check } from '@element-plus/icons-vue';

const appStore = useAppStore();

// 从store获取处理状态
const isProcessing = computed(() => appStore.isProcessing);

// 返回文件选择
const backToFileSelection = () => {
  appStore.setCurrentStep(1);
};

// 保存更改
const saveChanges = () => {
  // 触发父组件的保存事件
  emit('save');
};

// 定义事件
const emit = defineEmits<{
  (e: 'save'): void;
}>();
</script>

<style scoped>
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}
</style>