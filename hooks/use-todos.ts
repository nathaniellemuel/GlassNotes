import { useState, useEffect, useCallback } from 'react';
import type { Todo } from '@/types/todo';
import { storage } from '@/utils/storage';
import { scheduleNotification, cancelNotification } from '@/hooks/use-notifications';
import { generateId } from '@/utils/id';

const STORAGE_KEY = 'glassnotes_todos';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const loadTodos = useCallback(async () => {
    setIsLoading(true);
    const stored = await storage.get<Todo[]>(STORAGE_KEY);
    setTodos(stored ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const saveTodo = useCallback(async (todo: Todo) => {
    // Schedule notification if reminder is set
    if (todo.reminderAt && todo.reminderAt > Date.now() && !todo.completed) {
      const notifId = await scheduleNotification(
        `todo_${todo.id}`,
        `Reminder: ${todo.title}`,
        todo.description || 'You have a task due!',
        new Date(todo.reminderAt),
      );
      if (notifId) {
        todo = { ...todo, notificationId: notifId };
      }
    } else if (!todo.reminderAt && todo.notificationId) {
      await cancelNotification(`todo_${todo.id}`);
      todo = { ...todo, notificationId: undefined };
    }

    setTodos((prev) => {
      const exists = prev.some((t) => t.id === todo.id);
      const updated = exists
        ? prev.map((t) => (t.id === todo.id ? todo : t))
        : [todo, ...prev];
      storage.set(STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const createTodo = useCallback(
    (partial: Partial<Todo>): Todo => {
      const todo: Todo = {
        id: generateId(),
        title: partial.title ?? '',
        description: partial.description ?? '',
        completed: false,
        priority: partial.priority ?? 'medium',
        dueDate: partial.dueDate,
        reminderAt: partial.reminderAt,
        colorId: partial.colorId ?? 'default',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      saveTodo(todo);
      return todo;
    },
    [saveTodo],
  );

  const toggleTodo = useCallback(async (id: string) => {
    let wasActive = false;
    setTodos((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== id) return t;
        wasActive = !t.completed;
        return { ...t, completed: !t.completed, updatedAt: Date.now() };
      });
      storage.set(STORAGE_KEY, updated);
      return updated;
    });
    if (wasActive) {
      await cancelNotification(`todo_${id}`);
    }
  }, []);

  const deleteTodo = useCallback(async (id: string) => {
    await cancelNotification(`todo_${id}`);
    setTodos((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      storage.set(STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const filteredTodos = todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const activeTodosCount = todos.filter((t) => !t.completed).length;

  return {
    todos,
    filteredTodos,
    isLoading,
    filter,
    setFilter,
    loadTodos,
    saveTodo,
    createTodo,
    toggleTodo,
    deleteTodo,
    activeTodosCount,
  };
}
