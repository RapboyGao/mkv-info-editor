// FFmpeg进度信息接口
export interface MKVProgress {
  /**
   * 输出文件路径
   */
  outputPath: string;
  
  /**
   * 已处理的帧数
   */
  frame: number;
  
  /**
   * 帧率（fps）
   */
  fps: number;
  
  /**
   * 质量值数组（可能有多个q值）
   */
  q: string[];
  
  /**
   * 输出文件大小（带单位，如"275712KiB"）
   */
  size: string;
  
  /**
   * 当前处理时间（如"N/A"或具体时间）
   */
  time: string;
  
  /**
   * 比特率（如"N/A"或具体值）
   */
  bitrate: string;
  
  /**
   * 处理速度（如"N/A"或具体值）
   */
  speed: string;
  
  /**
   * 已用时间（如"0:00:02.58"）
   */
  elapsed: string;
}
