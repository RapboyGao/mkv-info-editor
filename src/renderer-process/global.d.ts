// 全局类型声明，扩展window对象

// 前向声明章节数据类型
declare interface ChapterData {
  id: string;
  start: number;
  end: number;
  title: string;
  originalTitle: string;
  timeBase: `${number}/${number}`;
}

// 前向声明MKV文件数据类型
declare interface MkvFileData {
  filePath: string;
  duration: number;
  metadata: string;
  chapters: ChapterData[];
  title?: string;
  encoder?: string;
}

declare global {
  interface Window {
    electronAPI: {
      selectMkvFile: () => Promise<string | null>;
      saveMkvFile: (defaultPath: string) => Promise<string | null>;
      downloadFFmpeg: () => Promise<string>;
      exportMetadata: (inputPath: string) => Promise<string>;
      importMetadata: (inputPath: string, metadataPath: string, outputPath: string) => Promise<boolean>;
      getMkvDuration: (filePath: string) => Promise<number>;
      getMkvFileInfo: (filePath: string) => Promise<MkvFileData>;
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<boolean>;
      deleteFile: (filePath: string) => Promise<boolean>;
      updateMetadata: (originalMetadataPath: string, chapters: ChapterData[]) => Promise<string>;
  generateMkvFile: (inputPath: string, mkvFileData: string, outputPath: string) => Promise<boolean>;
    };
    ipcRenderer: {
      on: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) => void;
      off: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) => void;
    };
  }
}

// 必须添加这一行，否则TypeScript会认为这是一个空模块
export {};