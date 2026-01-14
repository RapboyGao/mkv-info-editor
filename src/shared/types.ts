// 前后端通用类型定义

export interface ChapterData {
  id: string;
  start: number;
  end: number;
  title: string;
  originalTitle: string;
  timeBase?: `${number}/${number}`;
}

export type ChapterString =
  `[Chapter]\nTIMEBASE=${string}\nSTART=${number}\nEND=${number}\ntitle=${string}`;

export class Chapter implements ChapterData {
  id: string;
  start: number;
  end: number;
  title: string;
  originalTitle: string;
  timeBase?: `${number}/${number}`;

  constructor(data: ChapterData) {
    this.id = data.id;
    this.start = data.start;
    this.end = data.end;
    this.title = data.originalTitle;
    this.originalTitle = data.originalTitle;
    this.timeBase = data.timeBase || "1/1000"; // 默认使用毫秒时间基
  }

  get time(): string {
    return this.formatTime(this.start);
  }

  get endTime(): string {
    return this.formatTime(this.end);
  }

  get startTimeSeconds(): number {
    return this.start / this.denominator;
  }

  set startTimeSeconds(seconds: number) {
    this.start = seconds * this.denominator;
  }

  get endTimeSeconds(): number {
    return this.end / this.denominator;
  }

  set endTimeSeconds(seconds: number) {
    this.end = seconds * this.denominator;
  }

  // 分子计算属性
  get numerator(): number {
    if (!this.timeBase) return 1;
    return parseInt(this.timeBase.split("/")[0]);
  }

  // 分母计算属性
  get denominator(): number {
    if (!this.timeBase) return 1000;
    return parseInt(this.timeBase.split("/")[1]);
  }

  private formatTime(timestamp: number): string {
    // 确保timestamp是数字类型
    if (typeof timestamp !== "number" || isNaN(timestamp)) {
      return "00:00:00.000";
    }

    // 计算总秒数，考虑时间基
    const totalSeconds = timestamp / this.denominator;

    // 计算小时、分钟、秒和毫秒
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    // 计算毫秒，确保只保留3位小数
    const ms = Math.floor((totalSeconds % 1) * 1000);

    // 格式化输出，确保每个部分都有正确的位数
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
  }

  /**
   * 转换为metadata格式的字符串
   * @returns metadata格式的字符串
   */
  toMetadataString(): ChapterString {
    return `[Chapter]
TIMEBASE=${this.timeBase || "1/1000"}
START=${this.start}
END=${this.end}
title=${this.title}` as ChapterString;
  }
}

// MKV文件元数据接口
export interface MkvFileData {
  filePath: string;
  duration: number;
  metadata: string;
  title?: string;
  encoder?: string;
  format?: string;
  bitRate?: number;
  size?: number;
  chapters?: ChapterData[];
}

// MKV文件类
export class MkvFile implements MkvFileData {
  filePath: string;
  duration: number;
  metadata: string;
  title?: string;
  encoder?: string;
  format?: string;
  bitRate?: number;
  size?: number;
  chapters?: ChapterData[];

  constructor(data: MkvFileData) {
    this.filePath = data.filePath;
    this.duration = data.duration;
    this.metadata = data.metadata;
    this.title = data.title;
    this.encoder = data.encoder;
    this.format = data.format;
    this.bitRate = data.bitRate;
    this.size = data.size;
    this.chapters = data.chapters;
  }

  /**
   * 获取文件名（不包含路径）
   * @returns 文件名
   */
  get fileName(): string {
    return this.filePath.split('/').pop() || this.filePath.split('\\').pop() || this.filePath;
  }

  /**
   * 获取文件格式的友好名称
   * @returns 文件格式名称
   */
  get formatName(): string {
    return this.format || 'MKV';
  }

