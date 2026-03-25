import { useMemo, useRef, useState } from "react";
import "./TaskPage.css";

const PRIORITY_ORDER = {
  High: 0,
  Medium: 1,
  Low: 2
};

function makeId(counterRef) {
  counterRef.current += 1;
  return `${Date.now()}-${counterRef.current}`;
}

function sortByPriority(items) {
  return [...items].sort((a, b) => {
    const first = PRIORITY_ORDER[a.priority] ?? 99;
    const second = PRIORITY_ORDER[b.priority] ?? 99;
    if (first !== second) {
      return first - second;
    }
    return a.name.localeCompare(b.name);
  });
}

export default function TaskPage() {
  const [taskName, setTaskName] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [tasks, setTasks] = useState([]);
  const [mode, setMode] = useState("view");
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const dayIdRef = useRef(0);

  const doneTasks = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);
  const totalTasks = tasks.length;
  const undoneTasks = totalTasks - doneTasks;
  const completionPercent = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  const sortedTasks = useMemo(() => sortByPriority(tasks), [tasks]);

  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (completionPercent / 100) * circumference;

  function addTask() {
    const trimmed = taskName.trim();
    if (!trimmed) {
      return;
    }

    const newTask = {
      id: makeId(dayIdRef),
      name: trimmed,
      priority,
      done: false
    };

    setTasks((prev) => [...prev, newTask]);
    setTaskName("");
    setPriority("Medium");
  }

  function toggleTask(id) {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
    );
  }

  function toggleTaskSelection(id) {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function deleteSelectedTasks() {
    if (selectedTaskIds.size === 0) {
      return;
    }
    setTasks((prev) => prev.filter((task) => !selectedTaskIds.has(task.id)));
    setSelectedTaskIds(new Set());
    setMode("view");
  }

  function setAddMode() {
    setMode("add");
    setSelectedTaskIds(new Set());
  }

  function setEditMode() {
    setMode((prev) => (prev === "edit" ? "view" : "edit"));
    setSelectedTaskIds(new Set());
  }

  function setDeleteMode() {
    if (mode === "delete") {
      deleteSelectedTasks();
      return;
    }
    setMode("delete");
    setSelectedTaskIds(new Set());
  }

  function updateTaskName(id, name) {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, name } : task))
    );
  }

  function updateTaskPriority(id, nextPriority) {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, priority: nextPriority } : task))
    );
  }

  function onSubmit(event) {
    event.preventDefault();
    addTask();
  }

  return (
    <div className="task-page">
      <header className="task-header">
        <h1>Tasks For A Day</h1>
        <p>Plan your day, set priority, and complete tasks with focus.</p>
      </header>

      <div className="task-layout">
        <section className="task-panel">
          <div className="task-panel-header">
            <h2>Tasks</h2>
            <div className="task-toolbar">
              <button
                type="button"
                className={mode === "add" ? "mode-btn active" : "mode-btn"}
                onClick={setAddMode}
              >
                Add
              </button>
              <button
                type="button"
                className={mode === "delete" ? "mode-btn active danger" : "mode-btn danger"}
                onClick={setDeleteMode}
                disabled={mode === "delete" && selectedTaskIds.size === 0}
              >
                {mode === "delete" ? "Delete Selected" : "Delete"}
              </button>
              <button
                type="button"
                className={mode === "edit" ? "mode-btn active" : "mode-btn"}
                onClick={setEditMode}
              >
                Edit
              </button>
            </div>
          </div>

          {(mode === "add" || mode === "view") && (
            <form className="task-form" onSubmit={onSubmit}>
              <input
                type="text"
                value={taskName}
                onChange={(event) => setTaskName(event.target.value)}
                placeholder="Add a new task"
              />

              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                aria-label="Task priority"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>

              <button type="submit" className="save-btn">
                Save Task
              </button>
            </form>
          )}

          <ul className="task-list">
            {tasks.length === 0 && <li className="empty-state">No tasks added yet.</li>}

            {sortedTasks.map((task) => (
              <li key={task.id} className={task.done ? "task-row done" : "task-row"}>
                <label className="task-main">
                  <input
                    type="checkbox"
                    checked={mode === "delete" ? selectedTaskIds.has(task.id) : task.done}
                    onChange={() =>
                      mode === "delete" ? toggleTaskSelection(task.id) : toggleTask(task.id)
                    }
                  />
                  {mode === "edit" ? (
                    <input
                      className="task-inline-input"
                      value={task.name}
                      onChange={(event) => updateTaskName(task.id, event.target.value)}
                    />
                  ) : (
                    <span>{task.name}</span>
                  )}
                </label>

                <div className="task-actions">
                  {mode === "edit" ? (
                    <select
                      className="priority-select"
                      value={task.priority}
                      onChange={(event) => updateTaskPriority(task.id, event.target.value)}
                    >
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  ) : (
                    <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {mode === "edit" && (
            <div className="edit-save-row">
              <button type="button" className="save-btn" onClick={() => setMode("view")}>
                Save Changes
              </button>
            </div>
          )}
        </section>

        <aside className="progress-panel">
          <div className="circle-wrap" aria-label="Task completion progress">
            <svg viewBox="0 0 220 220" className="progress-circle">
              <circle cx="110" cy="110" r={radius} className="circle-bg" />
              <circle
                cx="110"
                cy="110"
                r={radius}
                className="circle-progress"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: progressOffset
                }}
              />
            </svg>
            <div className="circle-label">
              <strong>{completionPercent}%</strong>
              <span>Completed</span>
            </div>
          </div>

          <div className="stats-section">
            <h2>Details</h2>
            <div className="stats-grid">
              <div>
                <span>Done Tasks</span>
                <strong>{doneTasks}</strong>
              </div>
              <div>
                <span>Undone Tasks</span>
                <strong>{undoneTasks}</strong>
              </div>
              <div>
                <span>Completed Tasks</span>
                <strong>{completionPercent}%</strong>
              </div>
              <div>
                <span>Total Tasks</span>
                <strong>{totalTasks}</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
