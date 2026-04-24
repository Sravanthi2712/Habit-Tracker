import { create } from 'zustand';
import useAuthStore from './useAuthStore';

const API_URL = 'http://localhost:5000/api/habits';

function getHeaders() {
  const token = useAuthStore.getState().session?.access_token;
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

const useHabitStore = create((set, get) => ({
  selectedMonth: (() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
  })(),
  habits: [],
  
  fetchHabits: async () => {
    try {
      const resp = await fetch(API_URL, { headers: getHeaders() });
      if (!resp.ok) return;
      const data = await resp.json();
      set({ habits: data });
    } catch (err) { console.error('Fetch habits failed:', err); }
  },

  changeMonth: (month) => set({ selectedMonth: month }),

  addHabitRow: async (daysCount) => {
    const defaultGoal = Math.max(20, Math.ceil(daysCount * 0.7));
    const newName = `Habit ${get().habits.length + 1}`;
    const payload = { name: newName, goal: defaultGoal };

    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (!resp.ok) return;
      const createdHabit = await resp.json();
      
      set(state => ({ habits: [...state.habits, createdHabit] }));
    } catch (err) { console.error('Add habit failed:', err); }
  },

  updateHabitName: async (id, newName) => {
    set(state => ({
      habits: state.habits.map(h => h.id === id ? { ...h, name: newName } : h)
    }));
    fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name: newName })
    }).catch(console.error);
  },

  updateHabitGoal: async (id, newGoal) => {
    const numeric = Number.isNaN(Number(newGoal)) ? 0 : Math.max(0, Math.floor(Number(newGoal)));
    set(state => ({
      habits: state.habits.map(h => h.id === id ? { ...h, goal: numeric } : h)
    }));
    fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ goal: numeric })
    }).catch(console.error);
  },

  toggleDay: async (id, dateKey) => {
    const habit = get().habits.find(h => h.id === id);
    if (!habit) return;

    set(state => ({
      habits: state.habits.map(h => {
        if (h.id !== id) return h;
        return { ...h, checks: { ...h.checks, [dateKey]: !h.checks[dateKey] } };
      })
    }));

    fetch(`${API_URL}/${id}/toggle`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ date_key: dateKey })
    }).catch(console.error);
  },

  deleteHabits: async (idsSet) => {
    set(state => ({
      habits: state.habits.filter(h => !idsSet.has(h.id))
    }));
    fetch(`${API_URL}/delete-multiple`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ids: Array.from(idsSet) })
    }).catch(console.error);
  }
}));

export default useHabitStore;
