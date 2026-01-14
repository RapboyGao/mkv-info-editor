import { createRouter, createWebHashHistory } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import FFmpegDownload from '../pages/FFmpegDownload.vue';
import FileEditor from '../pages/FileEditor.vue';

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
    path: '/file-editor',
    name: 'file-editor',
    component: FileEditor,
    meta: {
      title: 'MKV 文件编辑器',
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
