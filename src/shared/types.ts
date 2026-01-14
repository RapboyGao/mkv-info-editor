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
    return `[Chapter]\nTIMEBASE=${this.timeBase || "1/1000"}\nSTART=${this.start}\nEND=${this.end}\ntitle=${this.title}` as ChapterString;
  }
}
