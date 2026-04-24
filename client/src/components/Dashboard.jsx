import React, { useState, useEffect, useMemo, useRef } from 'react';
import useTaskStore from "../store/useTaskStore";
import useHabitStore from "../store/useHabitStore";
import { generateInsights } from '../services/aiService';
import './Dashboard.css';
import './spinner.css';

function getLocalISOString(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getTodayKey() {
  return getLocalISOString(new Date());
}

export default function Dashboard({ onNavigate }) {
  const tasksByDate = useTaskStore(state => state.tasksByDate);
  const habits = useHabitStore(state => state.habits);

  const data = useMemo(() => {
    const todayKey = getTodayKey();
    const todayDateObj = new Date();
    todayDateObj.setHours(0, 0, 0, 0);

    // Tasks Data
    const todayTasks = tasksByDate[todayKey] || [];
    const completedTasksCount = todayTasks.filter(t => t.done).length;
    const pendingTasksCount = todayTasks.length - completedTasksCount;
    
    // Habits Data
    let todayHabitsCompleted = 0;
    let totalHabits = habits.length;
    let longestStreak = 0;
    let consistencyPercent = 0;
    let currentStreak = 0;

    // Count today's completed
    habits.forEach(h => {
      if (h.checks && h.checks[todayKey]) {
        todayHabitsCompleted++;
      }
    });

    const pastDays = [];
    for (let i = 0; i < 30; i++) { 
       const d = new Date();
       d.setDate(d.getDate() - i);
       pastDays.push(getLocalISOString(d));
    }

    let globalMaxStreak = 0;
    let globalActiveStreak = 0;
    
    habits.forEach(h => {
      if (!h.checks) return;

      const checkedDates = Object.keys(h.checks)
        .filter(k => h.checks[k] && /^\d{4}-\d{2}-\d{2}$/.test(k))
        .map(k => {
          const [y, m, d] = k.split('-');
          return new Date(Number(y), Number(m) - 1, Number(d));
        })
        .sort((a, b) => a - b);

      let currentHabitStreak = 0;
      let maxHabitStreak = 0;
      
      if (checkedDates.length > 0) {
        let tempStreak = 1;
        maxHabitStreak = 1;

        for (let i = 1; i < checkedDates.length; i++) {
          const diffTime = Math.abs(checkedDates[i] - checkedDates[i - 1]);
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            tempStreak++;
            if (tempStreak > maxHabitStreak) {
              maxHabitStreak = tempStreak;
            }
          } else if (diffDays > 1) {
            tempStreak = 1;
          }
        }
      }

      let tempCurrent = 0;
      let streakActive = true;
      let safetyCounter = 0;
      let backDate = new Date();
      
      while (streakActive && safetyCounter < 10000) {
        const k = getLocalISOString(backDate);
        if (h.checks[k]) {
          tempCurrent++;
        } else {
          if (safetyCounter !== 0) {
            streakActive = false;
          }
        }
        backDate.setDate(backDate.getDate() - 1);
        safetyCounter++;
      }
      currentHabitStreak = tempCurrent;

      if (maxHabitStreak > globalMaxStreak) globalMaxStreak = maxHabitStreak;
      if (currentHabitStreak > globalActiveStreak) globalActiveStreak = currentHabitStreak;
    });
    
    longestStreak = globalMaxStreak;
    currentStreak = globalActiveStreak;
    
    let totalChecks30Days = 0;
    habits.forEach(h => {
       pastDays.forEach(k => {
          if (h.checks && h.checks[k]) totalChecks30Days++;
       });
    });
    
    if (totalHabits > 0) {
      consistencyPercent = Math.round((totalChecks30Days / (totalHabits * 30)) * 100);
    }

    const insights = [];
    if (pendingTasksCount > 0) {
      insights.push({ icon: '🎯', text: `You have ${pendingTasksCount} tasks remaining today. Let's finish strong!` });
    } else if (todayTasks.length > 0 && pendingTasksCount === 0) {
      insights.push({ icon: '🎉', text: "Incredible! You completed all your tasks for today." });
    } else {
      insights.push({ icon: '✍️', text: "Your task list is empty today. Plan your day to stay productive!" });
    }

    if (totalHabits > 0 && todayHabitsCompleted === totalHabits) {
      insights.push({ icon: '🔥', text: "Perfect day! You've checked off every habit today." });
    } else if (todayHabitsCompleted > 0) {
      insights.push({ icon: '💡', text: `You've got ${todayHabitsCompleted} habits done. Keep up the good work!` });
    } else {
      insights.push({ icon: '🌱', text: "A fresh start! Don't forget to complete your habits today." });
    }

    return {
      tasks: {
        today: todayTasks.slice(0, 3), // max 3 preview
        completed: completedTasksCount,
        total: todayTasks.length
      },
      habits: {
        todayCompleted: todayHabitsCompleted,
        total: totalHabits,
        longestStreak,
        currentStreak,
        consistencyPercent
      },
      insights
    };
  }, [tasksByDate, habits]);

  const [aiInsights, setAiInsights] = useState(data.insights);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Reference for initial data so we don't spam the AI endpoint on every state change
  const initialDataRef = useRef(data);

  useEffect(() => {
    async function fetchAi() {
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        setAiInsights(initialDataRef.current.insights);
        return;
      }
      
      setIsAiLoading(true);
      try {
        const generated = await generateInsights(initialDataRef.current);
        if (generated && generated.length > 0) {
          setAiInsights(generated);
        }
      } catch (err) {
        console.error("AI Insights Error:", err);
      } finally {
        setIsAiLoading(false);
      }
    }
    
    fetchAi();
  }, []); // Run once on mount

  // SVG Icons
  const Icons = {
    flame: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>,
    checkCircle: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    list: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    activity: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    plus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  };

  const habitProgress = data.habits.total === 0 ? 0 : Math.round((data.habits.todayCompleted / data.habits.total) * 100);

  return (
    <div className="dashboard-container">
      {/* 1. Top Row: Motivation Section */}
      <section className="dashboard-row motivation-card">
        <div className="motivation-content">
          <div className="motivation-icon">✨</div>
          <div className="motivation-text">
            <h2>Welcome back!</h2>
            <p>"Small daily improvements over time lead to stunning results." Keep up the momentum today.</p>
          </div>
        </div>
      </section>

      {/* 2. Second Row: Main Stats Grid */}
      <section className="dashboard-row stats-grid">
        {/* Card 1: Today's Habit Summary */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">{Icons.checkCircle}</span>
            <h3>Today's Habits</h3>
          </div>
          <div className="stat-body">
            <div className="circular-progress" style={{background: `conic-gradient(#10b981 ${habitProgress}%, #f1f5f9 0)`}}>
              <span className="progress-text">{data.habits.todayCompleted}/{data.habits.total}</span>
            </div>
            <p className="stat-subtext">{habitProgress}% completed</p>
          </div>
        </div>

        {/* Card 2: Today's Tasks */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">{Icons.list}</span>
            <h3>Today's Tasks</h3>
          </div>
          <div className="stat-body task-list-preview">
            {data.tasks.today.length === 0 ? (
               <p className="stat-subtext" style={{marginTop: 0}}>No tasks for today.</p>
            ) : (
               data.tasks.today.map(task => (
                 <div key={task.id} className={`task-item ${task.done ? 'completed' : ''}`}>
                   <div className="task-checkbox">{task.done ? '✓' : ''}</div>
                   <span>{task.name}</span>
                 </div>
               ))
            )}
            <p className="stat-subtext" style={{marginTop: 'auto'}}>{data.tasks.completed} of {data.tasks.total} tasks completed</p>
          </div>
        </div>

        {/* Card 3: Longest Streak */}
        <div className="stat-card highlight-card">
          <div className="stat-header">
            <span className="stat-icon flame-icon">{Icons.flame}</span>
            <h3>Longest Streak</h3>
          </div>
          <div className="stat-body streak-body">
            <div className="streak-number">{data.habits.longestStreak}</div>
            <p className="stat-subtext">Days in a row</p>
          </div>
        </div>

        {/* Card 4: Overall Consistency */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">{Icons.activity}</span>
            <h3>Consistency</h3>
          </div>
          <div className="stat-body consistency-body">
            <div className="consistency-number">{data.habits.consistencyPercent}%</div>
            <div className="consistency-bar">
              <div className="consistency-fill" style={{ width: `${data.habits.consistencyPercent}%` }}></div>
            </div>
            <p className="stat-subtext">Last 30 days</p>
          </div>
        </div>
      </section>

      {/* 3. Third Row: Actions + Insights */}
      <section className="dashboard-row insights-row">
        {/* Left Section: Quick Actions */}
        <div className="insight-card quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button className="btn-primary" onClick={() => onNavigate('habits')}>
              {Icons.plus} Add Habit
            </button>
            <button className="btn-secondary" onClick={() => onNavigate('tasks')}>
              {Icons.plus} Add Task
            </button>
            <button className="btn-secondary">
              {Icons.clock} Focus Timer
            </button>
          </div>
        </div>

        {/* Middle Section: Current Streak */}
        <div className="insight-card current-streak">
          <h3>Current Streak</h3>
          <div className="current-streak-content">
            <div className="flame-large">{Icons.flame}</div>
            <div className="streak-info">
              <span className="streak-count">{data.habits.currentStreak} Days</span>
              <span className="streak-goal">Goal: 30 days</span>
            </div>
          </div>
          <div className="streak-progress">
             {Array.from({length: 7}).map((_, i) => {
                const isActive = data.habits.currentStreak > 0 && i < ((data.habits.currentStreak - 1) % 7 + 1);
                return <div key={i} className={`streak-dot ${isActive ? 'active' : ''}`}></div>;
             })}
          </div>
          <p className="streak-hint">You're on fire! Keep it going.</p>
        </div>

        {/* Right Section: Suggestions / AI Insights */}
        <div className="insight-card ai-insights">
          <h3>AI Insights</h3>
          {isAiLoading ? (
             <div className="insights-loading">
                <div className="spinner"></div>
                <p>Consulting your AI coach...</p>
             </div>
          ) : (
            <ul className="insights-list">
              {aiInsights.map((insight, idx) => (
                 <li key={idx}>
                   <span className="insight-bullet">{insight.icon}</span>
                   <p>{insight.text}</p>
                 </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
