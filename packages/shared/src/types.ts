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
  updatedAt?: number;
}

export interface Settings {
  pageSize: number;
  fontSize: number;
  pageCapacities?: Record<number, number>;
  closedPages?: number[];
  updatedAt?: number;
}
