'use client';

import { useAuthStore } from '@contractor/shared';
import Link from 'next/link';
import { useEffect } from 'react';
import './page.css';

export default function Home() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {}, [isAuthenticated]);

  return (
    <div className="home-container">
      {isAuthenticated ? (
        <div className="dashboard">
          <div className="welcome-section">
            <h2>Welcome back, {user?.name || 'User'}!</h2>
            <p>Here's your project overview</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">5</div>
              <div className="stat-label">Active Projects</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">12</div>
              <div className="stat-label">Pending Tasks</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">3</div>
              <div className="stat-label">At Risk</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">8</div>
              <div className="stat-label">Completed This Month</div>
            </div>
          </div>

          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <Link href="/projects" className="btn btn-primary">
                View All Projects
              </Link>
              <Link href="/tasks" className="btn btn-secondary">
                My Tasks
              </Link>
              <Link href="/reports" className="btn btn-secondary">
                Reports
              </Link>
            </div>
          </div>

          <div className="recent-projects">
            <h3>Recent Projects</h3>
            <div className="project-list">
              <div className="project-item">
                <h4>Building A - Phase 2</h4>
                <p>65% Complete</p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div className="project-item">
                <h4>Building B - Foundation</h4>
                <p>45% Complete</p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div className="project-item">
                <h4>Building C - Planning</h4>
                <p>20% Complete</p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '20%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="landing">
          <div className="hero">
            <h2>Welcome to Contractor Dashboard</h2>
            <p>Manage your projects efficiently across all platforms</p>
            <Link href="/login" className="btn btn-primary btn-lg">
              Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
