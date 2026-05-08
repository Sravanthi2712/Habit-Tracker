import { create } from 'zustand';
import useAuthStore from './useAuthStore';

const API_URL = 'http://habit-tracker-okab.onrender.com/api/tasks';

function getHeaders() {
  const token = useAuthStore.getState().session?.access_token;
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

const useTaskStore = create((set, get) => ({
  tasksByDate: {},
  
  fetchTasks: async () => {
    try {
      const resp = await fetch(API_URL, { headers: getHeaders() });
      if (!resp.ok) return;
      const data = await resp.json();
      
      const newMap = {};
      data.forEach(t => {
        if (!newMap[t.date_key]) newMap[t.date_key] = [];
        newMap[t.date_key].push(t);
      });
      set({ tasksByDate: newMap });
    } catch (err) { console.error('Fetch tasks failed:', err); }
  },

  addTask: async (dateKey, localTaskParams) => {
    const payload = {
      date_key: dateKey,
      name: localTaskParams.name,
      priority: localTaskParams.priority || "Medium",
      done: false
    };

    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const errorData = await resp.json();
        window.alert(`Backend Error: ${errorData.error || 'Failed to add task'}`);
        return;
      }
      const createdTask = await resp.json();
      
      set(state => {
        const day = state.tasksByDate[dateKey] || [];
        return { tasksByDate: { ...state.tasksByDate, [dateKey]: [...day, createdTask] } };
      });
    } catch (err) { 
      console.error('Add task failed:', err);
      window.alert('Network Error: Make sure the Node Backend (port 5000) is running!');
    }
  },

  toggleTask: async (dateKey, taskId) => {
    const task = get().tasksByDate[dateKey]?.find(t => t.id === taskId);
    if (!task) return;

    // Optimistic Update
    set(state => ({
      tasksByDate: {
        ...state.tasksByDate,
        [dateKey]: state.tasksByDate[dateKey].map(t => t.id === taskId ? { ...t, done: !t.done } : t)
      }
    }));
    
    // Background Fetch
    fetch(`${API_URL}/${taskId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ done: !task.done })
    }).catch(console.error);
  },

  toggleTaskSelection: () => {}, 

  deleteTask: async (dateKey, taskId) => {
    set(state => ({
      tasksByDate: {
        ...state.tasksByDate,
        [dateKey]: state.tasksByDate[dateKey].filter(t => t.id !== taskId)
      }
    }));
    fetch(`${API_URL}/${taskId}`, { method: 'DELETE', headers: getHeaders() }).catch(console.error);
  },

  deleteMultipleTasks: async (dateKey, idSet) => {
    set(state => ({
      tasksByDate: {
        ...state.tasksByDate,
        [dateKey]: state.tasksByDate[dateKey].filter(t => !idSet.has(t.id))
      }
    }));
    idSet.forEach(id => {
      fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: getHeaders() }).catch(console.error);
    });
  },

  updateTaskName: async (dateKey, taskId, newName) => {
    set(state => ({
      tasksByDate: {
        ...state.tasksByDate,
        [dateKey]: state.tasksByDate[dateKey].map(t => t.id === taskId ? { ...t, name: newName } : t)
      }
    }));
    fetch(`${API_URL}/${taskId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name: newName })
    }).catch(console.error);
  },

  updateTaskPriority: async (dateKey, taskId, newPriority) => {
    set(state => ({
      tasksByDate: {
        ...state.tasksByDate,
        [dateKey]: state.tasksByDate[dateKey].map(t => t.id === taskId ? { ...t, priority: newPriority } : t)
      }
    }));
    fetch(`${API_URL}/${taskId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ priority: newPriority })
    }).catch(console.error);
  }
}));

export default useTaskStore;