  /**
   * 获取格式化的文件大小
   * @returns 格式化的文件大小
   */
  get formattedSize(): string {
    if (!this.size) return '未知';
    if (this.size < 1024) return `${this.size} B`;
    if (this.size < 1024 * 1024) return `${(this.size / 1024).toFixed(2)} KB`;
    if (this.size < 1024 * 1024 * 1024) return `${(this.size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(this.size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  /**
   * 获取格式化的时长
   * @returns 格式化的时长
   */
  get formattedDuration(): string {
    const totalSeconds = this.duration;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const ms = Math.floor((totalSeconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  /**
   * 设置章节列表
   * @param chapters 章节列表
   */
  setChapters(chapters: ChapterData[]): void {
    this.chapters = chapters;
  }

  /**
   * 更新章节标题
   * @param chapterId 章节ID
   * @param title 新标题
   * @returns 是否成功更新
   */
  updateChapterTitle(chapterId: string, title: string): boolean {
    if (!this.chapters) return false;
    const chapter = this.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return false;
    chapter.title = title;
    return true;
  }

  /**
   * 更新章节时间
   * @param chapterId 章节ID
   * @param start 新的开始时间
   * @param end 新的结束时间
   * @returns 是否成功更新
   */
  updateChapterTime(chapterId: string, start: number, end: number): boolean {
    if (!this.chapters) return false;
    const chapter = this.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return false;
    chapter.start = start;
    chapter.end = end;
    return true;
  }

  /**
   * 设置总时长
   * @param duration 总时长（秒）
   */
  setDuration(duration: number): void {
    this.duration = duration;
  }

  /**
   * 添加章节
   * @param chapter 章节数据
   */
  addChapter(chapter: ChapterData): void {
    if (!this.chapters) {
      this.chapters = [];
    }
    this.chapters.push(chapter);
    // 按开始时间排序
    this.chapters.sort((a, b) => a.start - b.start);
    // 更新章节结束时间
    this.updateChapterEndTimes();
  }

  /**
   * 删除章节
   * @param chapterId 章节ID
   * @returns 是否成功删除
   */
  deleteChapter(chapterId: string): boolean {
    if (!this.chapters) return false;
    const initialLength = this.chapters.length;
    this.chapters = this.chapters.filter(ch => ch.id !== chapterId);
    const deleted = this.chapters.length < initialLength;
    if (deleted) {
      // 更新章节结束时间
      this.updateChapterEndTimes();
    }
    return deleted;
  }

  /**
   * 更新章节结束时间
   */
  updateChapterEndTimes(): void {
    if (!this.chapters || this.chapters.length === 0) return;
    
    // 按开始时间排序
    this.chapters.sort((a, b) => a.start - b.start);
    
    // 更新除最后一个章节外的所有章节的结束时间
    for (let i = 0; i < this.chapters.length - 1; i++) {
      this.chapters[i].end = this.chapters[i + 1].start;
    }
    
    // 最后一个章节的结束时间为总时长（转换为当前时间基）
    const lastChapter = this.chapters[this.chapters.length - 1];
    if (lastChapter) {
      const denominator = lastChapter.timeBase ? parseInt(lastChapter.timeBase.split('/')[1]) : 1000;
      lastChapter.end = this.duration * denominator;
    }
  }

  /**
   * 获取所有章节的metadata字符串
   * @returns 章节metadata字符串
   */
  getChaptersMetadata(): string {
    if (!this.chapters || this.chapters.length === 0) return '';
    
    return this.chapters
      .map(chapter => new Chapter(chapter).toMetadataString())
      .join('\n\n');
  }
  
  /**
   * 获取完整的metadata字符串，包含文件级元数据和所有章节信息
   * 格式与ffmpeg生成的metadata保持一致
   * @returns 完整的metadata字符串
   */
  get fullMetadata(): string {
    let metadata = ';FFMETADATA1\n';
    
    // 添加文件级元数据
    if (this.title) {
      metadata += `title=${this.title}\n`;
    }
    if (this.encoder) {
      metadata += `encoder=${this.encoder}\n`;
    }
    
    // 添加空行分隔文件元数据和章节
    metadata += '\n';
    
    // 添加所有章节信息
    if (this.chapters && this.chapters.length > 0) {
      for (const chapter of this.chapters) {
        metadata += '[CHAPTER]\n';
        metadata += `TIMEBASE=${chapter.timeBase || '1/1000'}\n`;
        metadata += `START=${chapter.start}\n`;
        metadata += `END=${chapter.end}\n`;
        metadata += `title=${chapter.title}\n`;
      }
    }
    
    return metadata;
  }
}
