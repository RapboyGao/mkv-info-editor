<template>
  <div class="file-editor-container">
    <!-- 文件选择部分 -->
    <el-empty 
      v-if="!appStore.mkvFile.isValid"
      :description="t('messages.selectFile')"
      :image-size="120"
      class="file-selection"
    >
      <el-button 
        type="primary" 
        @click="selectFile" 
        :loading="appStore.isProcessing"
      >
        <el-icon><FolderOpened /></el-icon>
        {{ t('actions.openFile') }}
      </el-button>
    </el-empty>
    
    <!-- 章节编辑部分 -->
    <template v-else>
      <!-- 文件信息组件 -->
      <MkvFileInfo
        :mkv-file="localMkvFile"
        @update:title="handleTitleChange"
        @update:encoder="handleEncoderChange"
      />

      <!-- 章节表头组件 -->
      <ChapterHeader @add="addChapter" />

      <!-- 章节表格组件 -->
      <ChapterTable
        :chapters="localMkvFile.chapters"
        :total-duration="localMkvFile.duration"
        @chapter-updated="resortChapters"
        @chapter-deleted="handleChapterDeleted"
        @chapter-title-updated="handleChapterTitleUpdated"
        @chapter-time-updated="handleChapterTimeUpdated"
      />

      <!-- Metadata预览组件 -->
      <MkvMetadataPreview :mkv-file="localMkvFile" />

      <!-- 操作按钮组件 -->
      <ActionButtons
        @save="saveChanges"
        @back="handleBack"
        :is-processing="isProcessing"
      />

      <!-- 进度显示组件 -->
      <MkvProgressDisplay :progress="localMkvFile.progress" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useAppStore } from "../stores/appStore";
import { ElMessage } from "element-plus";
import { FolderOpened, Refresh } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";
import ActionButtons from "../components/ActionButtons.vue";
import ChapterHeader from "../components/ChapterHeader.vue";
import ChapterTable from "../components/ChapterTable.vue";
import MkvFileInfo from "../components/MkvFileInfo.vue";
import MkvMetadataPreview from "../components/MkvMetadataPreview.vue";
import MkvProgressDisplay from "../components/MkvProgressDisplay.vue";

const { t } = useI18n();

const appStore = useAppStore();

// 本地状态，从appStore同步
const localMkvFile = computed(() => appStore.mkvFile);
const isProcessing = computed(() => appStore.isProcessing);

// 获取文件名
const getFileName = (path: string): string => {
  return path.split("/").pop() || path.split("\\").pop() || path;
};

// 选择MKV文件
const selectFile = async () => {
  try {
    appStore.setProcessing(true, '正在选择文件...');
    
    // 选择MKV文件
    const filePath = await window.electronAPI.selectMkvFile();
    if (!filePath) {
      appStore.setProcessing(false);
      return;
    }
    
    appStore.setProcessingMessage('正在获取文件信息...');
    appStore.updateFFmpegProgress(0);
    
    // 一次性获取MKV文件的所有信息
    const mkvFileData = await window.electronAPI.getMkvFileInfo(filePath);
    
    // 更新MKV文件信息
    appStore.setMkvFile(mkvFileData);
    
    ElMessage({
      message: `成功解析 ${mkvFileData.chapters.length} 个章节！`,
      type: 'success'
    });
  } catch (error) {
    console.error('Error selecting file:', error);
    ElMessage({
      message: `文件处理失败: ${error instanceof Error ? error.message : String(error)}`,
      type: 'error'
    });
  } finally {
    appStore.setProcessing(false);
    appStore.resetFFmpegProgress();
  }
};

// 保存时间编辑
const resortChapters = () => {
  // 排序章节
  const sortedChapters = [...localMkvFile.value.chapters].sort(
    (a, b) => a.start - b.start
  );

  // 更新章节列表
  localMkvFile.value.setChapters(sortedChapters);
  // 更新章节结束时间
  localMkvFile.value.updateChapterEndTimes();

  // 由于localMkvFile是computed，我们需要通过appStore更新
  appStore.updateMkvFile(localMkvFile.value);
};

// 处理章节删除
const handleChapterDeleted = (index: number) => {
  // 获取要删除的章节ID
  const chapterId = localMkvFile.value.chapters[index].id;

  // 删除章节
  localMkvFile.value.deleteChapter(chapterId);

  // 通过appStore更新
  appStore.updateMkvFile(localMkvFile.value);
};

