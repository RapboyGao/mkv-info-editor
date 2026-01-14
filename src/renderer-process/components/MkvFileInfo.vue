<template>
  <div class="mkv-file-info">
    <!-- 只读信息 -->
    <el-descriptions :title="t('fileInfo.fileName')" :column="1" border>
      <el-descriptions-item :label="t('fileInfo.fileName')">{{
        mkvFile.filePath
      }}</el-descriptions-item>
      <el-descriptions-item :label="t('fileInfo.duration')">{{
        mkvFile.formattedDuration
      }}</el-descriptions-item>
      <el-descriptions-item :label="t('fileInfo.fileSize')">{{
        mkvFile.formattedSize
      }}</el-descriptions-item>
      <el-descriptions-item :label="t('fileInfo.format')">{{
        mkvFile.formatName
      }}</el-descriptions-item>
      <el-descriptions-item :label="t('fileInfo.codec')" v-if="mkvFile.bitRate">
        {{ (mkvFile.bitRate / 1000).toFixed(2) }} kbps
      </el-descriptions-item>
    </el-descriptions>

    <!-- 可编辑信息 -->
    <el-divider />

    <el-form label-width="80px" size="small">
      <el-form-item label="标题">
        <el-input
          v-model="localTitle"
          placeholder="{{ t('fileInfo.fileName') }}"
          @input="handleTitleChange"
        />
      </el-form-item>
      <el-form-item label="编码器">
        <el-input
          v-model="localEncoder"
          placeholder="{{ t('fileInfo.codec') }}"
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
import { useI18n } from "vue-i18n";

const { t } = useI18n();

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
