// 前后端通用类型定义

import { Chapter, ChapterData } from './chapter';
import { MKVProgress } from './progress';

export interface MkvFileData {
  id: string;
  filePath: string;
  duration: number;
  metadata: string;
  title: string;
  encoder: string;
  format: string;
  bitRate: number;
  size: number;
  chapters: ChapterData[];
  progress?: MKVProgress; // FFmpeg进度信息，可选属性
}

export class MkvFile implements MkvFileData {
  id: string;
  filePath: string;
  duration: number;
  metadata: string;
  title: string;
  encoder: string;
  format: string;
  bitRate: number;
  size: number;
  chapters: ChapterData[];
  progress?: MKVProgress;

  constructor(data: MkvFileData) {
    this.id = data.id;
    this.filePath = data.filePath;
    this.duration = data.duration;
    this.metadata = data.metadata;
    this.title = data.title || '';
    this.encoder = data.encoder || '';
    this.format = data.format || 'mkv';
    this.bitRate = data.bitRate || 0;
    this.size = data.size || 0;
    this.chapters = data.chapters || [];
    this.progress = data.progress;
  }

  /**
   * 判断是否真正获取了MKV文件信息
   * @returns 是否有效
   */
  get isValid(): boolean {
    // 通过检查id是否为虚假id和filePath是否有效来判断
    return this.id !== 'fake-id' && this.filePath !== '';
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
    if (this.chapters.length === 0) return;
    
    // 按开始时间排序
    this.chapters.sort((a, b) => a.start - b.start);
    
    // 更新除最后一个章节外的所有章节的结束时间
    for (let i = 0; i < this.chapters.length - 1; i++) {
      this.chapters[i].end = this.chapters[i + 1].start;
    }
    
    // 最后一个章节的结束时间为总时长（转换为当前时间基）
    const lastChapter = this.chapters[this.chapters.length - 1];
    const denominator = lastChapter.timeBase ? parseInt(lastChapter.timeBase.split('/')[1]) : 1000;
    lastChapter.end = this.duration * denominator;
  }

  /**
   * 获取所有章节的metadata字符串
   * @returns 章节metadata字符串
   */
  getChaptersMetadata(): string {
    if (this.chapters.length === 0) return '';
    
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
    metadata += `title=${this.title}\n`;
    metadata += `encoder=${this.encoder}\n`;
    
    // 添加空行分隔文件元数据和章节
    metadata += '\n';
    
    // 添加所有章节信息
    if (this.chapters.length > 0) {
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
