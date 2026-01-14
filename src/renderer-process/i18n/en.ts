export default {
  app: {
    title: 'MKV Chapter Editor',
    subtitle: 'Edit MKV file chapters and metadata'
  },
  navigation: {
    home: 'Home',
    ffmpegDownload: 'FFmpeg Download'
  },
  actions: {
    openFile: 'Open File',
    saveFile: 'Save File',
    saveAs: 'Save As',
    generate: 'Generate',
    cancel: 'Cancel',
    download: 'Download',
    continue: 'Continue'
  },
  fileInfo: {
    fileName: 'File Name',
    fileSize: 'File Size',
    duration: 'Duration',
    format: 'Format',
    codec: 'Codec',
    resolution: 'Resolution',
    chapters: 'Chapters'
  },
  chapterTable: {
    chapter: 'Chapter',
    title: 'Title',
    startTime: 'Start Time',
    duration: 'Duration',
    actions: 'Actions',
    addChapter: 'Add Chapter',
    deleteChapter: 'Delete Chapter',
    editStartTime: 'Edit Start Time'
  },
  logs: {
    title: 'Logs',
    clearLogs: 'Clear Logs'
  },
  progress: {
    progress: 'Progress',
    status: 'Status',
    eta: 'ETA',
    speed: 'Speed'
  },
  ffmpeg: {
    downloading: 'Downloading FFmpeg...',
    extracting: 'Extracting FFmpeg...',
    completed: 'FFmpeg Download Completed',
    required: 'FFmpeg is required to process MKV files. Please download it first.',
    downloadError: 'Failed to download FFmpeg. Please try again.',
    extractError: 'Failed to extract FFmpeg. Please try again.'
  },
  messages: {
    selectFile: 'Please select an MKV file to start editing.',
    fileOpened: 'File opened successfully.',
    fileSaved: 'File saved successfully.',
    generatingFile: 'Generating new MKV file...',
    generationComplete: 'MKV file generated successfully.',
    generationError: 'Failed to generate MKV file. Please check the logs for details.',
    processing: 'Processing...',
    ready: 'Ready'
  }
}