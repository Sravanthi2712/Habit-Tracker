import { useMemo, useState } from "react";
import "./RangeTaskPage.css";

function generateDateRange(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const dates = [];
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
  if (start > end) return [];

  let current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function formatDateKey(date) {
  return date.toISOString().split("T")[0];
}

function formatDisplayDate(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const STORAGE_KEY = "task-tracker-v1";

function safeReadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function safeWriteStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatDayName(date) {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

export default function RangeTaskPage() {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    return formatDateKey(d);
  });
  
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return formatDateKey(d);
  });

  const [tasksByDateInternal, setTasksByDateInternal] = useState(() => safeReadStorage());
  
  function setTasksByDate(updater) {
    setTasksByDateInternal(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      safeWriteStorage(next);
      return next;
    });
  }
  
  const tasksByDate = tasksByDateInternal;
  const [inputsByDate, setInputsByDate] = useState({});

  const days = useMemo(() => generateDateRange(fromDate, toDate), [fromDate, toDate]);

  function toggleTask(dateKey, taskId) {
    setTasksByDate(prev => {
      const dayTasks = prev[dateKey] || [];
      return {
        ...prev,
        [dateKey]: dayTasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t)
      };
    });
  }

  function addTask(dateKey) {
    const text = (inputsByDate[dateKey] || "").trim();
    if (!text) return;

    setTasksByDate(prev => {
      const dayTasks = prev[dateKey] || [];
      return {
        ...prev,
        [dateKey]: [...dayTasks, { id: Date.now() + Math.random(), name: text, done: false }]
      };
    });
    setInputsByDate(prev => ({ ...prev, [dateKey]: "" }));
  }

  function deleteTask(dateKey, taskId) {
    setTasksByDate(prev => {
      const dayTasks = prev[dateKey] || [];
      return {
        ...prev,
        [dateKey]: dayTasks.filter(t => t.id !== taskId)
      };
    });
  }

  return (
    <div className="range-task-page">
      <header className="range-header">
        <h2>Range Tasks Planner</h2>
        <div className="date-pickers">
          <label>
            From
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          </label>
        </div>
      </header>

      <div className="range-grid-wrapper">
        <div className="range-grid">
          {days.map(d => {
            const dateKey = formatDateKey(d);
            const dayTasks = tasksByDate[dateKey] || [];
            const doneTasks = dayTasks.filter(t => t.done).length;
            const totalTasks = dayTasks.length;
            const undoneTasks = totalTasks - doneTasks;
            const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

            const radius = 24;
            const circum = 2 * Math.PI * radius;
            const offset = circum - (progress / 100) * circum;

            return (
              <div key={dateKey} className="day-column">
                <div className="day-col-header">
                  <h3>{formatDisplayDate(d)}</h3>
                  <span className="day-name">{formatDayName(d)}</span>
                </div>

                <div className="day-add-box">
                  <input 
                    type="text" 
                    placeholder="New task..."
                    value={inputsByDate[dateKey] || ""}
                    onChange={e => setInputsByDate(prev => ({ ...prev, [dateKey]: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && addTask(dateKey)}
                  />
                  <button type="button" onClick={() => addTask(dateKey)}>+</button>
                </div>

                <ul className="day-task-list">
                  {dayTasks.length === 0 && <p className="empty">No tasks yet.</p>}
                  {dayTasks.map(task => (
                    <li key={task.id} className={task.done ? "done" : ""}>
                      <label className="checkbox-wrap">
                        <input type="checkbox" checked={task.done} onChange={() => toggleTask(dateKey, task.id)} />
                        <span>{task.name}</span>
                      </label>
                      <button type="button" className="del-btn" onClick={() => deleteTask(dateKey, task.id)}>✕</button>
                    </li>
                  ))}
                </ul>

                <div className="day-col-footer">
                  <div className="col-progress">
                    <svg viewBox="0 0 64 64" className="progress-svg">
                      <circle cx="32" cy="32" r={radius} className="bg-circle" />
                      <circle 
                        cx="32" cy="32" r={radius} 
                        className="val-circle" 
                        style={{ strokeDasharray: circum, strokeDashoffset: offset }} 
                      />
                    </svg>
                    <span className="pct-text">{progress}%</span>
                  </div>
                  <div className="col-stats">
                    <div className="stat-item"><small>Done</small><strong>{doneTasks}</strong></div>
                    <div className="stat-item"><small>Open</small><strong>{undoneTasks}</strong></div>
                    <div className="stat-item"><small>All</small><strong>{totalTasks}</strong></div>
                  </div>
                </div>
              </div>
            );
          })}
          {days.length === 0 && (
            <div className="no-days">Please select a valid date range.</div>
          )}
        </div>
      </div>
    </div>
  );
}
