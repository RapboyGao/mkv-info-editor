import { BrowserWindow } from 'electron';
import { MkvFileData, MkvFile } from '@/shared';

// MKV任务状态类型
export type MKVTaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

// MKV任务接口
export interface MKVTask {
  id: string;
  mkvFile: MkvFile;
  status: MKVTaskStatus;
  createdAt: Date;
  updatedAt: Date;
  outputPath?: string;
  error?: string;
}

/**
 * MKV任务管理器，用于管理多个MKV文件处理任务
 */
export class MkvTaskManager {
  private tasks: MKVTask[] = [];
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow: BrowserWindow | null = null) {
    this.mainWindow = mainWindow;
  }

  /**
   * 设置主窗口，用于发送通知
   * @param mainWindow 主窗口对象
   */
  setMainWindow(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  /**
   * 添加新的MKV任务
   * @param mkvFileData MKV文件数据
   * @returns 添加的任务
   */
  addTask(mkvFileData: MkvFileData): MKVTask {
    const task: MKVTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      mkvFile: new MkvFile(mkvFileData),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tasks.push(task);
    this.notifyTasksChanged();
    return task;
  }

  /**
   * 获取所有任务
   * @returns 所有任务列表
   */
  getAllTasks(): MKVTask[] {
    return [...this.tasks];
  }

  /**
   * 根据ID获取任务
   * @param taskId 任务ID
   * @returns 任务对象，如果不存在则返回undefined
   */
  getTaskById(taskId: string): MKVTask | undefined {
    return this.tasks.find(task => task.id === taskId);
  }

  /**
   * 更新任务状态
   * @param taskId 任务ID
   * @param status 新状态
   * @param outputPath 输出文件路径（可选）
   * @param error 错误信息（可选）
   * @returns 更新后的任务，如果不存在则返回undefined
   */
  updateTaskStatus(
    taskId: string,
    status: MKVTaskStatus,
    outputPath?: string,
    error?: string
  ): MKVTask | undefined {
    const taskIndex = this.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return undefined;

    this.tasks[taskIndex].status = status;
    this.tasks[taskIndex].updatedAt = new Date();
    if (outputPath) {
      this.tasks[taskIndex].outputPath = outputPath;
    }
    if (error) {
      this.tasks[taskIndex].error = error;
    }

    this.notifyTasksChanged();
    return this.tasks[taskIndex];
  }

  /**
   * 删除任务
   * @param taskId 任务ID
   * @returns 是否成功删除
   */
  deleteTask(taskId: string): boolean {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(task => task.id !== taskId);
    const deleted = this.tasks.length < initialLength;
    if (deleted) {
      this.notifyTasksChanged();
    }
    return deleted;
  }

  /**
   * 清除所有任务
   */
  clearAllTasks(): void {
    this.tasks = [];
    this.notifyTasksChanged();
  }

  /**
   * 获取任务数量
   * @returns 任务数量
   */
  getTaskCount(): number {
    return this.tasks.length;
  }

  /**
   * 根据状态获取任务数量
   * @param status 任务状态
   * @returns 对应状态的任务数量
   */
  getTaskCountByStatus(status: MKVTaskStatus): number {
    return this.tasks.filter(task => task.status === status).length;
  }

  /**
   * 通知前端任务列表已更改
   */
  private notifyTasksChanged(): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('mkv-tasks-changed', this.getAllTasks());
    }
  }
}

// 导出单例实例
export const mkvTaskManager = new MkvTaskManager();
