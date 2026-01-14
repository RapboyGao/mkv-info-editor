<template>
  <div class="mkv-file-info">
    <!-- 只读信息 -->
    <el-descriptions title="基本信息" :column="1" border>
      <el-descriptions-item label="文件路径">{{
        mkvFile.filePath
      }}</el-descriptions-item>
      <el-descriptions-item label="时长">{{
        mkvFile.formattedDuration
      }}</el-descriptions-item>
      <el-descriptions-item label="文件大小">{{
        mkvFile.formattedSize
      }}</el-descriptions-item>
      <el-descriptions-item label="格式">{{
        mkvFile.formatName
      }}</el-descriptions-item>
      <el-descriptions-item label="比特率" v-if="mkvFile.bitRate">
        {{ (mkvFile.bitRate / 1000).toFixed(2) }} kbps
      </el-descriptions-item>
    </el-descriptions>

    <!-- 可编辑信息 -->
    <el-divider />

    <el-form label-width="80px" size="small">
      <el-form-item label="标题">
        <el-input
          v-model="appStore.mkvFile.title"
          placeholder="请输入文件标题"
        />
      </el-form-item>
      <el-form-item label="编码器">
        <el-input
          v-model="appStore.mkvFile.encoder"
          placeholder="请输入编码器信息"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { computed, ref, watch } from "vue";
import { useAppStore } from "../stores/appStore";

const appStore = useAppStore();

// 获取mkvFile对象
const mkvFile = computed(() => appStore.mkvFile);

// 保存状态
const isSaving = ref(false);

// 保存修改
const saveChanges = () => {
  try {
    isSaving.value = true;

    ElMessage({
      message: "文件信息已更新！",
      type: "success",
    });
  } catch (error) {
    console.error("Failed to save file info:", error);
    ElMessage({
      message: `保存失败: ${error instanceof Error ? error.message : String(error)}`,
      type: "error",
    });
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.mkv-file-info {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-content {
  padding: 10px 0;
}
</style>