// 处理章节标题更新
const handleChapterTitleUpdated = (index: number, title: string) => {
  // 更新章节标题
  localMkvFile.value.updateChapterTitle(localMkvFile.value.chapters[index].id, title);

  // 通过appStore更新
  appStore.updateMkvFile(localMkvFile.value);
};

// 处理章节时间更新
const handleChapterTimeUpdated = (updatedChapter: any) => {
  // 更新章节时间
  localMkvFile.value.updateChapterTime(updatedChapter.id, updatedChapter.start, updatedChapter.end);
  // 更新章节结束时间
  localMkvFile.value.updateChapterEndTimes();

  // 通过appStore更新
  appStore.updateMkvFile(localMkvFile.value);
};

// 添加章节
const addChapter = () => {
  // 生成随机ID
  const generateId = () => Math.random().toString(36).substring(2, 10);

  // 获取默认时间基
  const timeBase = "1/1000";

  if (
    !localMkvFile.value.chapters ||
    localMkvFile.value.chapters.length === 0
  ) {
    // 如果没有章节，添加第一个章节
    localMkvFile.value.addChapter({
      id: generateId(),
      start: 0,
      end: 0, // 结束时间会在addChapter方法中自动计算
      title: "新章节",
      originalTitle: "新章节",
      timeBase: timeBase,
    });
  } else {
    // 获取最后一个章节
    const chapters = localMkvFile.value.chapters;
    const lastChapter = chapters[chapters.length - 1];

    // 添加新章节，开始时间为上一个章节的结束时间
    localMkvFile.value.addChapter({
      id: generateId(),
      start: lastChapter.end,
      end: 0, // 结束时间会在addChapter方法中自动计算
      title: "新章节",
      originalTitle: "新章节",
      timeBase: lastChapter.timeBase || timeBase,
    });
  }

  // 通过appStore更新
  appStore.updateMkvFile(localMkvFile.value);
};

// 处理标题变化
const handleTitleChange = (newTitle: string) => {
  localMkvFile.value.title = newTitle;
  appStore.updateMkvFile(localMkvFile.value);
};

// 处理编码器变化
const handleEncoderChange = (newEncoder: string) => {
  localMkvFile.value.encoder = newEncoder;
  appStore.updateMkvFile(localMkvFile.value);
};

// 处理返回按钮点击
const handleBack = () => {
  appStore.setMkvFile(null);
};

// 保存更改
const saveChanges = async () => {
  if (!localMkvFile.value.isValid) {
    ElMessage({
      message: "请先选择MKV文件",
      type: "error",
    });
    return;
  }

  try {
    appStore.setProcessing(true, "正在准备生成新的MKV文件...");
    appStore.resetFFmpegProgress();

    // 选择输出文件路径
    appStore.setProcessingMessage("正在选择输出文件...");
    const outputFileName = getFileName(localMkvFile.value.filePath).replace(
      ".mkv",
      "_edited.mkv"
    );
    const outputFilePath = await window.electronAPI.saveMkvFile(outputFileName);

    if (!outputFilePath) {
      appStore.setProcessing(false);
      return;
    }

    // 生成新的MKV文件
    appStore.setProcessingMessage("正在生成新的MKV文件...");
    appStore.updateFFmpegProgress(0);

    // 转换为JSON字符串
    const mkvFileJson = JSON.stringify(localMkvFile.value);

    // 调用新的generateMkvFile方法，传递JSON字符串
    await window.electronAPI.generateMkvFile(
      localMkvFile.value.filePath,
      mkvFileJson,
      outputFilePath
    );

    ElMessage({
      message: "章节信息已成功保存到新的MKV文件！",
      type: "success",
    });
  } catch (error) {
    console.error("Error saving changes:", error);
    ElMessage({
      message: `保存失败: ${error instanceof Error ? error.message : String(error)}`,
      type: "error",
    });
  } finally {
    appStore.setProcessing(false);
    appStore.resetFFmpegProgress();
  }
};
</script>

<style scoped>
.file-editor-container {
  padding: 20px;
}

.file-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
  min-height: 400px;
}

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
</style>
