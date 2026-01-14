<template>
  <div class="step-content">
    <!-- 文件信息组件 -->
    <MkvFileInfo />

    <!-- 章节表头组件 -->
    <ChapterHeader @add="addChapter" />

    <!-- 章节表格组件 -->
    <ChapterTable
      :chapters="appStore.mkvFile.chapters"
      @chapter-updated="resortChapters"
      @chapter-deleted="handleChapterDeleted"
    />

    <!-- Metadata预览组件 -->
    <MkvMetadataPreview />

    <!-- 操作按钮组件 -->
    <ActionButtons @save="saveChanges" />
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { useAppStore } from "../stores/appStore";
import ActionButtons from "./ActionButtons.vue";
import ChapterHeader from "./ChapterHeader.vue";
import ChapterTable from "./ChapterTable.vue";
import MkvFileInfo from "./MkvFileInfo.vue";
import MkvMetadataPreview from "./MkvMetadataPreview.vue";

const appStore = useAppStore();

// 获取文件名
const getFileName = (path: string): string => {
  return path.split("/").pop() || path;
};

// 保存时间编辑
const resortChapters = () => {
  // 使用appStore中的方法来更新章节列表
  const sortedChapters = [...appStore.mkvFile.chapters].sort(
    (a, b) => a.start - b.start
  );
  appStore.setChapters(sortedChapters);
  // 更新章节结束时间
  appStore.updateChapterEndTimes();
};

// 处理章节删除
const handleChapterDeleted = (index: number) => {
  // 获取要删除的章节ID
  const chapterId = appStore.mkvFile.chapters[index].id;

  // 删除章节
  appStore.deleteChapter(chapterId);
};

// 添加章节
const addChapter = () => {
  // 生成随机ID
  const generateId = () => Math.random().toString(36).substring(2, 10);

  // 获取默认时间基
  const timeBase = "1/1000";

  if (!appStore.mkvFile?.chapters || appStore.mkvFile.chapters.length === 0) {
    // 如果没有章节，添加第一个章节
    appStore.addChapter({
      id: generateId(),
      start: 0,
      end: 0, // 结束时间会在addChapter方法中自动计算
      title: "新章节",
      originalTitle: "新章节",
      timeBase: timeBase,
    });
  } else {
    // 获取最后一个章节
    const chapters = appStore.mkvFile.chapters;
    const lastChapter = chapters[chapters.length - 1];

    // 添加新章节，开始时间为上一个章节的结束时间
    appStore.addChapter({
      id: generateId(),
      start: lastChapter.end,
      end: 0, // 结束时间会在addChapter方法中自动计算
      title: "新章节",
      originalTitle: "新章节",
      timeBase: lastChapter.timeBase || timeBase,
    });
  }
};

// 保存更改
const saveChanges = async () => {
  if (!appStore.mkvFile.isValid) {
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
    const outputFileName = getFileName(appStore.mkvFile.filePath).replace(
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
    const mkvFileJson = JSON.stringify(appStore.mkvFile);

    // 调用新的generateMkvFile方法，传递JSON字符串
    await window.electronAPI.generateMkvFile(
      appStore.mkvFile.filePath,
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
