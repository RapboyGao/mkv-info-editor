// 全局类型声明，扩展window对象

declare global {
  interface Window {
    electronAPI: {
      selectMkvFile: () => Promise<string | null>;
      saveMkvFile: (defaultPath: string) => Promise<string | null>;
      downloadFFmpeg: () => Promise<string>;
      exportMetadata: (inputPath: string) => Promise<string>;
      importMetadata: (inputPath: string, metadataPath: string, outputPath: string) => Promise<boolean>;
      getMkvDuration: (filePath: string) => Promise<number>;
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<boolean>;
      deleteFile: (filePath: string) => Promise<boolean>;
      parseMetadata: (metadataPath: string, totalDuration?: number) => Promise<any[]>;
      updateMetadata: (originalMetadataPath: string, chapters: any[]) => Promise<string>;
    };
    ipcRenderer: {
      on: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void;
      off: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void;
    };
  }
}

// 必须添加这一行，否则TypeScript会认为这是一个空模块
export {};