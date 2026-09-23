import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sun,
  Moon,
  LogOut,
  Shield,
  Layers,
  GraduationCap,
  AlertTriangle,
  ClipboardList,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../theme-provider';

export const CabHeader: React.FC = () => {
  const { user, role, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const isOperator = role === 'operator';

  return (
    <header className="sticky top-0 z-40 w-full bg-surface border-b-2 border-border shadow-sm">
      {/* Top industrial safety stripe header */}
      <div className="h-1.5 w-full bg-[#FFC300]" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <Link to={isOperator ? '/operator' : '/manager'} className="flex items-center gap-2 group">
            {/* Geometric CAT triangle emblem */}
            <div className="w-9 h-9 rounded bg-[#FFC300] flex items-center justify-center font-black text-[#211E1C] text-lg shadow-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#211E1C]">
                <polygon points="12,3 2,21 22,21" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-industrial text-2xl font-black tracking-wider text-text-primary group-hover:text-[#FFC300] transition">
                  CATMATE
                </span>
                <span className="bg-[#211E1C] text-[#FFC300] dark:bg-[#FFC300] dark:text-[#211E1C] text-[10px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest font-industrial">
                  {isOperator ? 'IN-CAB' : 'MANAGER'}
                </span>
              </div>
              <div className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold hidden sm:block">
                Operations &amp; Safety Telemetry
              </div>
            </div>
          </Link>

          {/* Machine tag if operator */}
          {user?.assigned_machine_id && isOperator && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-bg border border-border text-xs font-industrial font-bold uppercase text-text-secondary">
              <span className="w-2 h-2 rounded-full bg-[#3C8C4A] animate-pulse" />
              <span>{user.assigned_machine_id}</span>
              <span className="text-border">•</span>
              <span>{user.site_id}</span>
            </div>
          )}
        </div>

        {/* Center Navigation Shortcuts */}
        <nav className="hidden lg:flex items-center gap-1 text-xs uppercase font-industrial font-bold">
          {isOperator ? (
            <>
              <Link
                to="/operator"
                className={`btn-touch px-3 py-1.5 rounded flex items-center gap-1.5 transition ${
                  location.pathname === '/operator'
                    ? 'bg-[#FFC300] text-[#211E1C]'
                    : 'text-text-secondary hover:bg-stone-200 dark:hover:bg-stone-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/operator/incident"
                className={`btn-touch px-3 py-1.5 rounded flex items-center gap-1.5 transition ${
                  location.pathname === '/operator/incident'
                    ? 'bg-[#FFC300] text-[#211E1C]'
                    : 'text-text-secondary hover:bg-stone-200 dark:hover:bg-stone-800'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Log Incident</span>
              </Link>

              <Link
                to="/operator/training"
                className={`btn-touch px-3 py-1.5 rounded flex items-center gap-1.5 transition ${
                  location.pathname === '/operator/training'
                    ? 'bg-[#FFC300] text-[#211E1C]'
                    : 'text-text-secondary hover:bg-stone-200 dark:hover:bg-stone-800'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Training Hub</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/manager"
                className={`btn-touch px-3 py-1.5 rounded flex items-center gap-1.5 transition ${
                  location.pathname === '/manager'
                    ? 'bg-[#FFC300] text-[#211E1C]'
                    : 'text-text-secondary hover:bg-stone-200 dark:hover:bg-stone-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Fleet Live Grid</span>
              </Link>

              <Link
                to="/manager/allocate"
                className={`btn-touch px-3 py-1.5 rounded flex items-center gap-1.5 transition ${
                  location.pathname === '/manager/allocate'
                    ? 'bg-[#FFC300] text-[#211E1C]'
                    : 'text-text-secondary hover:bg-stone-200 dark:hover:bg-stone-800'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Task Allocation</span>
              </Link>

              <Link
                to="/manager/incidents"
                className={`btn-touch px-3 py-1.5 rounded flex items-center gap-1.5 transition ${
                  location.pathname === '/manager/incidents'
                    ? 'bg-[#FFC300] text-[#211E1C]'
                    : 'text-text-secondary hover:bg-stone-200 dark:hover:bg-stone-800'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Incident &amp; Flags Log</span>
              </Link>
            </>
          )}
        </nav>

        {/* Right Actions: Theme Toggle, User Profile, Logout */}
        <div className="flex items-center gap-2">
          {/* Always Visible Dark/Light Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle High-Contrast Field Lighting Mode"
            title="Toggle Light / Dark Cab Lighting"
            className="btn-touch p-2.5 rounded border border-border bg-bg hover:border-[#FFC300] text-text-primary transition flex items-center justify-center"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-[#FFC300]" />
            ) : (
              <Moon className="w-5 h-5 text-stone-700" />
            )}
          </button>

          {/* User ID & Role Badge */}
          {user && (
            <div className="flex items-center gap-2 pl-1 border-l border-border">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-text-primary truncate max-w-[110px]">
                  {user.name}
                </div>
                <div className="text-[10px] text-text-secondary uppercase font-semibold">
                  {user.user_id}
                </div>
              </div>

              <button
                onClick={() => logout()}
                aria-label="Log Out"
                title="Log out of shift"
                className="btn-touch p-2 rounded border border-border bg-bg hover:bg-red-500 hover:text-white hover:border-red-500 text-text-secondary transition flex items-center justify-center"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Subnav Strip */}
      <div className="lg:hidden flex items-center justify-around border-t border-border bg-surface px-2 py-1.5 text-xs font-industrial font-bold uppercase">
        {isOperator ? (
          <>
            <Link
              to="/operator"
              className={`p-2 flex items-center gap-1 ${
                location.pathname === '/operator' ? 'text-[#FFC300]' : 'text-text-secondary'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/operator/incident"
              className={`p-2 flex items-center gap-1 ${
                location.pathname === '/operator/incident' ? 'text-[#FFC300]' : 'text-text-secondary'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Log</span>
            </Link>
            <Link
              to="/operator/training"
              className={`p-2 flex items-center gap-1 ${
                location.pathname === '/operator/training' ? 'text-[#FFC300]' : 'text-text-secondary'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Training</span>
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/manager"
              className={`p-2 flex items-center gap-1 ${
                location.pathname === '/manager' ? 'text-[#FFC300]' : 'text-text-secondary'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Fleet</span>
            </Link>
            <Link
              to="/manager/allocate"
              className={`p-2 flex items-center gap-1 ${
                location.pathname === '/manager/allocate' ? 'text-[#FFC300]' : 'text-text-secondary'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Allocate</span>
            </Link>
            <Link
              to="/manager/incidents"
              className={`p-2 flex items-center gap-1 ${
                location.pathname === '/manager/incidents' ? 'text-[#FFC300]' : 'text-text-secondary'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Incidents</span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
};
