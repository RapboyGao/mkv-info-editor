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
          v-model="localTitle"
          placeholder="请输入文件标题"
          @input="handleTitleChange"
        />
      </el-form-item>
      <el-form-item label="编码器">
        <el-input
          v-model="localEncoder"
          placeholder="请输入编码器信息"
          @input="handleEncoderChange"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { computed, ref, watch } from "vue";
import { MkvFile } from "@/shared";

// 定义props
const props = defineProps<{
  mkvFile: MkvFile;
}>();

// 定义emit
const emit = defineEmits<{
  (e: 'update:title', value: string): void;
  (e: 'update:encoder', value: string): void;
}>();

// 本地状态，用于双向绑定
const localTitle = ref(props.mkvFile.title);
const localEncoder = ref(props.mkvFile.encoder);

// 监听props变化，更新本地状态
watch(() => props.mkvFile.title, (newTitle) => {
  localTitle.value = newTitle;
});

watch(() => props.mkvFile.encoder, (newEncoder) => {
  localEncoder.value = newEncoder;
});

// 处理标题变化
const handleTitleChange = () => {
  emit('update:title', localTitle.value);
};

// 处理编码器变化
const handleEncoderChange = () => {
  emit('update:encoder', localEncoder.value);
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
