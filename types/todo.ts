export const TODO_PRIORITIES = [
  { id: 'low', label: 'Low', color: '#22C55E' },
  { id: 'medium', label: 'Medium', color: '#F59E0B' },
  { id: 'high', label: 'High', color: '#EF4444' },
] as const;

export type TodoPriority = (typeof TODO_PRIORITIES)[number]['id'];

export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: TodoPriority;
  dueDate?: number;
  reminderAt?: number;
  notificationId?: string;
  colorId: string;
  createdAt: number;
  updatedAt: number;
}
