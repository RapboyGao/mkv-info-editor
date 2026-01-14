<template>
  <div>
    <!-- 触发编辑的链接 -->
    <el-link type="primary" @click="openModal">{{ chapterInstance.time }}</el-link>

    <!-- 全屏编辑模态框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑章节开始时间"
      width="100%"
      fullscreen
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :modal-append-to-body="true"
      :append-to-body="true"
      :modal="true"
      :z-index="9999"
    >
      <div class="fullscreen-editor">
        <el-form label-position="top" size="large">
          <el-form-item label="章节标题">
            <div class="editor-header">
              <h2>{{ localChapter.title }}</h2>
            </div>
          </el-form-item>

          <el-form-item label="小时">
            <el-input-number
              v-model="hours"
              :min="0"
              :max="maxHours"
              @change="updateTimeFromParts"
              :precision="0"
              size="large"
              placeholder="小时 (HH)"
            />
          </el-form-item>

          <el-form-item label="分钟">
            <el-input-number
              v-model="minutes"
              :min="0"
              :max="59"
              @change="updateTimeFromParts"
              :precision="0"
              size="large"
              placeholder="分钟 (MM)"
            />
          </el-form-item>

          <el-form-item label="秒">
            <el-input-number
              v-model="seconds"
              :min="0"
              :max="59.999"
              :step="0.1"
              :precision="3"
              @change="updateTimeFromParts"
              size="large"
              placeholder="秒 (SS.mmm)"
            />
          </el-form-item>

          <el-form-item label="当前时间预览">
            <div class="time-preview">
              <h3>{{ chapterInstance.time }}</h3>
            </div>
          </el-form-item>

          <el-form-item label="信息">
            <div class="editor-info">
              <p>总时长: {{ totalDurationFormatted }}</p>
              <p class="warning" v-if="isTimeOverLimit">
                ⚠️ 时间超过总时长，将自动调整
              </p>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="default" size="large" @click="cancel">
            <el-icon><Close /></el-icon>
            取消
          </el-button>
          <el-button type="primary" size="large" @click="save">
            <el-icon><Check /></el-icon>
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useAppStore } from "../stores/appStore";
import { ElMessage } from "element-plus";
import { Check, Close } from "@element-plus/icons-vue";
import type { ChapterData } from "@/shared";
import { Chapter } from "@/shared";

const appStore = useAppStore();

// Props
const props = defineProps<{
  chapter: ChapterData;
  chapterIndex: number;
}>();

// Emits
const emit = defineEmits<{
  (e: "save"): void;
  (e: "cancel"): void;
}>();

// Modal visibility
const dialogVisible = ref(false);

// Total duration in seconds and milliseconds
const totalDuration = computed(() => appStore.mkvFile?.duration || 100 * 3600);
const totalDurationFormatted = computed(() => {
  return secondsToTimeString(totalDuration.value);
});

// Maximum hours based on total duration
const maxHours = computed(() => Math.floor(totalDuration.value / 3600));

// Local copy of the chapter
const localChapter = ref<ChapterData>({ ...props.chapter });

// Chapter instance for accessing calculated properties
const chapterInstance = computed(() => new Chapter(localChapter.value));

// Time parts
const hours = ref(0);
const minutes = ref(0);
const seconds = ref(0.0);

// Check if time exceeds limit
const isTimeOverLimit = ref(false);

// Convert time string to time parts
const timeStringToParts = (timeStr: string) => {
  const [hoursStr, minutesStr, secondsMsStr] = timeStr.split(":");
  const [secondsStr, msStr] = secondsMsStr.split(".");

  return {
    hours: parseInt(hoursStr),
    minutes: parseInt(minutesStr),
    seconds: parseFloat(`${secondsStr}.${msStr}`),
  };
};

// Convert seconds to time string
const secondsToTimeString = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
};

// Update time parts from chapter time
const updatePartsFromTime = () => {
  // Create a Chapter instance to get the time string
  const chapterInstance = new Chapter(localChapter.value);
  const parts = timeStringToParts(chapterInstance.time);
  hours.value = parts.hours;
  minutes.value = parts.minutes;
  seconds.value = parts.seconds;
};

// Update chapter time from parts
const updateTimeFromParts = () => {
  // Calculate total seconds
  let totalSeconds = hours.value * 3600 + minutes.value * 60 + seconds.value;

  // Ensure time is within limits
  if (totalSeconds > totalDuration.value) {
    totalSeconds = totalDuration.value;
    isTimeOverLimit.value = true;

    // Update parts to match the clamped value
    const clampedParts = timeStringToParts(secondsToTimeString(totalSeconds));
    hours.value = clampedParts.hours;
    minutes.value = clampedParts.minutes;
    seconds.value = clampedParts.seconds;
  } else {
    isTimeOverLimit.value = false;
  }

  // Get denominator from timeBase
  const denominator = localChapter.value.timeBase ? parseInt(localChapter.value.timeBase.split('/')[1]) : 1000;
  // Update chapter start property based on timeBase
  localChapter.value.start = totalSeconds * denominator;
};

// Open the modal
const openModal = () => {
  // Reset local chapter to current props
  localChapter.value = { ...props.chapter };
  // Update time parts
  updatePartsFromTime();
  // Open modal
  dialogVisible.value = true;
};

// Save changes
const save = () => {
  // Ensure final validation
  updateTimeFromParts();

  // Update the chapter in the parent
  appStore.updateChapterTime(
    localChapter.value.id,
    localChapter.value.start,
    localChapter.value.end
  );

  // Close modal
  dialogVisible.value = false;

  ElMessage({
    message: "章节时间已保存",
    type: "success",
  });

  emit("save");
};

// Cancel changes
const cancel = () => {
  dialogVisible.value = false;
  emit("cancel");
};

// Initialize time parts
onMounted(() => {
  updatePartsFromTime();
});
</script>

<style scoped>
.fullscreen-editor {
  padding: 40px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 30px;
}

.editor-header {
  text-align: center;
  margin-bottom: 20px;
}

.editor-header h2 {
  font-size: 2rem;
  color: #333;
}

.time-inputs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 30px 0;
  flex-wrap: wrap;
}

.time-input-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.time-input-group label {
  font-size: 1rem;
  color: #666;
  font-weight: bold;
}

.time-separator {
  font-size: 3rem;
  color: #333;
  font-weight: bold;
  line-height: 1;
}

.time-preview {
  text-align: center;
  background: #f5f7fa;
  padding: 20px 40px;
  border-radius: 8px;
  margin: 20px 0;
}

.time-preview h3 {
  font-size: 1.5rem;
  color: #333;
  margin: 0;
}

.editor-info {
  text-align: center;
  color: #666;
  margin: 20px 0;
}

.editor-info p {
  margin: 5px 0;
}

.warning {
  color: #e6a23c !important;
  font-weight: bold;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
}
</style>
