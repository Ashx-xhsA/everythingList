export type TaskStatus = 'active' | 'completed' | 'dismissed';

export interface Task {
  id: string;
  text: string;
  status: TaskStatus;
  pageIndex: number;
  createdAt: number;
  completedAt?: number;
  dismissedAt?: number;
  details?: string;
}

