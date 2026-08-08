export type TaskStatus = 'Backlog' | 'Todo' | 'In Progress' | 'In Testing' | 'Completed';

export const TASK_STATUSES: TaskStatus[] = ['Backlog', 'Todo', 'In Progress', 'In Testing', 'Completed'];

export interface TaskItem {
  id: string;
  boardId: string;
  taskName: string;
  description: string;
  status: TaskStatus;
  assignees: string[];
  createdBy: string;
  createdOn: string;
}
