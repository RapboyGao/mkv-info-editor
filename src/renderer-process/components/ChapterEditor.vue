<template>
  <div class="step-content">
    <div class="chapter-editor">
      <div
        class="editor-header"
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        "
      >
        <h3>章节列表</h3>
        <div style="display: flex; gap: 10px">
          <el-button type="primary" @click="addChapter">
            <el-icon><Plus /></el-icon>
            添加章节
          </el-button>
        </div>
      </div>

      <el-table
        :data="appStore.mkvFile?.chapters || []"
        style="width: 100%"
        border
        :row-key="'id'"
        fit
      >
        <el-table-column label="序号" width="60" align="center" type="index" />
        <el-table-column label="开始时间" width="250" align="center">
          <template #default="scope">
            <ChapterStartTimeEditor
              :chapter="scope.row"
              :chapter-index="scope.$index"
              @save="resortChapters"
              @cancel="handleTimeCancel"
            />
          </template>
        </el-table-column>
        <el-table-column label="结束时间" width="180" align="center">
          <template #default="scope">
            {{ chapterInstances[scope.$index].endTime }}
          </template>
        </el-table-column>
        <el-table-column
          prop="title"
          label="修改后标题"
          min-width="200"
          show-overflow-tooltip
          flex-grow="1"
        >
          <template #default="scope">
            <el-input
              v-model="scope.row.title"
              placeholder="请输入章节标题"
              style="width: 100%"
            />
          </template>
        </el-table-column>
        <el-table-column
          prop="originalTitle"
          label="原始标题"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="scope">
            <div class="original-title">{{ scope.row.originalTitle }}</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="scope">
            <el-button
                type="danger"
                size="small"
                @click="deleteChapter(scope.$index)"
                :disabled="(appStore.mkvFile?.chapters || []).length <= 1"
              >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="action-buttons" style="margin-top: 20px; text-align: center">
        <el-button type="default" @click="backToFileSelection">
          <el-icon><Back /></el-icon>
          返回文件选择
        </el-button>
        <el-button
          type="success"
          @click="saveChanges"
          :loading="appStore.isProcessing"
          size="large"
        >
          <el-icon><Check /></el-icon>
          保存更改
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useAppStore } from "../stores/appStore";
import { ElMessage } from "element-plus";
import { Plus, Delete, Back, Check } from "@element-plus/icons-vue";
import ChapterStartTimeEditor from "./ChapterStartTimeEditor.vue";
import { Chapter } from "../../shared/types";

const appStore = useAppStore();

// 创建Chapter实例数组，用于访问计算属性
const chapterInstances = computed(() => {
  return (appStore.mkvFile?.chapters || []).map(chapter => new Chapter(chapter));
});

// 返回文件选择
const backToFileSelection = () => {
  appStore.setCurrentStep(1);
};

// 获取文件名
const getFileName = (path: string): string => {
  return path.split("/").pop() || path;
};

// 保存时间编辑
const resortChapters = () => {
  if (appStore.mkvFile?.chapters) {
    // 使用appStore中的方法来更新章节列表
    const sortedChapters = [...appStore.mkvFile.chapters].sort((a, b) => a.start - b.start);
    appStore.setChapters(sortedChapters);
    // 更新章节结束时间
    appStore.updateChapterEndTimes();
  }
};

// 取消时间编辑
const handleTimeCancel = () => {
  // 时间编辑组件已经在内部处理了取消
};

// 添加章节
const addChapter = () => {
  // 生成随机ID
  const generateId = () => Math.random().toString(36).substring(2, 10);
  
  // 获取默认时间基
  const timeBase = '1/1000';

  if (!appStore.mkvFile?.chapters || appStore.mkvFile.chapters.length === 0) {
    // 如果没有章节，添加第一个章节
    appStore.addChapter({
      id: generateId(),
      start: 0,
      end: 0, // 结束时间会在addChapter方法中自动计算
      title: "新章节",
      originalTitle: "新章节",
      timeBase: timeBase
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
      timeBase: lastChapter.timeBase || timeBase
    });
  }
};

// 删除章节
const deleteChapter = (index: number) => {
  if (!appStore.mkvFile?.chapters || appStore.mkvFile.chapters.length <= 1) {
    ElMessage({
      message: "至少需要保留一个章节",
      type: "warning",
    });
    return;
  }

  // 获取要删除的章节ID
  const chapterId = appStore.mkvFile.chapters[index].id;
  
  // 删除章节
  appStore.deleteChapter(chapterId);
};

// 保存更改
const saveChanges = async () => {
  if (!appStore.mkvFile?.filePath || !appStore.mkvFile?.metadata) {
    ElMessage({
      message: "请先选择MKV文件",
      type: "error",
    });
    return;
  }

  try {
    appStore.setProcessing(true, "正在生成新的元数据文件...");
    appStore.resetFFmpegProgress();

    // 更新元数据文件 - 将响应式对象转换为普通对象，避免IPC序列化错误
    const plainChapters = (appStore.mkvFile?.chapters || []).map((chapter) => ({
      id: chapter.id,
      start: chapter.start,
      end: chapter.end,
      title: chapter.title,
      originalTitle: chapter.originalTitle
    }));
    const newMetadataPath = await window.electronAPI.updateMetadata(
      appStore.mkvFile.metadata,
      plainChapters
    );

    // 选择输出文件路径
    appStore.setProcessingMessage("正在选择输出文件...");
    const outputFileName = getFileName(appStore.mkvFile?.filePath || "").replace(
      ".mkv",
      "_edited.mkv"
    );
    const outputFilePath = await window.electronAPI.saveMkvFile(outputFileName);

    if (!outputFilePath) {
      appStore.setProcessing(false);
      // 删除临时文件
      await window.electronAPI.deleteFile(newMetadataPath);
      return;
    }

    // 导入元数据
    appStore.setProcessingMessage("正在导入元数据到MKV文件...");
    appStore.updateFFmpegProgress(0);
    await window.electronAPI.importMetadata(
      appStore.mkvFile?.filePath || "",
      newMetadataPath,
      outputFilePath
    );

    ElMessage({
      message: "章节信息已成功保存到新的MKV文件！",
      type: "success",
    });

    // 清理临时文件
    await window.electronAPI.deleteFile(newMetadataPath);
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
