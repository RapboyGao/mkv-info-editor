export default {
  app: {
    title: 'MKV章节编辑器',
    subtitle: '编辑MKV文件章节和元数据'
  },
  navigation: {
    home: '首页',
    ffmpegDownload: 'FFmpeg下载'
  },
  actions: {
    openFile: '打开文件',
    saveFile: '保存文件',
    saveAs: '另存为',
    generate: '生成',
    cancel: '取消',
    download: '下载',
    continue: '继续'
  },
  fileInfo: {
    fileName: '文件名',
    fileSize: '文件大小',
    duration: '时长',
    format: '格式',
    codec: '编码',
    resolution: '分辨率',
    chapters: '章节数'
  },
  chapterTable: {
    chapter: '章节',
    title: '标题',
    startTime: '开始时间',
    duration: '时长',
    actions: '操作',
    addChapter: '添加章节',
    deleteChapter: '删除章节',
    editStartTime: '编辑开始时间'
  },
  logs: {
    title: '日志',
    clearLogs: '清空日志'
  },
  progress: {
    progress: '进度',
    status: '状态',
    eta: '预计剩余时间',
    speed: '速度'
  },
  ffmpeg: {
    downloading: '正在下载FFmpeg...',
    extracting: '正在解压FFmpeg...',
    completed: 'FFmpeg下载完成',
    required: '处理MKV文件需要FFmpeg。请先下载。',
    downloadError: '下载FFmpeg失败。请重试。',
    extractError: '解压FFmpeg失败。请重试。'
  },
  messages: {
    selectFile: '请选择一个MKV文件开始编辑。',
    fileOpened: '文件打开成功。',
    fileSaved: '文件保存成功。',
    generatingFile: '正在生成新的MKV文件...',
    generationComplete: 'MKV文件生成成功。',
    generationError: '生成MKV文件失败。请查看日志获取详细信息。',
    processing: '处理中...',
    ready: '就绪'
  }
}