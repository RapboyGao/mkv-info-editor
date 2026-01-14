<template>
  <el-table :data="chapters" style="width: 100%" border :row-key="'id'" fit>
    <el-table-column label="序号" width="60" align="center" type="index" />
    <el-table-column label="开始时间" width="250" align="center">
      <template #default="scope">
        <ChapterStartTimeEditor
          :chapter="scope.row"
          :chapter-index="scope.$index"
          :total-duration="totalDuration"
          @save="handleStartTimeSave"
          @cancel="handleCancel"
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
          @input="handleTitleChange(scope.$index, scope.row.title)"
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
          :disabled="chapters.length <= 1"
        >
          <el-icon><Delete /></el-icon>
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElMessage } from "element-plus";
import { Delete } from "@element-plus/icons-vue";
import ChapterStartTimeEditor from "./ChapterStartTimeEditor.vue";
import { Chapter, ChapterData } from "@/shared";

// Props定义
const props = defineProps<{
  chapters: ChapterData[];
  totalDuration?: number;
}>();

// Emits定义
const emit = defineEmits<{
  (e: "chapter-updated"): void;
  (e: "chapter-deleted", index: number): void;
  (e: "chapter-title-updated", index: number, title: string): void;
  (e: "chapter-time-updated", chapter: ChapterData): void;
}>();

// 默认总时长
const defaultTotalDuration = 100 * 3600; // 默认100小时

// 获取总时长
const totalDuration = computed(() => {
  return props.totalDuration || defaultTotalDuration;
});

// 创建Chapter实例数组，用于访问计算属性
const chapterInstances = computed(() => {
  return props.chapters.map((chapter) => new Chapter(chapter));
});

// 保存开始时间编辑
const handleStartTimeSave = (updatedChapter: ChapterData) => {
  emit("chapter-time-updated", updatedChapter);
  emit("chapter-updated");
};

// 处理标题变化
const handleTitleChange = (index: number, title: string) => {
  emit("chapter-title-updated", index, title);
};

// 取消时间编辑
const handleCancel = () => {
  // 时间编辑组件已经在内部处理了取消
};

// 删除章节
const deleteChapter = (index: number) => {
  if (props.chapters.length <= 1) {
    ElMessage({
      message: "至少需要保留一个章节",
      type: "warning",
    });
    return;
  }

  emit("chapter-deleted", index);
};
</script>

<style scoped>
.original-title {
  font-style: italic;
  color: #909399;
  word-break: break-all;
}
</style>
