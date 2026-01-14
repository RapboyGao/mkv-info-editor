import { ipcMain } from "electron";
import fs from "fs-extra";
import { ChapterData, Chapter } from "../../shared/types";

/**
 * 注册元数据处理相关的 IPC 处理程序
 */
export function registerMetadataHandlers() {
  // 解析元数据文件
  ipcMain.handle(
    "parse-metadata",
    async (_, metadataPath: string, totalDuration?: number) => {
      try {
        const content = await fs.readFile(metadataPath, "utf-8");
        const lines = content.split("\n");

        const chaptersList: ChapterData[] = [];
        let currentChapter: Partial<ChapterData> = {};
        let timebase = "1/1000"; // 默认时间基准为毫秒

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (trimmedLine.startsWith("[CHAPTER]")) {
            // 新章节开始，保存之前的章节（如果有）
            if (currentChapter.start !== undefined) {
              // 创建一个包含所有必需属性的ChapterData对象
              chaptersList.push({
                id: "", // 稍后会生成随机ID
                start: currentChapter.start,
                end: 0, // 稍后会计算结束时间
                title: currentChapter.title || "",
                originalTitle: currentChapter.title || "",
                timeBase: currentChapter.timeBase,
              });
            }
            // 重置当前章节
            currentChapter = {};
          } else if (trimmedLine.startsWith("TIMEBASE=")) {
            // 解析TIMEBASE，格式为 "num/den"，例如 "1/1000" 表示毫秒
            const timebaseStr = trimmedLine.split("=")[1];
            // 验证格式并转换为模板字面量类型
            if (/^\d+\/\d+$/.test(timebaseStr)) {
              timebase = timebaseStr as `${number}/${number}`;
              // 更新当前章节的timeBase
              currentChapter.timeBase = timebase;
            }
          } else if (trimmedLine.startsWith("START=")) {
            // 解析开始时间，只存储原始值，不计算时间字符串（等待TIMEBASE解析后再计算）
            const start = parseInt(trimmedLine.split("=")[1]);
            currentChapter.start = start;
            // 确保当前章节有timeBase
            if (!currentChapter.timeBase) {
              currentChapter.timeBase = timebase;
            }
          } else if (trimmedLine.startsWith("title=")) {
            // 解析章节标题
            currentChapter.title = trimmedLine.split("=")[1];
          }
        }

        // 保存最后一个章节
        if (currentChapter.start !== undefined) {
          // 确保最后一个章节有timeBase
          if (!currentChapter.timeBase) {
            currentChapter.timeBase = timebase;
          }
          
          // 创建一个包含所有必需属性的ChapterData对象
          chaptersList.push({
            id: "", // 稍后会生成随机ID
            start: currentChapter.start,
            end: 0, // 稍后会计算结束时间
            title: currentChapter.title || "",
            originalTitle: currentChapter.title || "",
            timeBase: currentChapter.timeBase,
          });
        }

        // 为每个章节生成随机ID
        for (const chapter of chaptersList) {
          chapter.id = Math.random().toString(36).substring(2, 10);
        }

        // 按开始时间排序章节
        chaptersList.sort((a, b) => a.start - b.start);

        // 计算每个章节的结束时间
        for (let i = 0; i < chaptersList.length; i++) {
          const chapter = chaptersList[i];
          const nextChapter = chaptersList[i + 1];

          if (nextChapter) {
            // 如果有下一个章节，当前章节的结束时间就是下一个章节的开始时间
            chapter.end = nextChapter.start;
          } else {
            // 最后一个章节，结束时间设置为整个MKV的总时长，基于当前章节的timeBase
            let finalEndTime = 100 * 3600; // 默认值（100小时）
            if (typeof totalDuration === "number" && !isNaN(totalDuration)) {
              finalEndTime = totalDuration;
            }
            
            // 解析timeBase的分母
            const denominator = chapter.timeBase ? parseInt(chapter.timeBase.split("/")[1]) : 1000;
            // 将总时长转换为基于当前timeBase的时间戳
            chapter.end = finalEndTime * denominator;
          }
        }

        return chaptersList;
      } catch (error) {
        console.error("Failed to parse metadata:", error);
        throw error;
      }
    }
  );

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
