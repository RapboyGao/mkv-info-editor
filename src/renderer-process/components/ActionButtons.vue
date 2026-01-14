<template>
  <div class="action-buttons">
    <el-button type="default" @click="backToFileSelection">
      <el-icon><Back /></el-icon>
    </el-button>
    <el-button type="success" @click="saveChanges" :loading="isProcessing">
      <el-icon><Check /></el-icon>
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { Back, Check } from "@element-plus/icons-vue";

// 定义props
const props = defineProps<{
  isProcessing: boolean;
}>();

// 定义事件
const emit = defineEmits<{
  (e: "save"): void;
  (e: "back"): void;
}>();

// 返回文件选择
const backToFileSelection = () => {
  emit("back");
};

// 保存更改
const saveChanges = () => {
  emit("save");
};
</script>

<style scoped>
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}
</style>
