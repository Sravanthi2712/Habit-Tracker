import { useState } from "react";
import "./App.css";
import HabitPage from "./components/HabitPage";
import TaskPage from "./components/TaskPage";

export default function App() {
  const [activeTab, setActiveTab] = useState("habits");

  return (
    <div className="app-container">
      <nav className="app-nav">
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
        {activeTab === "habits" && <HabitPage />}
        {activeTab === "tasks" && <TaskPage />}
      </main>
    </div>
  );
}