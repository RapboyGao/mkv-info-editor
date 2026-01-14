import { createRouter, createWebHashHistory } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import FFmpegDownload from '../components/FFmpegDownload.vue';
import FileSelection from '../components/FileSelection.vue';
import ChapterEditor from '../components/ChapterEditor.vue';

const routes = [
  {
    path: '/',
    name: 'ffmpeg-download',
    component: FFmpegDownload,
    meta: {
      title: 'FFmpeg 下载',
      requiresFFmpeg: false
    }
  },
  {
    path: '/file-select',
    name: 'file-select',
    component: FileSelection,
    meta: {
      title: '选择 MKV 文件',
      requiresFFmpeg: true
    }
  },
  {
    path: '/chapter-editor',
    name: 'chapter-editor',
    component: ChapterEditor,
    meta: {
      title: '编辑章节信息',
      requiresFFmpeg: true
    }
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const appStore = useAppStore();
  document.title = to.meta.title as string || 'MKV章节名称编辑器';
  if (to.meta.requiresFFmpeg) {
    if (appStore.ffmpegDownloaded) {
      next();
    } else {
      next('/');
    }
  } else {
    next();
  }
});

export default router;
