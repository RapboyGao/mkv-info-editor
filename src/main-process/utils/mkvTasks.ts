import { MkvFile, MkvFileData } from '@/shared';
import { ChildProcess } from 'child_process';
import { BrowserWindow } from 'electron';

// MKV任务状态类型
export type MKVTaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * MKV任务接口，继承自MkvFile，并添加任务管理相关的属性和方法
 */
export class MKVTask extends MkvFile {
  // 任务状态
  status: MKVTaskStatus;
  // 创建时间
  createdAt: Date;
  // 更新时间
  updatedAt: Date;
  // 输出文件路径
  outputPath?: string;
  // 错误信息
  error?: string;
  // 子进程，用于处理MKV文件
  childProcess?: ChildProcess;
  // 主窗口，用于发送通知
  mainWindow?: BrowserWindow;

  /**
   * 构造函数
   * @param mkvFileData MKV文件数据
   * @param mainWindow 主窗口对象
   */
  constructor(mkvFileData: MkvFileData, mainWindow?: BrowserWindow) {
    super(mkvFileData);
    this.status = 'pending';
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.mainWindow = mainWindow;
  }

  /**
   * 更新任务状态
   * @param status 新的状态
   * @param outputPath 输出文件路径（可选）
   * @param error 错误信息（可选）
   */
  updateStatus(status: MKVTaskStatus, outputPath?: string, error?: string): void {
    this.status = status;
    this.updatedAt = new Date();
    if (outputPath) {
      this.outputPath = outputPath;
    }
    if (error) {
      this.error = error;
    }
  }

  /**
   * 设置子进程
   * @param childProcess 子进程
   */
  setChildProcess(childProcess: ChildProcess): void {
    this.childProcess = childProcess;
  }

  /**
   * 终止子进程
   */
  killChildProcess(): void {
    if (this.childProcess && this.childProcess.exitCode === null) {
      this.childProcess.kill();
    }
  }

  /**
   * 获取任务的简洁描述
   */
  get description(): string {
    return `${this.fileName} - ${this.status}`;
  }

  /**
   * 检查任务是否已完成
   */
  get isCompleted(): boolean {
    return this.status === 'completed' || this.status === 'failed';
  }

  /**
   * 检查任务是否正在处理中
   */
  get isProcessing(): boolean {
    return this.status === 'processing';
  }
}

/**
 * 全局任务列表，使用普通数组管理
 */
export var TASKS: MKVTask[] = [];

/**
 * 添加新的MKV任务
 * @param mkvFileData MKV文件数据
 * @param mainWindow 主窗口对象
 * @returns 添加的任务
 */
export function addMkvTask(mkvFileData: MkvFileData, mainWindow?: BrowserWindow): MKVTask {
  const task = new MKVTask(mkvFileData, mainWindow);
  TASKS.push(task);
  return task;
}

/**
 * 根据ID获取MKV任务
 * @param taskId 任务ID
 * @returns 任务对象，如果不存在则返回undefined
 */
export function getMkvTask(taskId: string): MKVTask | undefined {
  return TASKS.find(task => task.id === taskId);
}

/**
 * 删除MKV任务
 * @param taskId 任务ID
 * @returns 是否成功删除
 */
export function deleteMkvTask(taskId: string): boolean {
  const initialLength = TASKS.length;
  const index = TASKS.findIndex(task => task.id === taskId);
  if (index !== -1) {
    TASKS.splice(index, 1);
  }
  return TASKS.length < initialLength;
}

/**
 * 清除所有MKV任务
 */
export function clearAllMkvTasks(): void {
  // 先终止所有正在处理的任务的子进程
  TASKS.forEach(task => {
    if (task.isProcessing) {
      task.killChildProcess();
    }
  });
  // 然后清空任务列表
  TASKS.length = 0;
}

/**
 * 获取指定状态的MKV任务
 * @param status 任务状态
 * @returns 符合条件的任务列表
 */
export function getMkvTasksByStatus(status: MKVTaskStatus): MKVTask[] {
  return TASKS.filter(task => task.status === status);
}

/**
 * 更新MKV任务
 * @param taskId 任务ID
 * @param updates 更新内容
 * @returns 更新后的任务，如果不存在则返回undefined
 */
export function updateMkvTask(taskId: string, updates: Partial<MKVTask>): MKVTask | undefined {
  const task = getMkvTask(taskId);
  if (task) {
    Object.assign(task, updates);
    task.updatedAt = new Date();
    return task;
  }
  return undefined;
}

/**
 * 发送任务变更通知给前端
 * @param mainWindow 主窗口对象
 */
export function notifyTasksChanged(mainWindow: BrowserWindow): void {
  mainWindow.webContents.send('mkv-tasks-changed', TASKS);
}
