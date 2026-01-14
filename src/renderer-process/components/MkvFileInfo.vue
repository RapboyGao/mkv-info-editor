<template>
  <div class="mkv-file-info">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>文件信息</h3>
          <el-button 
            type="primary" 
            @click="saveChanges" 
            size="small"
            :loading="isSaving"
          >
            <el-icon><Check /></el-icon>
            保存修改
          </el-button>
        </div>
      </template>
      
      <div class="info-content">
        <!-- 只读信息 -->
        <el-descriptions title="基本信息" :column="1" border>
          <el-descriptions-item label="文件名">{{ mkvFile?.fileName }}</el-descriptions-item>
          <el-descriptions-item label="文件路径">{{ mkvFile?.filePath }}</el-descriptions-item>
          <el-descriptions-item label="时长">{{ mkvFile?.formattedDuration }}</el-descriptions-item>
          <el-descriptions-item label="文件大小">{{ mkvFile?.formattedSize }}</el-descriptions-item>
          <el-descriptions-item label="格式">{{ mkvFile?.formatName }}</el-descriptions-item>
          <el-descriptions-item label="比特率" v-if="mkvFile?.bitRate">
            {{ (mkvFile.bitRate / 1000).toFixed(2) }} kbps
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 可编辑信息 -->
        <el-divider />
        
        <el-form :model="fileInfoForm" label-width="80px" size="small">
          <el-form-item label="标题">
            <el-input v-model="fileInfoForm.title" placeholder="请输入文件标题" />
          </el-form-item>
          <el-form-item label="编码器">
            <el-input v-model="fileInfoForm.encoder" placeholder="请输入编码器信息" />
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useAppStore } from '../stores/appStore';
import { ElMessage } from 'element-plus';
import { Check } from '@element-plus/icons-vue';

const appStore = useAppStore();

// 获取mkvFile对象
const mkvFile = computed(() => appStore.mkvFile);

// 保存状态
const isSaving = ref(false);

// 表单数据
const fileInfoForm = ref({
  title: '',
  encoder: ''
});

// 监听mkvFile变化，更新表单数据
watch(mkvFile, (newMkvFile) => {
  if (newMkvFile) {
    fileInfoForm.value = {
      title: newMkvFile.title || '',
      encoder: newMkvFile.encoder || ''
    };
  }
}, { immediate: true, deep: true });

// 保存修改
const saveChanges = () => {
  if (!appStore.mkvFile) return;
  
  try {
    isSaving.value = true;
    
    // 更新mkvFile对象
    appStore.mkvFile.title = fileInfoForm.value.title;
    appStore.mkvFile.encoder = fileInfoForm.value.encoder;
    
    ElMessage({
      message: '文件信息已更新！',
      type: 'success'
    });
  } catch (error) {
    console.error('Failed to save file info:', error);
    ElMessage({
      message: `保存失败: ${error instanceof Error ? error.message : String(error)}`,
      type: 'error'
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