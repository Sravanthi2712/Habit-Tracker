import { useState } from "react";
import DailyTaskView from "./DailyTaskView";
import RangeTaskPage from "./RangeTaskPage";
import "./TaskPage.css";

export default function TaskPage() {
  const [view, setView] = useState("day");

  return (
    <div className="task-tab-wrapper">
      <div className="view-toggle-bar">
        <button 
          className={view === "day" ? "toggle-btn active" : "toggle-btn"}
          onClick={() => setView("day")}
        >
          Day View
        </button>
        <button 
          className={view === "range" ? "toggle-btn active" : "toggle-btn"}
          onClick={() => setView("range")}
        >
          Range View
        </button>
      </div>

      <div className="task-view-container">
        {view === "day" ? <DailyTaskView /> : <RangeTaskPage />}
      </div>
    </div>
  );
}
