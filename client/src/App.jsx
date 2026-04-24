import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useTaskStore from "./store/useTaskStore";
import useHabitStore from "./store/useHabitStore";
import useAuthStore from "./store/useAuthStore";
import "./App.css";
import HabitPage from "./components/HabitPage";
import TaskPage from "./components/TaskPage";
import Dashboard from "./components/Dashboard";
import Sidebar from "./components/Sidebar";
import AuthPage from "./components/AuthPage";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const { session, loading, initializeAuth, logout } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (session) {
      useTaskStore.getState().fetchTasks();
      useHabitStore.getState().fetchHabits();
    }
  }, [session]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <p style={{fontSize: '1.2rem', color: '#64748b'}}>Verifying Security Session...</p>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        onNavigate={setActiveTab} 
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />
      
      <div className="app-main-wrapper">
        <header className="mobile-header">
          <button className="hamburger-btn" onClick={() => setIsMenuOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2400/svg">
              <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="mobile-header-title">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </span>
          <button 
            onClick={logout} 
            style={{marginLeft: 'auto', background:'none', border:'none', color:'#ef4444', fontWeight:'bold', cursor:'pointer'}}
          >
            Logout
          </button>
        </header>

        <main className="app-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="page-transition-wrapper"
              style={{ height: "100%", width: "100%" }}
            >
              {activeTab === "dashboard" && <Dashboard onNavigate={setActiveTab} />}
              {activeTab === "habits" && <HabitPage />}
              {activeTab === "tasks" && <TaskPage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}