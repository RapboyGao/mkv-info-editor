import { ipcMain } from "electron";
import fs from "fs-extra";
import { ChapterData } from "@/shared";

/**
 * 注册元数据处理相关的 IPC 处理程序
 */
export function registerMetadataHandlers() {
  // 更新元数据文件
  ipcMain.handle(
    "update-metadata",
    async (_, originalMetadataPath: string, chapters: ChapterData[]) => {
      try {
        const originalContent = await fs.readFile(
          originalMetadataPath,
          "utf-8"
        );
        const lines = originalContent.split("\n");
        const newLines: string[] = [];
        let beforeChapters = true;
        const chaptersSection: string[] = [];
        let afterChapters = false;

        // 首先分离原始文件内容为：章节前内容 + 章节内容 + 章节后内容
        for (const line of lines) {
          const trimmedLine = line.trim();

          if (beforeChapters) {
            if (trimmedLine.startsWith("[CHAPTER]")) {
              beforeChapters = false;
              afterChapters = false;
            } else if (trimmedLine.startsWith("[")) {
              // 这是一个新的section，不是章节的一部分
              newLines.push(line);
            } else if (line.trim() !== "") {
              // 保留非空行
              newLines.push(line);
            }
          }

          if (!beforeChapters && !afterChapters) {
            if (
              trimmedLine.startsWith("[") &&
              trimmedLine.endsWith("]") &&
              !trimmedLine.startsWith("[CHAPTER]")
            ) {
              // 章节结束，遇到新的section
              afterChapters = true;
              newLines.push(line);
            } else if (
              !trimmedLine.startsWith("[CHAPTER]") &&
              line.trim() !== ""
            ) {
              // 保留非空行和非[CHAPTER]行
              chaptersSection.push(line);
            }
          }

          if (afterChapters && trimmedLine !== "") {
            newLines.push(line);
          }
        }

        // 生成新的章节内容
        const newChaptersContent: string[] = [];

        // 假设timebase为1/1000
        newChaptersContent.push(";FFMETADATA1");
        newChaptersContent.push("");

        for (let i = 0; i < chapters.length; i++) {
          const chapter = chapters[i];

          // 添加章节标记
          newChaptersContent.push("[CHAPTER]");
          newChaptersContent.push("TIMEBASE=1/1000");
          newChaptersContent.push(`START=${chapter.start}`);
          if (i < chapters.length - 1) {
            // 如果不是最后一个章节，设置END时间
            newChaptersContent.push(`END=${chapters[i + 1].start}`);
          }
          newChaptersContent.push(`title=${chapter.title}`);
          newChaptersContent.push("");
        }

        // 合并所有内容：原始非章节内容 + 新章节内容 + 原始章节后内容
        const allLines = [...newChaptersContent, ...newLines];
        const newContent = allLines.join("\n");

        const newMetadataPath = originalMetadataPath + ".new";
        await fs.writeFile(newMetadataPath, newContent, "utf-8");

        return newMetadataPath;
      } catch (error) {
        console.error("Failed to update metadata:", error);
        throw error;
      }
    }
  );
}
