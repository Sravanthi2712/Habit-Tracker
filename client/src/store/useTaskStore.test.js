import { describe, it, expect, beforeEach } from 'vitest';
import useTaskStore from './useTaskStore';

describe('Task Store Management', () => {
  // Clear the store before each test to ensure test isolation
  beforeEach(() => {
    useTaskStore.setState({ tasksByDate: {} });
  });

  it('should initialize with empty tasks', () => {
    const state = useTaskStore.getState();
    expect(state.tasksByDate).toEqual({});
  });

  it('should add a task correctly and default to Medium priority', () => {
    const dateKey = '2026-04-20';
    useTaskStore.getState().addTask(dateKey, { id: '1', name: 'Test Task' });
    
    const state = useTaskStore.getState();
    const dayTasks = state.tasksByDate[dateKey];
    
    expect(dayTasks).toHaveLength(1);
    expect(dayTasks[0].name).toBe('Test Task');
    expect(dayTasks[0].priority).toBe('Medium'); // test fallback injection
    expect(dayTasks[0].done).toBe(false);
  });

  it('should toggle a task completion status', () => {
    const dateKey = '2026-04-20';
    useTaskStore.getState().addTask(dateKey, { id: '1', name: 'Toggle Me' });
    
    // Toggle once
    useTaskStore.getState().toggleTask(dateKey, '1');
    expect(useTaskStore.getState().tasksByDate[dateKey][0].done).toBe(true);

    // Toggle back
    useTaskStore.getState().toggleTask(dateKey, '1');
    expect(useTaskStore.getState().tasksByDate[dateKey][0].done).toBe(false);
  });

  it('should delete a task correctly', () => {
    const dateKey = '2026-04-20';
    useTaskStore.getState().addTask(dateKey, { id: '1', name: 'To be deleted' });
    useTaskStore.getState().addTask(dateKey, { id: '2', name: 'To keep' });
    
    useTaskStore.getState().deleteTask(dateKey, '1');
    
    const dayTasks = useTaskStore.getState().tasksByDate[dateKey];
    expect(dayTasks).toHaveLength(1);
    expect(dayTasks[0].id).toBe('2');
  });
});
