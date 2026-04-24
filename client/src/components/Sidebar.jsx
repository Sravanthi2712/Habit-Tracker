import React from 'react';
import './Sidebar.css';

const Sidebar = ({ activeTab, onNavigate, isMenuOpen, setIsMenuOpen }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMenuOpen(false)}></div>
      )}
      
      <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
        <button className="close-btn" onClick={() => setIsMenuOpen(false)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2400/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="sidebar-header">
          <div className="profile-picture-container">
            <img 
              src="https://api.dicebear.com/9.x/micah/svg?seed=Lily&backgroundColor=e2e8f0&baseColor=f9c9b6" 
              alt="Profile" 
              className="profile-picture" 
            />
          </div>
          <h2 className="profile-name">Guest</h2>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">Main Menu</span>
            <button
              className={`nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => { onNavigate("dashboard"); setIsMenuOpen(false); }}
            >
              Dashboard
            </button>
            <button
              className={`nav-btn ${activeTab === "habits" ? "active" : ""}`}
              onClick={() => { onNavigate("habits"); setIsMenuOpen(false); }}
            >
              Habits
            </button>
            <button
              className={`nav-btn ${activeTab === "tasks" ? "active" : ""}`}
              onClick={() => { onNavigate("tasks"); setIsMenuOpen(false); }}
            >
              Tasks
            </button>
          </div>

          <div className="nav-section mt-auto">
             <span className="nav-section-title">Preferences</span>
            <button
              className="nav-btn"
              onClick={() => { /* Settings later */ setIsMenuOpen(false); }}
            >
               Settings
            </button>
            <button
              className="nav-btn logout-btn"
              onClick={() => { /* Logout later */ setIsMenuOpen(false); }}
            >
               Logout
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
