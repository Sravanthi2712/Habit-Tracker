import { useState } from "react";
import "./App.css";
import HabitPage from "./components/HabitPage";
import TaskPage from "./components/TaskPage";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="app-container">
      <nav className="app-nav">
        <button
          className={activeTab === "dashboard" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={activeTab === "habits" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveTab("habits")}
        >
          Habits
        </button>
        <button
          className={activeTab === "tasks" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveTab("tasks")}
        >
          Tasks
        </button>
      </nav>
      
      <main className="app-content">
        {activeTab === "dashboard" && <Dashboard onNavigate={setActiveTab} />}
        {activeTab === "habits" && <HabitPage />}
        {activeTab === "tasks" && <TaskPage />}
      </main>
    </div>
  );
}