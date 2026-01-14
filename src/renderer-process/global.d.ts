// 全局类型声明，扩展window对象

import type { ChapterData, MkvFileData } from '../shared';

// 声明Vue文件的类型
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 声明Vite Forge生成的变量
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

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
      on: (channel: string, listener: (...args: any[]) => void) => void;
      off: (channel: string, listener: (...args: any[]) => void) => void;
    };
  }
}

// 必须添加这一行，否则TypeScript会认为这是一个空模块
export {};