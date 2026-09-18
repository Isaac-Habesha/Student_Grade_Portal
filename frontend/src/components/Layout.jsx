/**
 * Layout component with sidebar navigation.
 * Renders different nav items based on user role.
 */

import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout, isInstructor } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    const wasInstructor = isInstructor;
    await logout();
    navigate(wasInstructor ? '/instructor/login' : '/login');
  };

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : '?';

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-layout">
      {/* Mobile menu toggle */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">GradePortal</div>
          <div className="sidebar-subtitle">Student Grade Management</div>
        </div>

        <nav className="sidebar-nav">
          {isInstructor ? (
            <>
              <NavLink
                to="/instructor/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="nav-icon">📊</span>
                Dashboard
              </NavLink>
              <NavLink
                to="/instructor/courses/create"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="nav-icon">➕</span>
                Create Course
              </NavLink>
              <NavLink
                to="/instructor/students"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="nav-icon">👥</span>
                Manage Students
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/student/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="nav-icon">📚</span>
                My Courses
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials}</div>
            <div className="user-details">
              <div className="user-name">{user?.first_name} {user?.last_name}</div>
              <div className="user-role">
                {user?.role}
                {user?.student_id && ` · ${user.student_id}`}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost w-full mt-2" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 99 }}
          onClick={closeSidebar}
        />
      )}

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
