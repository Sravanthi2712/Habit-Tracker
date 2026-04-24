import { useMemo, useState } from "react";
import useHabitStore from "../store/useHabitStore";
import "./HabitPage.css";

function pad2(value) {
  return String(value).padStart(2, "0");
}

function monthParts(monthValue) {
  const [yearStr, monthStr] = monthValue.split("-");
  return { year: Number(yearStr), monthIndex: Number(monthStr) - 1 };
}

function dateKey(year, monthIndex, day) {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function monthInfo(monthValue) {
  const { year, monthIndex } = monthParts(monthValue);
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();

  const days = [];
  for (let day = 1; day <= totalDays; day += 1) {
    days.push({
      day,
      key: dateKey(year, monthIndex, day)
    });
  }

  return { days, totalDays };
}

export default function HabitPage() {
  const selectedMonth = useHabitStore(state => state.selectedMonth);
  const habits = useHabitStore(state => state.habits);
  
  const changeMonthStore = useHabitStore(state => state.changeMonth);
  const addHabitRowStore = useHabitStore(state => state.addHabitRow);
  const updateHabitNameStore = useHabitStore(state => state.updateHabitName);
  const updateHabitGoalStore = useHabitStore(state => state.updateHabitGoal);
  const toggleDayStore = useHabitStore(state => state.toggleDay);
  const deleteHabitsStore = useHabitStore(state => state.deleteHabits);

  const [selectedHabitIds, setSelectedHabitIds] = useState(new Set());
  const [deleteMode, setDeleteMode] = useState(false);
  const [goalEditHabitId, setGoalEditHabitId] = useState(null);

  const { days } = useMemo(() => monthInfo(selectedMonth), [selectedMonth]);

  function changeMonth(nextMonth) {
    changeMonthStore(nextMonth);
  }

  function addHabitRow() {
    addHabitRowStore(days.length);
  }

  function updateHabitName(id, name) {
    updateHabitNameStore(id, name);
  }

  function updateHabitGoal(id, goalValue) {
    updateHabitGoalStore(id, goalValue);
  }

  function toggleDay(id, key) {
    toggleDayStore(id, key);
  }

  function actualDone(habit) {
    return days.reduce((count, day) => count + (habit.checks[day.key] ? 1 : 0), 0);
  }

  function habitProgressPercent(habit) {
    const goal = habit.goal ?? 0;
    const actual = actualDone(habit);
    if (goal <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((actual / goal) * 100));
  }

  function toggleHabitSelection(id) {
    setSelectedHabitIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function deleteSelectedHabits() {
    if (selectedHabitIds.size === 0) return;
    deleteHabitsStore(selectedHabitIds);
    setSelectedHabitIds(new Set());
    setDeleteMode(false);
  }

  function toggleDeleteMode() {
    setDeleteMode(!deleteMode);
    setSelectedHabitIds(new Set());
  }

  return (
    <div className="app">
      <div className="topbar">
        <h1>Monthly Habit Tracker</h1>
        <div className="month-picker">
          <label htmlFor="month-input">Month</label>
          <input
            id="month-input"
            type="month"
            value={selectedMonth}
            onChange={(e) => changeMonth(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrap">
        <table className="habit-table">
          <thead>
            <tr>
              <th className="habit-col">
                <div className="habit-head">
                  <span>Habits</span>
                  <div className="habit-controls">
                    {!deleteMode && (
                      <button onClick={addHabitRow} className="add-btn" type="button" title="Add habit">
                        +
                      </button>
                    )}
                    <button
                      onClick={deleteMode ? deleteSelectedHabits : toggleDeleteMode}
                      className={deleteMode ? "delete-btn active" : "delete-btn"}
                      type="button"
                      title={deleteMode ? "Delete selected habits" : "Enter delete mode"}
                      disabled={deleteMode && selectedHabitIds.size === 0}
                    >
                      {deleteMode ? "✓" : "−"}
                    </button>
                    {deleteMode && (
                      <button
                        onClick={toggleDeleteMode}
                        className="cancel-btn"
                        type="button"
                        title="Cancel delete mode"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </th>
              {days.map((day) => (
                <th key={day.key} className="day-col">
                  {day.day}
                </th>
              ))}
              <th>Day Analysis</th>
            </tr>
          </thead>

          <tbody>
            {habits.length === 0 && (
              <tr>
                <td colSpan={days.length + 2} className="empty-row">
                  Click + in Habits to add your first row.
                </td>
              </tr>
            )}

            {habits.map((habit) => {
              const actual = actualDone(habit);
              const progress = habitProgressPercent(habit);
              return (
                <tr key={habit.id}>
                  <td className="habit-name-cell">
                    <div className="habit-select-row">
                      {deleteMode && (
                        <input
                          type="checkbox"
                          className="habit-checkbox"
                          checked={selectedHabitIds.has(habit.id)}
                          onChange={() => toggleHabitSelection(habit.id)}
                        />
                      )}
                      <input
                        className="habit-name-input"
                        value={habit.name}
                        onChange={(e) => updateHabitName(habit.id, e.target.value)}
                      />
                      <button
                        type="button"
                        className="goal-indicator"
                        onClick={() => setGoalEditHabitId(goalEditHabitId === habit.id ? null : habit.id)}
                        title="Edit goal"
                      >
                        {habit.goal ?? 0}
                      </button>
                    </div>
                    {goalEditHabitId === habit.id && (
                      <div className="goal-row">
                        <label>Goal</label>
                        <input
                          type="number"
                          min="0"
                          max={days.length}
                          value={habit.goal ?? 0}
                          onChange={(e) => updateHabitGoal(habit.id, e.target.value)}
                        />
                      </div>
                    )}
                  </td>

                  {days.map((day) => (
                    <td key={`${habit.id}-${day.key}`} className="day-cell">
                      <input
                        type="checkbox"
                        checked={Boolean(habit.checks[day.key])}
                        onChange={() => toggleDay(habit.id, day.key)}
                      />
                    </td>
                  ))}

                  <td className="analysis-cell">
                    <div className="analysis-title">Goal / Actual</div>
                    <div className="analysis-value">
                      {habit.goal ?? 0} / {actual}
                    </div>
                    <div 
                      className="habit-circular-progress" 
                      aria-label="Habit progress" 
                      style={{background: `conic-gradient(#10b981 ${progress}%, #e5e7eb 0)`}}
                    >
                      <span className="habit-progress-text">{progress}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2>Daily Summary</h2>
      <div className="table-wrap">
        <table className="analysis-table">
          <thead>
            <tr>
              <th className="habit-col">Status</th>
              {days.map((day) => (
                <th key={day.key} className="analysis-day-col">
                  {day.day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="habit-name-cell">
                <span className="habit-name-text">Done</span>
              </td>
              {days.map((day) => {
                const doneCount = habits.reduce((count, habit) => count + (habit.checks[day.key] ? 1 : 0), 0);
                return (
                  <td key={`done-${day.key}`} className="analysis-count-cell">
                    <span className="done-value">{doneCount}</span>
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="habit-name-cell">
                <span className="habit-name-text">Total</span>
              </td>
              {days.map((day) => (
                <td key={`total-${day.key}`} className="analysis-count-cell">
                  {habits.length}
                </td>
              ))}
            </tr>
            <tr>
              <td className="habit-name-cell">
                <span className="habit-name-text">Progress</span>
              </td>
              {days.map((day) => {
                const doneCount = habits.reduce((count, habit) => count + (habit.checks[day.key] ? 1 : 0), 0);
                const total = habits.length;
                const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

                return (
                  <td key={`progress-${day.key}`} className="analysis-progress-cell">
                    <div 
                      className="mini-circular-progress" 
                      aria-label="Daily progress" 
                      style={{background: `conic-gradient(#16a34a ${percent}%, #e5e7eb 0)`}}
                    >
                      <span className="mini-progress-text">{percent}%</span>
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
