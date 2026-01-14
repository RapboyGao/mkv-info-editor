<template>
  <div class="progress-display">
    <el-card shadow="hover" title="FFmpeg 进度信息" v-if="progress">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="已处理帧数">
          {{ progress.frame }}
        </el-descriptions-item>
        <el-descriptions-item label="帧率 (fps)">
          {{ progress.fps }}
        </el-descriptions-item>
        <el-descriptions-item label="输出文件大小">
          {{ progress.size }}
        </el-descriptions-item>
        <el-descriptions-item label="当前处理时间">
          {{ progress.time === 'N/A' ? '计算中...' : progress.time }}
        </el-descriptions-item>
        <el-descriptions-item label="比特率">
          {{ progress.bitrate }}
        </el-descriptions-item>
        <el-descriptions-item label="处理速度">
          {{ progress.speed }}
        </el-descriptions-item>
        <el-descriptions-item label="已用时间" :span="2">
          {{ progress.elapsed }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { MKVProgress } from '@/shared';

// 定义props
const props = defineProps<{
  progress: MKVProgress | undefined;
}>();
</script>

<style scoped>
.progress-display {
  margin-top: 20px;
  width: 100%;
}

:deep(.el-card__header) {
  background-color: #f0f2f5;
  font-weight: bold;
}

:deep(.el-descriptions__label) {
  font-weight: bold;
  color: #303133;
}

:deep(.el-descriptions__content) {
  color: #606266;
}
</style>
